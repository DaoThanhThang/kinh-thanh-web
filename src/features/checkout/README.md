# checkout

Trang `/dat-hang` (T12, mock). Đọc hộp từ store đã lưu của `box-builder`, hiện tóm tắt + form khách hàng, gửi qua `OrderService`.

- `components/CheckoutPage.tsx`: hydrate store + `sanitizeWith(catalog)`, các trạng thái: đang tải, hộp chưa đầy (link về `/#builder`), form, đang gửi, lỗi (giữ dữ liệu, gửi lại), thành công (mã đơn, sau đó mới xoá store). Prop `service` để test; mặc định `getOrderService()`.
- `components/CustomerForm.tsx`: Zod (`createCustomerSchema`), lỗi inline sau khi rời ô / sau lần gửi đầu, focus ô sai đầu tiên, `aria-invalid` + `aria-describedby`, `noValidate`.
- `components/OrderSummary.tsx`: hộp đóng có ruy băng, viên theo loại, lời nhắn, giá.
- `model/payload.ts`: `groupPieces`, `isBoxComplete`, `buildOrderPayload`.
- Chữ: `src/content/checkout.ts`. Payload và mẫu Apps Script: `docs/ORDER-PAYLOAD.md`.
