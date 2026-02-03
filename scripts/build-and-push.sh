#!/bin/bash

# Kiểm tra xem người dùng có nhập username không
if [ -z "$1" ]; then
  echo "❌  Lỗi: Vui lòng nhập Docker Hub Username."
  echo "👉 Cách dùng: ./scripts/build-and-push.sh <your-dockerhub-username>"
  exit 1
fi

USERNAME=$1
IMAGE_NAME="ai-jira-dashboard"
TAG="latest"
FULL_IMAGE_NAME="$USERNAME/$IMAGE_NAME:$TAG"

echo "=========================================="
echo "🐳  Bắt đầu quy trình Build & Push Docker"
echo "📦  Image: $FULL_IMAGE_NAME"
echo "=========================================="

# 1. Build Image
echo "🛠   Đang build image..."
docker build -t $FULL_IMAGE_NAME .

# Kiểm tra nếu build thất bại
if [ $? -ne 0 ]; then
  echo "❌  Build thất bại."
  exit 1
fi
echo "✅  Build thành công!"

# 2. Push Image
echo "🚀  Đang đẩy image lên Docker Hub..."
docker push $FULL_IMAGE_NAME

# Kiểm tra nếu push thất bại
if [ $? -ne 0 ]; then
  echo "❌  Push thất bại. Vui lòng kiểm tra xem bạn đã 'docker login' chưa."
  exit 1
fi

echo "=========================================="
echo "🎉  Thành công!"
echo "👉  Tech Lead có thể chạy lệnh sau để deploy:"
echo "docker run -d -p 3000:3000 --env-file .env.local $FULL_IMAGE_NAME"
echo "=========================================="
