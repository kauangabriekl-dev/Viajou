/**
 * Matemática do globo da home. Reproduz a projeção da biblioteca cobe (v2),
 * para posicionar os marcadores HTML exatamente sobre os pontos desenhados em WebGL.
 * Sem DOM: funções puras, testadas em tests/globe.test.ts.
 */

/** Raio do globo no espaço da cobe (a esfera ocupa 80% da metade do canvas). */
const GLOBE_RADIUS = 0.8;
const TAU = Math.PI * 2;

export type GlobeView = { phi: number; theta: number };
export type ScreenPoint = { x: number; y: number; visible: boolean };

/** Latitude/longitude em graus → ponto 3D na esfera unitária (mesma convenção da cobe). */
export function toSphere(latitude: number, longitude: number): [number, number, number] {
  const lat = (latitude * Math.PI) / 180;
  const lng = (longitude * Math.PI) / 180 - Math.PI;
  const r = Math.cos(lat);
  return [-r * Math.cos(lng), Math.sin(lat), r * Math.sin(lng)];
}

/**
 * Posição de uma coordenada no canvas, de 0 a 1 em cada eixo (0,0 = canto superior esquerdo).
 * `visible` é falso quando o ponto está do lado de trás do planeta.
 * `zoom` é a opção `scale` da cobe (1 = planeta inteiro; maior = aproximado).
 */
export function project(
  latitude: number,
  longitude: number,
  { phi, theta }: GlobeView,
  elevation = 0,
  zoom = 1,
): ScreenPoint {
  const radius = GLOBE_RADIUS + elevation;
  const [px, py, pz] = toSphere(latitude, longitude).map((v) => v * radius);
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const cosP = Math.cos(phi);
  const sinP = Math.sin(phi);
  const x = cosP * px + sinP * pz;
  const y = sinP * sinT * px + cosT * py - cosP * sinT * pz;
  const depth = -sinP * cosT * px + sinT * py + cosP * cosT * pz;
  return { x: (x * zoom + 1) / 2, y: (-y * zoom + 1) / 2, visible: depth >= 0 };
}

/** Ângulos que deixam a coordenada no centro do globo, de frente para quem olha. */
export function viewFacing(latitude: number, longitude: number): GlobeView {
  const phi = (3 * Math.PI) / 2 - (longitude * Math.PI) / 180;
  return { phi: wrapAngle(phi), theta: (latitude * Math.PI) / 180 };
}

/** Normaliza um ângulo para [0, 2π). */
export function wrapAngle(angle: number): number {
  return ((angle % TAU) + TAU) % TAU;
}

/** Diferença angular pelo caminho mais curto, em (-π, π]. */
export function shortestDelta(from: number, to: number): number {
  const delta = wrapAngle(to - from);
  return delta > Math.PI ? delta - TAU : delta;
}

/** Inclinação vertical permitida ao arrastar (evita virar o planeta de cabeça para baixo). */
export const THETA_LIMIT = 0.9;

export function clampTheta(theta: number): number {
  return Math.max(-THETA_LIMIT, Math.min(THETA_LIMIT, theta));
}
