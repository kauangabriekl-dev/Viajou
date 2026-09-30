import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  images: {
    // Fotos enviadas pelos usuários (bucket público "photos" do Supabase Storage).
    remotePatterns: supabaseUrl ? [new URL(`${supabaseUrl}/storage/v1/object/public/**`)] : [],
    // Só para desenvolvimento com Supabase local (supabase start em 127.0.0.1). Nunca em produção.
    dangerouslyAllowLocalIP: process.env.NEXT_IMAGES_ALLOW_LOCAL_IP === "true",
  },
  experimental: {
    serverActions: {
      // Até 10 fotos de 5 MB por publicação, com folga para os campos do formulário.
      bodySizeLimit: "55mb",
    },
  },
};

export default nextConfig;
