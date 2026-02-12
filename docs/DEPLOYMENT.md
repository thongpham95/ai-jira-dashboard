# Deployment Guide - Jira Dashboard

Hướng dẫn cách deploy ứng dụng lên Docker Hub và Production server.

## Prerequisites

### 1. Atlassian OAuth App
Trước khi deploy, bạn cần tạo OAuth 2.0 App trên Atlassian:

1. Truy cập [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
2. Tạo OAuth 2.0 App mới
3. Thêm **Permissions**:
   - **Jira API**: `read:jira-work`, `read:jira-user`
   - **User identity API**: `read:me`
4. Thêm **Callback URL**:
   - Development: `http://localhost:3000/api/auth/callback/atlassian`
   - Production: `https://your-domain.com/api/auth/callback/atlassian`

### 2. Environment Variables
Tạo file `.env.local` với nội dung:

```env
# NextAuth (Required)
NEXTAUTH_SECRET=your-secret-key-min-32-chars
NEXTAUTH_URL=http://localhost:3000  # Đổi thành domain production khi deploy

# Atlassian OAuth 2.0 (Required)
ATLASSIAN_CLIENT_ID=your-client-id
ATLASSIAN_CLIENT_SECRET=your-client-secret
```

> **Lưu ý**: Chạy `openssl rand -base64 32` để tạo NEXTAUTH_SECRET an toàn.

---

## Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Open http://localhost:3000
```

---

## Docker Deployment

### Option 1: Docker Compose (Recommended)

```bash
# Build và start
docker-compose up -d --build

# Xem logs
docker-compose logs -f

# Dừng
docker-compose down
```

### Option 2: Push lên Docker Hub

#### Bước 1: Đăng nhập Docker Hub
```bash
docker login
```

#### Bước 2: Build và Push
```bash
# Cấp quyền cho script (chỉ cần 1 lần)
chmod +x scripts/build-and-push.sh

# Build và push (thay username)
./scripts/build-and-push.sh your-dockerhub-username
```

**Ví dụ**: `./scripts/build-and-push.sh thongpham95`

#### Bước 3: Deploy trên Production Server

Trên server, tạo file `.env.local` và chạy:

```bash
# Pull image mới nhất
docker pull your-dockerhub-username/ai-jira-dashboard:latest

# Chạy container
docker run -d -p 3000:3000 \
  --env-file .env.local \
  --name jira-dashboard \
  --restart unless-stopped \
  your-dockerhub-username/ai-jira-dashboard:latest
```

---

## Production Docker Compose

File `docker-compose.prod.yml`:

```yaml
version: '3.8'
services:
  jira-dashboard:
    image: your-dockerhub-username/ai-jira-dashboard:latest
    container_name: jira-dashboard
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

Chạy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Important Notes

### 1. NEXTAUTH_URL
Đảm bảo `NEXTAUTH_URL` khớp với domain thực tế:
- Development: `http://localhost:3000`
- Production: `https://your-domain.com`

### 2. Callback URL
Phải thêm Callback URL production vào Atlassian Developer Console:
```
https://your-domain.com/api/auth/callback/atlassian
```

### 3. HTTPS
Production nên sử dụng HTTPS. Có thể dùng:
- Nginx reverse proxy với Let's Encrypt
- Cloudflare SSL

---

## Troubleshooting

### Lỗi "unauthorized_client"
- Kiểm tra Callback URL đã được thêm đúng trong Atlassian Developer Console

### Lỗi "Missing scopes"
- Kiểm tra đã thêm đủ scopes: `read:jira-work`, `read:jira-user`, `read:me`

### Lỗi "NEXTAUTH_SECRET missing"
- Đảm bảo `NEXTAUTH_SECRET` có ít nhất 32 ký tự

### Container không start
```bash
# Xem logs
docker logs jira-dashboard

# Kiểm tra env file
docker exec jira-dashboard env
```
