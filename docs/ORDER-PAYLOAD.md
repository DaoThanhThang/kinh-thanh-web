# ORDER-PAYLOAD – dữ liệu đơn hàng gửi đi

Nguồn sự thật: `orderPayloadSchema` trong `src/lib/schemas/order.ts`. Client gửi qua `OrderService.submitOrder(payload)` (`src/lib/services/order.ts`). Chọn dịch vụ theo biến môi trường `NEXT_PUBLIC_ORDER_ENDPOINT`:

- Không đặt (mặc định): `MockOrderService` — chờ 900ms, ghi payload ra `console`, trả `KT-yyyymmdd-NNNN`. Không gọi mạng, không gửi dữ liệu đi đâu (kể cả email).
- Có đặt (URL Web App của Google Apps Script): `AppsScriptOrderService` — `POST` JSON với `Content-Type: text/plain;charset=utf-8` (tránh preflight CORS), `redirect: 'follow'`. Chưa bật; làm ở T16.

## Payload (version 1)

```jsonc
{
  "version": 1,
  "createdAt": "2026-11-11T08:00:00.000Z", // ISO 8601 UTC
  "customer": {
    "name": "Nguyễn Văn An",
    "phone": "0912345678", // đã chuẩn hoá: 10 số, 0xxxxxxxxx (di động 03/05/07/08/09 hoặc bàn 02)
    "email": "an@example.com", // tuỳ chọn, bỏ khoá nếu trống
    "address": "12 Phố Huế, Phường Phạm Đình Hổ",
    "province": "Hà Nội", // nhập tự do
    "desiredDate": "2026-11-20", // tuỳ chọn, yyyy-mm-dd, từ ngày mai
    "note": "Giao giờ hành chính.", // tuỳ chọn, ≤ 500 ký tự
    "payment": "cod", // "cod" | "transfer"
  },
  "box": {
    "size": 12,
    "slots": ["03", "04", "04" /* … đủ `size` phần tử, id viên theo thứ tự ô */],
    "items": [{ "id": "04", "name": "Chocolate 04", "qty": 2, "unitPrice": 50000 }],
  },
  "card": { "message": "…", "from": "Minh", "to": "Lan" }, // message ≤ 150, from/to ≤ 40 (có thể rỗng)
  "pricing": { "box": 180000, "pieces": 635000, "total": 815000 }, // VND, số nguyên
}
```

Giá trong payload chỉ để đối chiếu; phía nhận nên tính lại từ bảng giá của mình khi T16 làm việc với dữ liệu thật.

## Phản hồi mong đợi

```json
{ "ok": true, "orderId": "KT-20261111-0482" }
{ "ok": false, "error": "Lý do ngắn" }
```

## Mẫu Apps Script `doPost` (TEMPLATE cho T16, chưa dùng, chưa kiểm thử)

Chỉ là khung tham khảo: tên sheet, cột và việc sinh mã đơn cần chốt ở T16. Không có khoá hay URL thật trong repo.

```js
// Code.gs — TEMPLATE
const SHEET_NAME = 'Orders'; // đổi theo Google Sheet thật

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents); // body là text/plain chứa JSON
    if (data.version !== 1) return json_({ ok: false, error: 'Phiên bản dữ liệu không hỗ trợ' });

    const orderId = 'KT-' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyyMMdd') +
      '-' + Utilities.getUuid().slice(0, 4).toUpperCase();
    const c = data.customer;
    const items = data.box.items.map((i) => i.name + ' x' + i.qty).join('; ');

    SpreadsheetApp.getActive().getSheetByName(SHEET_NAME).appendRow([
      orderId, new Date(), c.name, c.phone, c.email || '', c.address, c.province,
      c.desiredDate || '', c.note || '', c.payment, data.box.size, items,
      data.card.message, data.card.from, data.card.to, data.pricing.total,
    ]);
    return json_({ ok: true, orderId: orderId });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
```

Triển khai: Deploy → Web app, Execute as: Me, Who has access: Anyone. Đặt URL `/exec` vào `NEXT_PUBLIC_ORDER_ENDPOINT` (biến `NEXT_PUBLIC_*` được nhúng lúc build).
