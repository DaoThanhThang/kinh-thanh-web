# box-builder

Trạng thái, logic và UI xếp hộp quà. Catalog (chocolate, size hộp) luôn được truyền vào từ ngoài, store không giữ catalog.

## Cấu trúc

- `model/types.ts`: `Slots` (id hoặc `null`, độ dài = size hộp), `BoxState { size, slots, message, from, to }`.
- `model/box-logic.ts`: hàm thuần, không phụ thuộc React/Zustand.
- `store/useBoxStore.ts`: store Zustand + persist (`kinh-thanh-box`, version 1, chỉ lưu `size`, `slots`, `message`, `from`, `to`).
- `index.ts`: API công khai.

## Hàm thuần

`createSlots`, `placeAt` (thay viên đang có; index sai → không đổi), `placeInFirstEmpty` (`{ slots, index | null }`), `removeAt`, `swap` (cũng dùng để chuyển viên sang ô trống), `clearAll`, `fillRandom(slots, chocolates, rng?)` (chỉ ô trống, chỉ viên còn bán, được lặp), `countById`, `pricing(state, chocolates, boxes)`, `sanitize(state, chocolates, boxes)` (trả `{ state, removedIds }`), `clampMessage` (NFC + cắt 150 code point, `MESSAGE_MAX`), `clampName` (một dòng, cắt 40 code point, `NAME_MAX`, cho `from`/`to`).

## Quy tắc đổi size (D19)

`previewResize(slots, newSize)` trả `{ kept, dropped }`: các viên được giữ theo thứ tự ô cũ (index tăng dần) và dồn vào các ô đầu của hộp mới; viên không còn chỗ nằm trong `dropped`. `resize` chỉ trả `kept`. UI gọi `previewResize` để hỏi xác nhận khi `dropped.length > 0`, rồi gọi `selectSize`.

## Store

Actions: `selectSize`, `placeAt`, `placeInFirstEmpty` (trả index hoặc null), `removeAt`, `swap`, `clearAll`, `fillRandom(chocolates)`, `setMessage`, `setFrom`, `setTo`, `reset`, `sanitizeWith(chocolates, boxes)` (trả id đã bị loại). Selectors: `selectFilledCount`, `selectIsFull(capacity)`, hook `usePricing(chocolates, boxes)`.

Store dùng `skipHydration: true` để HTML server (hộp rỗng) khớp lần render đầu của client, tránh hydration mismatch trong App Router. UI phải gọi `hydrateBoxStore()` trong `useEffect`, rồi `sanitizeWith(...)` khi đã có catalog. Truy cập localStorage được bọc try/catch; bị chặn thì chỉ giữ trong bộ nhớ.

Lưu ý Zustand v5: selector không được trả object/mảng mới mỗi lần; dùng `useShallow` hoặc selector trả primitive/tham chiếu ổn định.

## UI (T07)

`components/builder/`: `Builder` (island client, nhận `chocolates`/`boxes` từ server; hydrate store, sanitize, mặc định cỡ 12, vùng aria-live, xác nhận đổi cỡ/xoá hết), `SizeSelector` (radio gốc), `BoxStage` (GiftBox mở + ô là nút + menu bỏ viên), `SummaryBar`, `ConfirmDialog`, `builder.css`. Khay chọn viên nằm ở `features/catalog/components/CatalogTray.tsx` (T08). Chữ ở `src/content/builder.ts`. Ô trống chọn được (`selected`, dành cho T10).

## Kéo-thả và chạm-để-đặt (T09, T10)

- `model/drop.ts`: id dnd-kit (`trayItemId`, `cellDndId`, `TRAY_ZONE_ID`) và `resolveDrop(activeId, overId, slots, isAvailable)` → `DropAction` (`place` | `swap` | `remove` | `none`), hàm thuần có test.
- `store/useSelectionStore.ts`: viên đang cầm, số viên đã đặt, ô đang chọn (không lưu).
- `components/builder/dnd/`: `BuilderDnd` (DndContext, cảm biến, thông báo tiếng Việt, DragOverlay) và `TrayDropZone`; `sensors.ts` (chuột/bút, bàn phím theo lưới), `dragGuard.ts`.
- `BoxCell` (ô: nút + đích thả + nguồn kéo), `HoldBar` (thanh "đang cầm"), `LidEdge` (nắp trong builder). Builder áp dụng `DropAction` vào store và thông báo qua vùng aria-live `#builder-live`.
- Bàn phím: Space nhấc/thả (Enter nhấc ở viên trong khay), mũi tên chuyển ô, Esc huỷ. Ở ô có viên, Enter mở menu (Bỏ viên này / Thay bằng …).

## Hoàn tất hộp (T11, D33–D35)

- `model/completion.ts`: máy trạng thái thuần `edit → closing → tying → ready` (+ `opening` khi "Mở hộp để sửa"), `completionReducer`, `COMPLETION_MS`. Có test (`__tests__/completion.test.ts`).
- `components/complete/useCompletion.ts`: nối `isFull` với reducer, hẹn giờ từng pha (0ms khi prefers-reduced-motion). Builder dùng: pha `edit` hiện khay + tóm tắt; pha khác hiện `CompletePanel` thay chỗ, `BoxStage` đóng nắp (`closed`), khoá (`inert`) và vẽ ruy băng (`ribbon`).
- `components/box/Ribbon.tsx`: ruy băng SVG trên mặt ngoài nắp (`GiftBox lidOverlay`), trạng thái `tying | tied | untying`. Nắp đóng/mở nhờ `@property --open` + `transition` trong `box.css`/`builder.css`.
- `components/complete/CompletePanel.tsx` + `MessageCard.tsx`: thiệp, lời nhắn (≤150), "Gửi đến"/"Gửi từ" (≤40), nút "Tiếp tục đặt hàng" → `/dat-hang`, "Mở hộp để sửa". Chữ ở `src/content/complete.ts`.
