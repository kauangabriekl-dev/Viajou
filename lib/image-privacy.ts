/**
 * Remove a localização (GPS) das fotos antes de gravar. Fotos de celular guardam latitude e
 * longitude nos metadados EXIF/XMP; um achadinho é público, mas a foto pode ter sido tirada em casa.
 *
 * - JPEG: zera o bloco GPS do EXIF (mantém a orientação, senão a foto apareceria deitada)
 *   e remove segmentos XMP, que também podem ter coordenadas.
 * - PNG: remove o chunk eXIf.
 * - WebP: remove os chunks EXIF e XMP e ajusta os tamanhos e as flags do cabeçalho.
 *
 * Arquivo que não segue o formato esperado volta sem mudança (a validação de assinatura já
 * garantiu que é imagem); quem chama decide se aceita.
 */
export function stripLocation(input: Uint8Array, mime: string): Uint8Array {
  try {
    if (mime === "image/jpeg") return stripJpeg(input);
    if (mime === "image/png") return stripPng(input);
    if (mime === "image/webp") return stripWebp(input);
  } catch {
    // Estrutura inesperada: devolve o original sem alterar.
  }
  return input;
}

// --------------------------------------------------------------------------- JPEG
const XMP_ID = "http://ns.adobe.com/xap/1.0/";

function stripJpeg(input: Uint8Array): Uint8Array {
  if (input[0] !== 0xff || input[1] !== 0xd8) return input;
  const out = new Uint8Array(input); // cópia: o GPS é zerado no lugar
  const keep: [number, number][] = [[0, 2]];
  let pos = 2;
  while (pos + 4 <= out.length) {
    if (out[pos] !== 0xff) return input;
    const marker = out[pos + 1];
    if (marker === 0xda) break; // início da imagem comprimida: o resto vai inteiro
    const length = (out[pos + 2] << 8) | out[pos + 3];
    const end = pos + 2 + length;
    if (end > out.length) return input;
    const payloadStart = pos + 4;
    if (marker === 0xe1) {
      const id = ascii(out, payloadStart, XMP_ID.length);
      if (id === XMP_ID) {
        pos = end; // XMP: remove o segmento inteiro
        continue;
      }
      if (ascii(out, payloadStart, 4) === "Exif") zeroExifGps(out, payloadStart + 6, end);
    }
    keep.push([pos, end]);
    pos = end;
  }
  keep.push([pos, out.length]);
  return concat(keep.map(([a, b]) => out.subarray(a, b)));
}

/** Zera o diretório GPS (entradas e valores) dentro do bloco TIFF do EXIF. */
function zeroExifGps(buf: Uint8Array, tiffStart: number, limit: number) {
  const little = buf[tiffStart] === 0x49 && buf[tiffStart + 1] === 0x49;
  const big = buf[tiffStart] === 0x4d && buf[tiffStart + 1] === 0x4d;
  if (!little && !big) return;
  const u16 = (o: number) => (little ? buf[o] | (buf[o + 1] << 8) : (buf[o] << 8) | buf[o + 1]);
  const u32 = (o: number) =>
    (little
      ? buf[o] | (buf[o + 1] << 8) | (buf[o + 2] << 16) | (buf[o + 3] << 24)
      : (buf[o] << 24) | (buf[o + 1] << 16) | (buf[o + 2] << 8) | buf[o + 3]) >>> 0;
  const at = (offset: number) => tiffStart + offset;
  const inside = (o: number, size: number) => o >= tiffStart && o + size <= limit;

  const ifd0 = at(u32(tiffStart + 4));
  if (!inside(ifd0, 2)) return;
  const count = u16(ifd0);
  for (let i = 0; i < count; i++) {
    const entry = ifd0 + 2 + i * 12;
    if (!inside(entry, 12)) return;
    if (u16(entry) !== 0x8825) continue; // GPSInfo
    const gps = at(u32(entry + 8));
    if (!inside(gps, 2)) return;
    const gpsCount = u16(gps);
    const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
    for (let j = 0; j < gpsCount; j++) {
      const g = gps + 2 + j * 12;
      if (!inside(g, 12)) break;
      const size = (TYPE_SIZE[u16(g + 2)] ?? 1) * u32(g + 4);
      if (size > 4) {
        const data = at(u32(g + 8));
        if (inside(data, size)) buf.fill(0, data, data + size); // valor fora da entrada (coordenadas)
      }
      buf.fill(0, g, g + 12);
    }
    buf.fill(0, gps, gps + 2); // diretório GPS fica vazio
  }
}

// --------------------------------------------------------------------------- PNG
function stripPng(input: Uint8Array): Uint8Array {
  const parts: Uint8Array[] = [input.subarray(0, 8)];
  let pos = 8;
  while (pos + 12 <= input.length) {
    const length =
      ((input[pos] << 24) | (input[pos + 1] << 16) | (input[pos + 2] << 8) | input[pos + 3]) >>> 0;
    const end = pos + 12 + length;
    if (end > input.length) return input;
    if (ascii(input, pos + 4, 4) !== "eXIf") parts.push(input.subarray(pos, end));
    pos = end;
  }
  if (pos !== input.length) return input;
  return concat(parts);
}

// --------------------------------------------------------------------------- WebP
function stripWebp(input: Uint8Array): Uint8Array {
  if (ascii(input, 0, 4) !== "RIFF" || ascii(input, 8, 4) !== "WEBP") return input;
  const chunks: Uint8Array[] = [];
  let pos = 12;
  while (pos + 8 <= input.length) {
    const size =
      input[pos + 4] | (input[pos + 5] << 8) | (input[pos + 6] << 16) | (input[pos + 7] << 24);
    const end = pos + 8 + size + (size % 2);
    if (end > input.length) return input;
    const id = ascii(input, pos, 4);
    if (id !== "EXIF" && id !== "XMP ") chunks.push(new Uint8Array(input.subarray(pos, end)));
    pos = end;
  }
  const vp8x = chunks.find((c) => ascii(c, 0, 4) === "VP8X");
  if (vp8x) vp8x[8] &= ~(0x08 | 0x04); // flags: sem EXIF, sem XMP
  const body = concat(chunks);
  const out = new Uint8Array(12 + body.length);
  out.set(input.subarray(0, 12));
  const riffSize = 4 + body.length;
  out[4] = riffSize & 0xff;
  out[5] = (riffSize >> 8) & 0xff;
  out[6] = (riffSize >> 16) & 0xff;
  out[7] = (riffSize >> 24) & 0xff;
  out.set(body, 12);
  return out;
}

// --------------------------------------------------------------------------- utilitários
function ascii(buf: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...buf.subarray(start, start + length));
}

function concat(parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}
