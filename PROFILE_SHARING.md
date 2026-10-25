# Chia sẻ hồ sơ qua bbookmakeup.com

Link và QR công khai: `https://bbookmakeup.com/mua/{muaId}`. API ứng dụng vẫn dùng máy chủ hiện tại. Thay đổi này chưa được deploy.

## Cách nối với website hiện có

Website đang là Render Static Site. Giữ trang chủ, trang pháp lý, các link social và cấu hình DNS hiện có. Để dùng trang hồ sơ động đã render ở backend, thêm **một redirect** trên chính Static Site đang gắn tên miền, tại Redirects/Rewrites:

| Source | Destination | Action |
|---|---|---|
| `/mua/:muaId` | `https://beautybook-v3bi.onrender.com/mua/:muaId` | Redirect |

Đặt trước rule bắt toàn bộ đường dẫn nếu hosting đang có rule như vậy. Giữ các rule `/fb`, `/tt`, `/threads` hiện có. Cấu hình máy đọc được nằm trong `profile-sharing-redirects.json`; Render không tự nhập file này khi deploy source.

- Người nhận chia sẻ URL thuộc **bbookmakeup.com**. Bản Android mới đã được xác minh có thể mở đúng hồ sơ trong app từ URL này.
- Trình duyệt/robot xem trước theo redirect 301 sang máy chủ render HTML. Thanh địa chỉ khi xem web sẽ hiện hostname backend; đây là giới hạn của phương án giữ nguyên Static Site. HTML chứa canonical và og:url thuộc bbookmakeup.com, tên/ảnh riêng của hồ sơ. Cần thử preview thực tế trên các ứng dụng chia sẻ trước phát hành.
- Backend đích trả HTML trực tiếp, không redirect ngược về canonical, tránh vòng lặp. Hồ sơ không công khai trả 404 và không cache.
- Nếu cần giữ bbookmakeup.com cả trên thanh địa chỉ trang hồ sơ, cần cấu hình reverse proxy/hosting động riêng. Không tự chuyển DNS, đổi dịch vụ hoặc tạo hạ tầng trả phí trong thay đổi này.

## Xác minh Android

Build website đóng gói `.well-known/assetlinks.json` vào `dist/.well-known/assetlinks.json`. Tệp dùng package `com.bbook.app` và SHA-256 **App signing** do chủ ứng dụng xác nhận. Đây là dấu vân tay công khai, không phải khóa bí mật.

Sau deploy, `https://bbookmakeup.com/.well-known/assetlinks.json` phải trả **200 application/json trực tiếp**, không redirect hoặc trang HTML fallback. Không redirect đường dẫn này về backend. App mới chỉ khai báo host `bbookmakeup.com`, đường dẫn `/mua/`; không thêm host chưa được xác minh. Nếu Play còn phân phối chứng chỉ ký trước đó, cần thêm SHA-256 đã xác minh của chứng chỉ đó trước khi nghiệm thu các thiết bị tương ứng.

## Thứ tự rollout và kiểm thử

1. Deploy backend đã kiểm thử; cấu hình `ProfileSharing__PublicOrigin=https://bbookmakeup.com`. Kiểm tra `/mua/{id}` ở backend trả HTML, canonical thuộc tên miền thương hiệu, hồ sơ ẩn trả 404. Không đổi API origin, keystore hay Firebase.
2. Build/deploy website hiện có và thêm redirect ở trên. Chỉ sửa source sẽ chưa kích hoạt đường dẫn động trên Render.
3. Kiểm tra GET/HEAD trang chủ, `/privacy/`, `/delete-account/`, `/fb`, CSS và nút Google Play còn hoạt động.
4. Kiểm tra association trả trực tiếp 200 JSON; URL hồ sơ thuộc domain trả redirect đến đúng ID và HTML cuối đúng MUA. ID sai không lộ hồ sơ. QR và nút sao chép phải dùng bbookmakeup.com.
5. Nghiệm thu ứng viên Android ký đúng chứng chỉ qua track thử nghiệm: app đóng/mở, chưa/đã đăng nhập, QR, trình duyệt, Zalo/Messenger. Bản Google Play đang phát hành chưa tự nhận App Links từ thay đổi nguồn này; nút web mở app vẫn dùng route cũ đã có.
6. Chỉ phát hành app sau kiểm thử trên thiết bị và quy trình chấp nhận hiện có. Hoàn tác bằng bỏ đúng một rule `/mua/:muaId` nếu chưa phát hành link; không xóa rule social hay thay cấu hình toàn website.

Kiểm thử local: `npm test`, `npm run check`, `npm run build`. Server local mô phỏng redirect cho GUID hợp lệ và phục vụ association trực tiếp; kiểm thử HTTP không truy cập backend production.

Tham khảo: [Render redirects/rewrite rules](https://render.com/docs/redirects-rewrites), [Android App Links](https://developer.android.com/training/app-links/add-applinks).
