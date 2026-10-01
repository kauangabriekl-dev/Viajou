import { describe, expect, it } from "vitest";
import { stripLocation } from "@/lib/image-privacy";

const bytes = (...parts: (number[] | string | Uint8Array)[]) => {
  const arrays = parts.map((p) =>
    typeof p === "string"
      ? new TextEncoder().encode(p)
      : p instanceof Uint8Array
        ? p
        : Uint8Array.from(p),
  );
  const out = new Uint8Array(arrays.reduce((n, a) => n + a.length, 0));
  let o = 0;
  for (const a of arrays) {
    out.set(a, o);
    o += a.length;
  }
  return out;
};
const indexOf = (hay: Uint8Array, needle: number[]) => {
  outer: for (let i = 0; i <= hay.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
};

/** TIFF (little-endian): IFD0 com Orientação=6 e ponteiro para o GPS; GPS com latitude (3 racionais). */
function tiffWithGps() {
  const le16 = (n: number) => [n & 0xff, n >> 8];
  const le32 = (n: number) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, n >>> 24];
  const ifd0 = 8;
  const gpsIfd = ifd0 + 2 + 2 * 12 + 4; // 38
  const latData = gpsIfd + 2 + 12 + 4; // 56
  const latitude = [23, 1, 33, 1, 2210, 100].flatMap(le32); // 23° 33' 22.10" (valor que deve sumir)
  return Uint8Array.from([
    0x49,
    0x49,
    0x2a,
    0x00,
    ...le32(ifd0),
    ...le16(2),
    ...le16(0x0112),
    ...le16(3),
    ...le32(1),
    ...le16(6),
    0,
    0, // Orientation = 6
    ...le16(0x8825),
    ...le16(4),
    ...le32(1),
    ...le32(gpsIfd), // GPSInfo
    ...le32(0),
    ...le16(1),
    ...le16(0x0002),
    ...le16(5),
    ...le32(3),
    ...le32(latData), // GPSLatitude
    ...le32(0),
    ...latitude,
  ]);
}

function jpegWithGps() {
  const exif = bytes("Exif", [0, 0], tiffWithGps());
  const xmp = bytes("http://ns.adobe.com/xap/1.0/", [0], "<x:xmpmeta exif:GPSLatitude='23,33'/>");
  const seg = (marker: number, payload: Uint8Array) =>
    bytes([0xff, marker, (payload.length + 2) >> 8, (payload.length + 2) & 0xff], payload);
  const scan = [0xff, 0xda, 0x00, 0x04, 0x01, 0x02, 0x11, 0x22, 0x33, 0xff, 0xd9];
  return bytes([0xff, 0xd8], seg(0xe0, bytes("JFIF", [0])), seg(0xe1, exif), seg(0xe1, xmp), scan);
}

describe("remoção de localização das fotos", () => {
  it("JPEG: zera o GPS, mantém a orientação e a imagem", () => {
    const original = jpegWithGps();
    const latitudeBytes = [23, 0, 0, 0, 1, 0, 0, 0, 33, 0, 0, 0];
    expect(indexOf(original, latitudeBytes)).toBeGreaterThan(0);

    const clean = stripLocation(original, "image/jpeg");
    expect(indexOf(clean, latitudeBytes)).toBe(-1); // coordenadas apagadas
    expect(indexOf(clean, [0x12, 0x01, 0x03, 0x00, 0x01, 0, 0, 0, 0x06, 0x00])).toBeGreaterThan(0); // Orientation=6
    expect(new TextDecoder().decode(clean)).not.toContain("GPSLatitude"); // XMP removido
    expect(Array.from(clean.slice(-11))).toEqual([
      0xff, 0xda, 0x00, 0x04, 0x01, 0x02, 0x11, 0x22, 0x33, 0xff, 0xd9,
    ]);
    expect(Array.from(clean.slice(0, 2))).toEqual([0xff, 0xd8]);
  });

  it("PNG: remove o chunk eXIf e mantém os demais", () => {
    const chunk = (type: string, data: number[]) =>
      bytes([0, 0, 0, data.length], type, data, [0, 0, 0, 0]);
    const png = bytes(
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      chunk("IHDR", [1, 2, 3]),
      chunk("eXIf", [9, 9, 9, 9]),
      chunk("IDAT", [7, 7]),
      chunk("IEND", []),
    );
    const text = new TextDecoder("latin1").decode(stripLocation(png, "image/png"));
    expect(text).not.toContain("eXIf");
    expect(text).toContain("IHDR");
    expect(text).toContain("IDAT");
    expect(text).toContain("IEND");
  });

  it("WebP: remove EXIF e XMP, corrige tamanhos e flags", () => {
    const chunk = (id: string, data: number[]) =>
      bytes(id, [data.length & 0xff, 0, 0, 0], data, data.length % 2 ? [0] : []);
    const vp8x = chunk("VP8X", [0x0c, 0, 0, 0, 0, 0, 0, 0, 0, 0]); // flags EXIF + XMP ligadas
    const body = bytes(
      vp8x,
      chunk("VP8 ", [1, 2, 3, 4]),
      chunk("EXIF", [5, 5, 5]),
      chunk("XMP ", [6, 6]),
    );
    const size = 4 + body.length;
    const webp = bytes("RIFF", [size & 0xff, size >> 8, 0, 0], "WEBP", body);

    const clean = stripLocation(webp, "image/webp");
    const text = new TextDecoder("latin1").decode(clean);
    expect(text).not.toContain("EXIF");
    expect(text).not.toContain("XMP ");
    expect(clean[4] | (clean[5] << 8)).toBe(clean.length - 8); // tamanho RIFF coerente
    expect(clean[20] & 0x0c).toBe(0); // flags de EXIF/XMP desligadas
  });

  it("arquivo sem metadados ou de outro tipo volta igual", () => {
    const tiny = Uint8Array.from([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02, 0xff, 0xd9]);
    expect(Array.from(stripLocation(tiny, "image/jpeg"))).toEqual(Array.from(tiny));
    expect(stripLocation(tiny, "image/gif")).toBe(tiny);
  });
});
