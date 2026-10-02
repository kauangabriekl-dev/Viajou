import type { NextConfig } from "next";

// Política de segurança de conteúdo: tudo da própria origem; só os mapas (tiles do
// OpenStreetMap) vêm de fora. 'unsafe-inline' é necessário para a hidratação do Next e
// os estilos embutidos do Leaflet/Tailwind; não há 'unsafe-eval' na build de produção.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // GPS é usado só para marcar achadinhos (na própria origem); câmera e microfone, nunca.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  // Só vale sob HTTPS; o navegador ignora em http://localhost.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Não anuncia a tecnologia e versão do servidor.
  poweredByHeader: false,
  images: {
    // Fotos do próprio site: paisagens em public/images e envios dos usuários em /fotos/...
    localPatterns: [{ pathname: "/images/**" }, { pathname: "/fotos/**" }],
  },
  // Arquivos lidos do disco em tempo de execução: garante que vão junto no deploy.
  outputFileTracingIncludes: {
    "/api/lugares": ["./data/geo/places.json"],
  },
  experimental: {
    serverActions: {
      // Até 10 fotos de 5 MB por publicação, com folga para os campos do formulário.
      bodySizeLimit: "55mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
