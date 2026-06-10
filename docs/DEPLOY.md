# 部署到阿里云 ECS(Nginx + HTTPS)

本项目是**纯静态网站**:`npm run build` 产出的 `dist/` 就是全部成品,服务器上只要一个 Nginx 把它发出去即可,不需要 Node、数据库或任何后端。

> 思路:**本地构建 → 上传 dist 到 ECS → Nginx 服务 → 配 HTTPS**。以后更新只需再跑一次部署脚本。

---

## 0. 前置准备(一次性)

1. **DNS 解析**:在你的域名服务商把一条 `A` 记录指向 ECS 的**公网 IP**(如 `your.domain.com → 1.2.3.4`)。
2. **安全组**:阿里云控制台 → ECS 实例 → 安全组,放行入方向 **80** 和 **443** 端口。
3. **备案(国内必看)**:域名指向**中国大陆**的 ECS,要在 80/443 上对外访问,**必须完成 ICP 备案**,否则会被拦截。备案在阿里云控制台办理,周期约 1–2 周。
   - 还没备案又想先看效果?先用 `http://公网IP` 直接访问(见文末"先用 IP 跑通")。

---

## 1. 在 ECS 上装 Nginx

SSH 登录服务器后,按系统选其一:

```bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y nginx

# Alibaba Cloud Linux / CentOS / RHEL
sudo dnf install -y nginx || sudo yum install -y nginx

sudo systemctl enable --now nginx
```

浏览器打开 `http://公网IP`,能看到 Nginx 欢迎页就 OK。

---

## 2. 放置站点配置

```bash
sudo mkdir -p /var/www/lottery          # 网站目录
# 把本仓库的 deploy/nginx.conf 传上去(或直接 vi 粘贴):
sudo vi /etc/nginx/conf.d/lottery.conf  # 内容见仓库 deploy/nginx.conf
```

把里面的 `your.domain.com` 改成你的域名。**先别启用 HTTPS**——第 4 步配好证书再说。
如果默认有个抢占 80 端口的 `default` 站点,可在 `/etc/nginx/nginx.conf` 或 `conf.d/default.conf` 里注释掉它的 `server` 块。

---

## 3. 上传网站文件(以后更新也用这步)

在**你本地**(Windows 用 Git Bash)项目根目录执行:

```bash
# 首次给脚本可执行权限(可选)
chmod +x deploy/deploy.sh

# 一键:构建 + 上传 + 重载 Nginx
./deploy/deploy.sh root@你的服务器IP
```

> 脚本做了三件事:`npm run build` → 把 `dist/` 打包用 ssh 流式上传到 `/var/www/lottery` → `nginx -s reload`。
> 想免密码,先 `ssh-copy-id root@你的服务器IP` 配好密钥。
> 不想用脚本也可手动:`npm run build` 后 `scp -r dist/* root@IP:/var/www/lottery/`。

此时 `http://你的域名`(或 IP)应该已经能打开应用了。

---

## 4. 配 HTTPS(二选一)

### 方式 A:Let's Encrypt 免费证书(自动续期,推荐)

需要 80 端口可达 + 域名已解析到本机(国内还需备案)。

```bash
# Ubuntu/Debian
sudo apt install -y certbot python3-certbot-nginx
# Alibaba Cloud Linux/CentOS
sudo dnf install -y certbot python3-certbot-nginx

sudo certbot --nginx -d your.domain.com
```

certbot 会**自动**申请证书并改写 `lottery.conf`(加上 443 与 HTTP→HTTPS 跳转)。它还会装好定时续期。完成后访问 `https://你的域名`。

### 方式 B:阿里云免费证书(无需开 80 校验)

阿里云控制台 → 数字证书管理 → 申请免费证书 → 下载 **Nginx 格式**,得到 `.pem` 和 `.key`:

```bash
sudo mkdir -p /etc/nginx/ssl
sudo cp your.pem /etc/nginx/ssl/lottery.crt
sudo cp your.key /etc/nginx/ssl/lottery.key
sudo nginx -t && sudo systemctl reload nginx
```

`deploy/nginx.conf` 里的证书路径已对应好,直接生效。阿里云免费证书有效期较短,到期需重新下载替换。

---

## 5. 验证 & 日常更新

- 打开 `https://你的域名`,确认地址栏是锁(HTTPS),应用正常。
- **以后改了代码要发版**:本地 `./deploy/deploy.sh root@IP` 跑一次即可(`index.html` 设了 no-cache,刷新立即生效;`/assets` 是带 hash 的长缓存,不会读到旧文件)。

---

## 先用 IP 跑通(未备案 / 临时看效果)

把 `lottery.conf` 临时换成最简 HTTP 版即可:

```nginx
server {
    listen 80 default_server;
    server_name _;
    root /var/www/lottery;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}
```

`sudo nginx -t && sudo systemctl reload nginx`,然后访问 `http://公网IP`。备案/证书就绪后再换回带 HTTPS 的完整配置。

---

## 常见问题

- **打不开 / 超时**:99% 是安全组没放行 80/443,或国内域名未备案。先用 `http://公网IP` 排除。
- **404 刷新页面**:本应用是单页应用,`try_files ... /index.html` 已处理;若你删了该行会 404。
- **改了代码线上没变**:确认重新跑了 `deploy.sh`;`index.html` 已禁缓存,强刷(Ctrl+F5)即可。
- **dev 的 `allowedHosts`**:那只对 `npm run dev` 有用,生产是 Nginx 发静态文件,与它无关。
