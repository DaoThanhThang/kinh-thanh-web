Các service.

- `catalog.ts`, `catalog-core.ts`: danh mục chocolate và cỡ hộp (JSON tĩnh, chạy phía server).
- `order.ts`: `OrderService` (`submitOrder(payload) → { ok: true, orderId } | { ok: false, error }`), `MockOrderService` (900ms, chỉ ghi console), `AppsScriptOrderService` (chưa bật, T16), `createOrderService(endpoint)`, `getOrderService()` (theo `NEXT_PUBLIC_ORDER_ENDPOINT`). Xem `docs/ORDER-PAYLOAD.md`.
- `store-info.ts`, `store-info-core.ts`: `getStoreInfo()` đọc `data/store-info.json` (đã kiểm Zod, sai thì trả bản rỗng + cảnh báo), `zaloUrl`, `telHref`.
- `contact.ts`: `ContactService` (`sendMessage`), `MockContactService` (chỉ ghi console), `getContactService()`.
