import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 候選人照片可能來自任何網址，用一般 <img> 顯示，不經過 Next 圖片最佳化
  poweredByHeader: false,
};

export default nextConfig;
