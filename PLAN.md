# Prompt xây dựng Website Chuyển Đổi Link Shopee Affiliate chỉ bằng Frontend

## Mục tiêu

Xây dựng một website frontend cho phép người dùng nhập link Shopee và tạo link Affiliate Shopee theo định dạng:

```text
https://s.shopee.vn/an_redir?origin_link={ENCODED_PRODUCT_URL}&affiliate_id={AFFILIATE_ID}&sub_id={SUB_ID}
```

Website chạy hoàn toàn trên trình duyệt, không dùng backend, không dùng database và không cần API server.

Mục đích chính của website chỉ là:

- Nhập link Shopee.
- Nhập Affiliate ID.
- Nhập Sub ID nếu cần.
- Tạo link Affiliate.
- Copy link kết quả.

## Công nghệ

Frontend:

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Shadcn UI
- React Hook Form

Lưu trữ cục bộ nếu cần:

- LocalStorage

## Chức năng chính

### 1. Chuyển đổi link Shopee

Người dùng nhập link Shopee, ví dụ:

```text
https://shopee.vn/product/xxx/yyy
```

hoặc:

```text
https://s.shopee.vn/xxxxxx
```

Người dùng nhập thêm:

- Affiliate ID
- Sub ID

Hệ thống frontend thực hiện:

1. Kiểm tra URL đầu vào hợp lệ.
2. Kiểm tra domain thuộc một trong các domain được hỗ trợ:
   - shopee.vn
   - www.shopee.vn
   - s.shopee.vn
3. Encode URL đầu vào bằng `encodeURIComponent`.
4. Sinh link Affiliate theo định dạng:

```text
https://s.shopee.vn/an_redir?origin_link={encodedUrl}&affiliate_id={affiliateId}&sub_id={subId}
```

5. Hiển thị link Affiliate đã tạo.
6. Cho phép copy link kết quả vào clipboard.

Lưu ý:

- Vì ứng dụng chỉ dùng frontend, không cần backend để resolve redirect.
- Nếu người dùng nhập link rút gọn `s.shopee.vn`, ứng dụng sẽ dùng chính link đó làm `origin_link`.
- Có thể hiển thị ghi chú nhỏ rằng link rút gọn không được resolve sang link sản phẩm gốc do ứng dụng không dùng backend.

### 2. Giao diện

Trang chính gồm:

- Ô nhập URL Shopee.
- Ô nhập Affiliate ID.
- Ô nhập Sub ID.
- Nút Chuyển đổi.
- Khu vực hiển thị kết quả.
- Nút Copy.

Yêu cầu giao diện:

- Hiện đại, gọn gàng.
- Dark Mode.
- Responsive.
- Mobile Friendly.
- Dùng Shadcn UI và Tailwind CSS.
- Có trạng thái validation lỗi.
- Có toast thông báo khi copy thành công.

Không cần xây dựng:

- Trang quản lý Affiliate ID.
- Trang quản lý Sub ID.
- Lịch sử chuyển đổi.
- Đăng nhập.
- Dashboard quản trị.

### 3. Validation

Kiểm tra:

- URL không được rỗng.
- URL phải đúng định dạng URL.
- Domain chỉ được phép là:
  - shopee.vn
  - www.shopee.vn
  - s.shopee.vn
- Affiliate ID không được rỗng.
- Sub ID có thể để trống nếu người dùng không cần dùng.

Nếu Sub ID để trống, vẫn tạo link với `sub_id=` rỗng hoặc bỏ tham số `sub_id`, tùy chọn cách triển khai rõ ràng và nhất quán.

### 4. Không dùng Backend

Không xây dựng:

- ASP.NET Core API.
- Node.js API.
- Database.
- SQLite.
- SQL Server.
- API endpoint.
- Docker Compose cho backend/database.
- Repository Pattern backend.
- Dependency Injection backend.
- OpenAPI / Swagger.
- Database migration.
- Server-side logging.

Toàn bộ logic xử lý nằm trong frontend.

### 5. Kiến trúc Frontend

Yêu cầu code frontend rõ ràng, dễ bảo trì:

- Strong TypeScript.
- Component hóa hợp lý.
- Tách logic tạo Affiliate link thành utility hoặc service riêng.
- Dùng React Hook Form cho form.
- Có validation schema nếu phù hợp.
- Có thể dùng Zod nếu cần.

Gợi ý cấu trúc thư mục:

```text
src/
  components/
  hooks/
  lib/
  services/
  types/
  utils/
```

### 6. Kết quả mong muốn

Sinh đầy đủ source code frontend:

- React 19 + TypeScript + Vite.
- Tailwind CSS.
- Shadcn UI.
- React Hook Form.
- Form chuyển đổi link Shopee Affiliate.
- Validation URL và domain Shopee.
- Hiển thị link kết quả.
- Copy link kết quả.
- README hướng dẫn chạy.

Lệnh chạy mong muốn:

```bash
npm install
npm run dev
```

## Tham khảo

Tham khảo hướng dẫn tạo link tiếp thị liên kết chính thống của Shopee:

https://help.shopee.vn/portal/10/article/172955-H%C6%B0%E1%BB%9Bng-d%E1%BA%ABn-t%E1%BA%A1o-link-Ti%E1%BA%BFp-th%E1%BB%8B-li%C3%AAn-k%E1%BA%BFt-r%C3%BAt-g%E1%BB%8Dn
