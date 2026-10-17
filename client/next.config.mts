import { fileURLToPath } from 'url';
import path from 'path';
import type { NextConfig } from 'next';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      svg: path.resolve(dirname, './components/assets/svg'),
    },
  },
};

export default nextConfig;
