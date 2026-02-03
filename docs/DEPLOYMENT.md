# Hướng dẫn Deploy lên Docker Hub

Tài liệu này hướng dẫn cách build và push Docker Image lên Docker Hub để Tech Lead hoặc người khác có thể pull về và deploy.

## 1. Chuẩn bị
- Đảm bảo bạn đã có tài khoản [Docker Hub](https://hub.docker.com/).
- Đã cài đặt Docker Desktop trên máy.

## 2. Các bước thực hiện

### Bước 1: Đăng nhập vào Docker Hub
Mở terminal và chạy lệnh sau (nhập username và password khi được hỏi):
```bash
docker login
```

### Bước 2: Build và Push Image
Sử dụng script có sẵn để tự động build và push. Thay `your-dockerhub-username` bằng tên tài khoản của bạn.

```bash
# Cấp quyền thực thi cho script (chỉ cần làm 1 lần)
chmod +x scripts/build-and-push.sh

# Chạy script deploy
./scripts/build-and-push.sh your-dockerhub-username
```
Ví dụ: `./scripts/build-and-push.sh thongpham95`

### Bước 3: Gửi thông tin cho Tech Lead
Gửi cho Tech Lead file `docker-compose.prod.yml` (đã được tạo sẵn trong thư mục gốc) hoặc hướng dẫn họ chạy lệnh sau:

```bash
# Pull image mới nhất
docker pull your-dockerhub-username/ai-jira-dashboard:latest

# Chạy container
docker run -d -p 3000:3000 \
  --env-file .env.local \
  --name jira-dashboard \
  your-dockerhub-username/ai-jira-dashboard:latest
```

## 3. File Docker Compose cho Production
Bạn có thể sử dụng file `docker-compose.prod.yml` để dễ dàng deploy trên server:

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
```
