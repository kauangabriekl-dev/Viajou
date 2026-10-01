import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
