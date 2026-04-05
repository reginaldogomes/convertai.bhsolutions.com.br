import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverActions: {
    bodySizeLimit: '8mb',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
    ],
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/pm',
    ],
  },
};

export default nextConfig;
