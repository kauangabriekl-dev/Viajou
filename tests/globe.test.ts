import { describe, expect, it } from "vitest";
import {
  clampTheta,
  project,
  shortestDelta,
  THETA_LIMIT,
  toSphere,
  viewFacing,
  wrapAngle,
} from "@/lib/globe";

const rio = { lat: -22.91, lng: -43.17 };
const tokyo = { lat: 35.68, lng: 139.69 };

describe("globo", () => {
  it("coordenadas viram pontos na esfera unitária", () => {
    const [x, y, z] = toSphere(rio.lat, rio.lng);
    expect(Math.hypot(x, y, z)).toBeCloseTo(1, 10);
    expect(toSphere(90, 0)[1]).toBeCloseTo(1, 10);
  });

  it("o destino escolhido fica no centro e visível", () => {
    const view = viewFacing(rio.lat, rio.lng);
    const p = project(rio.lat, rio.lng, view);
    expect(p.x).toBeCloseTo(0.5, 6);
    expect(p.y).toBeCloseTo(0.5, 6);
    expect(p.visible).toBe(true);
  });

  it("o lado oposto do planeta fica escondido", () => {
    const view = viewFacing(rio.lat, rio.lng);
    expect(project(tokyo.lat, tokyo.lng, view).visible).toBe(false);
  });

  it("norte fica acima do centro na tela", () => {
    const view = viewFacing(0, -45);
    expect(project(30, -45, view).y).toBeLessThan(0.5);
    expect(project(-30, -45, view).y).toBeGreaterThan(0.5);
  });

  it("leste fica à direita do centro na tela", () => {
    const view = viewFacing(0, -45);
    expect(project(0, -15, view).x).toBeGreaterThan(0.5);
    expect(project(0, -75, view).x).toBeLessThan(0.5);
  });

  it("zoom afasta os pontos do centro na mesma proporção", () => {
    const view = viewFacing(0, -45);
    const normal = project(0, -30, view);
    const zoomed = project(0, -30, view, 0, 2);
    expect(zoomed.x - 0.5).toBeCloseTo((normal.x - 0.5) * 2, 10);
    expect(project(0, -45, view, 0, 2).x).toBeCloseTo(0.5, 10);
  });

  it("ângulos: normalização e caminho mais curto", () => {
    expect(wrapAngle(-Math.PI / 2)).toBeCloseTo((3 * Math.PI) / 2, 10);
    expect(shortestDelta(0.1, Math.PI * 2 - 0.1)).toBeCloseTo(-0.2, 10);
    expect(shortestDelta(Math.PI * 2 - 0.1, 0.1)).toBeCloseTo(0.2, 10);
  });

  it("inclinação vertical é limitada", () => {
    expect(clampTheta(5)).toBe(THETA_LIMIT);
    expect(clampTheta(-5)).toBe(-THETA_LIMIT);
    expect(clampTheta(0.3)).toBe(0.3);
  });
});
