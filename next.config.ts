import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // jsdomはNode.jsネイティブモジュールに依存するため、Webpackバンドルから除外し
  // サーバーレス関数で正しく読み込まれるようにする
  serverExternalPackages: ['jsdom'],
};

export default nextConfig;
