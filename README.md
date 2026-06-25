# Shopee Affiliate Link Converter

Ứng dụng chuyển link Shopee thành link Shopee Affiliate. Frontend React chỉ nhận URL sản phẩm, backend Node.js giữ Affiliate ID/Sub ID trong `.env`, resolve link rút gọn `s.shopee.vn`, làm sạch về link sản phẩm canonical, và tạo link kết quả.

## Cấu trúc

```text
frontend/  React 19 + TypeScript + Vite + Tailwind CSS
backend/   Express + TypeScript API
```

## Cấu hình backend

Tạo file `backend/.env` từ `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

Điền giá trị:

```env
PORT=3000
SHOPEE_AFFILIATE_ID=17399820370
SHOPEE_SUB_ID=addlivetag-huybt---
```

## Cài đặt và chạy

```bash
npm install
npm run dev
```

- Backend chạy tại `http://localhost:3000`.
- Frontend Vite chạy tại URL hiện trong terminal, thường là `http://localhost:5173`.
- Frontend dev proxy `/api` sang backend.

## Build và production

```bash
npm run build
npm start
```

Sau khi build, Express sẽ serve API và static frontend từ `frontend/dist`.

Backend sẽ làm sạch `origin_link` trước khi encode. Ví dụ:

```text
https://s.shopee.vn/110kscU3md
```

hoặc link có username shop:

```text
https://shopee.vn/opaanlp/836275047/28667934665
```

sẽ được resolve/đưa về dạng ổn định:

```text
https://shopee.vn/product/836275047/28667934665
```

## API

```http
POST /api/convert
Content-Type: application/json
```

```json
{
  "productUrl": "https://s.shopee.vn/110kscU3md"
}
```

Thành công:

```json
{
  "affiliateUrl": "https://s.shopee.vn/an_redir?origin_link=...&affiliate_id=...&sub_id=...",
  "originLink": "https://shopee.vn/product/836275047/28667934665",
  "resolved": true
}
```

## Backend logging

Backend ghi structured log ra `stdout`. Production dùng JSON để cPanel/Passenger hoặc hệ thống thu thập log xử lý; ứng dụng không tự ghi file log.

Các biến môi trường:

```env
LOG_LEVEL=info
LOG_PRETTY=false
LOG_IP=false
LOG_FILE=logs/backend.log
```

- `LOG_LEVEL`: `debug`, `info`, `warn`, `error` hoặc `silent`.
- `LOG_PRETTY=true`: định dạng log dễ đọc khi phát triển local.
- `LOG_IP=true`: cho phép ghi IP client; mặc định tắt.
- `LOG_FILE`: đường dẫn file tương đối từ thư mục `backend`; mặc định là `backend/logs/backend.log`. Đặt giá trị rỗng để tắt ghi file.

Mỗi HTTP response có header `X-Request-Id`. Có thể dùng ID này để tìm access log và các event liên quan như `conversion_started`, `short_link_resolved`, `conversion_succeeded` và `conversion_failed`.

Logger không ghi request body, URL Shopee đầy đủ, affiliate URL, Affiliate ID hoặc Sub ID.

File được ghi theo định dạng JSON Lines và tự tạo thư mục cha. Ứng dụng chỉ append log, không tự xoay hoặc xóa file; production nên cấu hình log rotation từ hosting hoặc hệ điều hành.
