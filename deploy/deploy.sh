#!/usr/bin/env bash
# 一键部署:本地构建 → 上传到 ECS 的 Nginx 根目录
# 用法:  ./deploy/deploy.sh root@你的服务器IP或域名
# 例如:  ./deploy/deploy.sh root@1.2.3.4
# 在 Windows 上用 Git Bash 运行即可(用到 ssh / tar,均已自带)。
set -euo pipefail

HOST="${1:-}"
TARGET="${TARGET:-/var/www/lottery}"   # 服务器上的网站目录(与 nginx.conf 的 root 一致)

if [ -z "$HOST" ]; then
  echo "用法: ./deploy/deploy.sh user@host   (例: root@1.2.3.4)" >&2
  exit 1
fi

echo "▶ 构建生产包..."
npm run build

echo "▶ 清理远端旧文件并上传 dist ..."
ssh "$HOST" "mkdir -p '$TARGET' && rm -rf '$TARGET'/*"
tar -C dist -czf - . | ssh "$HOST" "tar -C '$TARGET' -xzf -"

echo "▶ 重载 Nginx ..."
ssh "$HOST" "nginx -t && (systemctl reload nginx || nginx -s reload)"

echo "✅ 部署完成。打开 https://你的域名 查看。"
