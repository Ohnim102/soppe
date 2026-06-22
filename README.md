# Shopee Affiliate Link Converter

Ung dung chuyen link Shopee thanh link Shopee Affiliate. Frontend React chi nhan URL san pham, backend Node.js giu Affiliate ID/Sub ID trong `.env`, resolve link rut gon `s.shopee.vn`, lam sach ve link san pham canonical, va tao link ket qua.

## Cau truc

```text
frontend/  React 19 + TypeScript + Vite + Tailwind CSS
backend/   Express + TypeScript API
```

## Cau hinh backend

Tao file `backend/.env` tu `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

Dien gia tri:

```env
PORT=3000
SHOPEE_AFFILIATE_ID=17399820370
SHOPEE_SUB_ID=addlivetag-huybt---
```

## Cai dat va chay

```bash
npm install
npm run dev
```

- Backend chay tai `http://localhost:3000`.
- Frontend Vite chay tai URL hien trong terminal, thuong la `http://localhost:5173`.
- Frontend dev proxy `/api` sang backend.

## Build va production

```bash
npm run build
npm start
```

Sau khi build, Express se serve API va static frontend tu `frontend/dist`.

Backend se lam sach `origin_link` truoc khi encode. Vi du:

```text
https://s.shopee.vn/110kscU3md
```

hoac link co username shop:

```text
https://shopee.vn/opaanlp/836275047/28667934665
```

se duoc resolve/dua ve dang on dinh:

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

Thanh cong:

```json
{
  "affiliateUrl": "https://s.shopee.vn/an_redir?origin_link=...&affiliate_id=...&sub_id=...",
  "originLink": "https://shopee.vn/product/836275047/28667934665",
  "resolved": true
}
```
