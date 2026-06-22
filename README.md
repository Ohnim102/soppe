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
