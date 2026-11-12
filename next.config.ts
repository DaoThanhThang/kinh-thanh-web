import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Module có file nhị phân gốc: để Node tự require, không để bundler gộp (D56).
  serverExternalPackages: ['@resvg/resvg-js', 'nodemailer', 'sharp'],
  // Trên Vercel, /public được phục vụ từ CDN chứ không nằm trong hàm serverless: phải kèm ảnh viên
  // (để nhúng vào ảnh khay) và file font của ảnh khay vào gói của route này.
  outputFileTracingIncludes: {
    '/api/order': ['./public/chocolates/**/*', './src/lib/order-email/fonts/**/*'],
  },
};

export default nextConfig;
