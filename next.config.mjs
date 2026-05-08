/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '8mb',
    },
    optimizePackageImports: [
      'lucide-react',
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/pm',
      'date-fns',
      'radix-ui',
      '@supabase/supabase-js',
      'zod',
    ],
  },
};

export default nextConfig;
