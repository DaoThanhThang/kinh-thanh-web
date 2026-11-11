# Dữ liệu

Hai file JSON là nguồn dữ liệu của cửa hàng. Thêm hoặc sửa dữ liệu ở đây, không cần sửa code.

## data/chocolates.json

Mỗi viên là một object:

| Trường        | Ý nghĩa                                                             |
| ------------- | ------------------------------------------------------------------- |
| `id`          | Chuỗi, duy nhất ("01", "13"...)                                     |
| `name`        | Tên hiển thị                                                        |
| `price`       | Giá VND, số nguyên dương (ví dụ 45000)                              |
| `image`       | Đường dẫn ảnh, bắt đầu bằng `/` (file trong `public/`) hoặc `http`  |
| `description` | Mô tả ngắn                                                          |
| `flavorNotes` | Danh sách hương vị, chuỗi. Để `[]` nếu chưa có                      |
| `allergens`   | Danh sách chất gây dị ứng, hoặc `null` (xem bên dưới)               |
| `available`   | `true`/`false`. Mặc định `true`                                     |
| `sortOrder`   | Thứ tự hiển thị, nhỏ lên trước; bằng nhau thì theo `id`. Mặc định 0 |

### Thêm một viên

1. Chép ảnh vào `public/chocolates/` (ví dụ `13.png`).
2. Thêm một object vào `data/chocolates.json` với `id` mới và `"image": "/chocolates/13.png"`.

Không cần sửa code.

### Thay ảnh

- Ghi đè file cùng tên trong `public/chocolates/`, hoặc đổi `image` sang file mới.
- Ảnh thật: vuông 1:1, nhìn từ trên xuống, nền trong suốt (PNG hoặc WebP), từ 800px trở lên, viên nằm giữa và chiếm khoảng 80% khung.

### Dị ứng: `null` và `[]`

- `"allergens": null` nghĩa là CHƯA CÓ THÔNG TIN. Giao diện không được hiển thị là "không có chất gây dị ứng".
- `"allergens": []` nghĩa là đã xác nhận không có chất gây dị ứng.
- `"allergens": ["sữa", "hạt phỉ"]` là danh sách đã xác nhận.

Không điền khi chưa có thông tin từ Kinh Thành.

## data/boxes.json

Mỗi hộp: `size`, `cols`, `rows`, `price`, `name`. Bắt buộc `cols * rows = size` (6 = 3×2, 9 = 3×3, 12 = 4×3, 16 = 4×4). Giá hiện là giá tạm.

## Khi dữ liệu sai

Trang không bị vỡ. Mỗi phần tử được kiểm riêng (Zod, `src/lib/schemas/`):

- Phần tử sai bị bỏ qua. Terminal (server) in cảnh báo `[catalog]` gồm file, vị trí trong mảng, `id` hoặc `size`, và trường sai kèm lý do.
- `id` hoặc `size` trùng: giữ phần tử đầu, cảnh báo phần tử sau.
- Ảnh nội bộ không tồn tại trong `public/`: dùng `/chocolates/fallback.svg` và cảnh báo.

Logic nằm ở `src/lib/services/catalog-core.ts` (thuần, có test) và `catalog.ts` (đọc JSON, kiểm file). Giao diện `CatalogService` cho phép sau này đổi nguồn sang Google Sheet mà không đổi nơi gọi.
