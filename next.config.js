// module.exports = {
//   reactStrictMode: false,
//   // output: 'export',
//   compress: true,
//   images: {
//     formats: ['image/avif', 'image/webp'],
//   },
// };

const nextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
