# Deploy len cPanel

Du an gom 2 phan:

- `frontend`: React + Vite, build ra `frontend/dist`.
- `backend`: Express + TypeScript, build ra `backend/dist/server.js`.

Khi chay production, backend se serve ca API `/api/convert` va frontend static trong `frontend/dist`.

## Yeu cau

- Hosting cPanel co muc **Setup Node.js App**.
- Node.js 18+; khuyen dung Node.js 20.
- May local hoac server co `npm`.

Neu cPanel khong co **Setup Node.js App**, khong the deploy day du chi bang `public_html`, vi ung dung can backend Node.js de xu ly API va giu `SHOPEE_AFFILIATE_ID`.

## Build truoc khi upload

Tai thu muc goc cua du an:

```bash
npm install
npm run build
```

Sau khi build thanh cong can co:

```text
frontend/dist
backend/dist/server.js
```

Khong upload `node_modules` len cPanel.

## Cau hinh bien moi truong

Backend can file:

```text
backend/.env
```

Noi dung:

```env
SHOPEE_AFFILIATE_ID=17399820370
SHOPEE_SUB_ID=addlivetag-huybt---
CORS_ALLOWED_ORIGINS=https://sopee.gc.edu.vn
```

Khong bat buoc dat `PORT` tren cPanel. cPanel/Passenger thuong tu cap port qua `process.env.PORT`.

Neu frontend va backend khac domain, `CORS_ALLOWED_ORIGINS` phai chua domain frontend. Co the khai bao nhieu domain bang dau phay:

```env
CORS_ALLOWED_ORIGINS=https://sopee.gc.edu.vn,https://www.sopee.gc.edu.vn
```

Frontend can file:

```text
frontend/.env
```

Mac dinh de trong de frontend goi API cung domain:

```env
VITE_API_BASE_URL=
```

Khi deploy frontend va backend cung mot Node.js App tren cPanel, giu gia tri rong nhu tren. Frontend se goi:

```text
/api/convert
```

Neu frontend nam mot domain khac va backend nam mot domain rieng, dat URL backend truoc khi build:

```env
VITE_API_BASE_URL=https://api.example.com
```

Khi do frontend se goi:

```text
https://api.example.com/api/convert
```

Luu y: bien `VITE_API_BASE_URL` duoc Vite dua vao frontend luc build, nen neu sua `frontend/.env` thi can chay lai:

```bash
npm run build
```

## Upload source len cPanel

Upload source vao thu muc app, vi du:

```text
/home/username/convertlink
```

Can upload cac file va thu muc chinh:

```text
package.json
package-lock.json
frontend/
backend/
```

Co the bo qua:

```text
node_modules
.git
```

Neu ban build local truoc khi upload, dam bao `frontend/dist` va `backend/dist` da nam trong source upload.

## Tao Node.js App trong cPanel

Vao **cPanel > Setup Node.js App** va tao app moi:

```text
Node.js version: 20.x hoac 18.x
Application mode: production
Application root: convertlink
Application URL: domain hoac subdomain muon chay
Application startup file: backend/dist/server.js
```

Luu cau hinh app.

## Cai dependencies tren cPanel

Trong terminal cua cPanel, vao thu muc app:

```bash
cd ~/convertlink
```

Neu da build local va upload san `dist`, chi can cai production dependencies:

```bash
npm install --omit=dev
```

Neu muon build truc tiep tren server:

```bash
npm install
npm run build
npm prune --omit=dev
```

## Restart app

Quay lai **Setup Node.js App** va bam **Restart**.

Sau do truy cap domain/subdomain da cau hinh. Frontend se duoc serve boi backend, API se chay cung domain tai:

```text
/api/convert
```

## Kiem tra nhanh

Mo website va thu chuyen doi mot link Shopee.

Neu website hien giao dien nhung convert bi loi, kiem tra:

- `backend/.env` da dung ten bien chua.
- `frontend/.env` co dung `VITE_API_BASE_URL` chua; neu moi sua thi phai build lai.
- `backend/.env` co `CORS_ALLOWED_ORIGINS=https://sopee.gc.edu.vn` chua; neu moi sua thi restart app.
- App da duoc restart sau khi sua `.env` chua.
- Hosting co cho server truy cap internet de resolve link `s.shopee.vn` khong.
- `Application startup file` co dung la `backend/dist/server.js` khong.

## Truong hop chi co hosting tinh

Neu hosting chi cho upload file len `public_html` va khong ho tro Node.js App, ban chi co the deploy frontend tinh. Chuc nang convert se khong hoat dong vi frontend dang goi API noi bo:

```text
/api/convert
```

Trong truong hop do can mot backend rieng, vi du VPS, Render, Railway, hoac server Node.js khac, roi sua frontend de goi API cua backend do.
