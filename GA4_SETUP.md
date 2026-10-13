# Google Analytics 4 — BBook landing page

## Kết quả audit

`bbook-web` là HTML/CSS/JavaScript tĩnh, phục vụ bởi `scripts/serve.mjs`; không có Next.js, App Router, layout React, TypeScript hoặc thư viện analytics. Trước thay đổi này không có GA4/GTM/Google tag hay cookie consent. Do đó dùng Google tag `gtag.js` chính thức, không cài `@next/third-parties`.

APK tải trực tiếp qua `data-apk-download` tới `assets/downloads/bbook-android.apk`; thuộc tính `download` được giữ nguyên. Link Expo là liên kết riêng, không tính thành click APK. Google Play hiện chưa có URL trong `appLinks.android`, nên nút đang disabled và không phát event. Khi có URL chính thức `https://play.google.com/...`, điền vào `app.js`; không dùng URL giả để tạo số liệu.

## Cấu hình local

1. Dùng Node.js 22.16 trở lên.
2. Sao chép `.env.example` thành `.env.local`. Đặt `NEXT_PUBLIC_GA_MEASUREMENT_ID` bằng Measurement ID bạn đã tạo (bắt đầu `G-`). File này được Git ignore; không điền ID vào HTML/JS source.
3. Chạy `npm run dev`, mở `http://localhost:5173`. Server đọc `.env.local`, sinh `analytics-config.js` (Git ignore). Biến trong shell được ưu tiên hơn `.env.local`.
4. Chưa đồng ý thì không tải Google tag và không gửi dữ liệu. Chọn **Đồng ý** để thử. Có thể đổi lựa chọn ở cuối bất kỳ trang nào.
5. Nếu thiếu ID, trang vẫn chạy, không tải tag. ID sai định dạng làm bước cấu hình dừng với thông báo rõ ràng.
6. `npm run check` kiểm tra cú pháp; `npm test` chạy kiểm thử consent/events/config. Dự án chưa có ESLint hay TypeScript, nên không có lint/typecheck tương ứng.

## Tự cấu hình Render và deploy

1. Mở Render → Static Site của `bbook-web` → Environment.
2. Thêm `NEXT_PUBLIC_GA_MEASUREMENT_ID` với giá trị Measurement ID của bạn. ID là thông tin công khai, không phải private key.
3. Chọn Node.js 22.16+ (ví dụ biến `NODE_VERSION=22.22.3` nếu Render chưa dùng bản tương thích).
4. Giữ Build Command `npm run build`, Publish Directory `dist`; nếu dùng monorepo giữ Root Directory `bbook-web` như cấu hình đang hoạt động.
5. Tự deploy. Biến GA phải có ở thời điểm build, vì đây là static site; đổi ID cần deploy lại. Script build sinh `dist/analytics-config.js` từ môi trường, không sao chép cấu hình local.
6. Sau deploy kiểm tra `/analytics-config.js` chứa ID đúng, `/analytics.js` trả 200 và HTML có đúng một lần nạp mỗi script. Không chèn thêm Google tag/GTM qua hosting hoặc plugin.
7. Kiểm tra nút APK vẫn tải file đúng URL và dung lượng; các trang `/privacy/`, `/delete-account/` vẫn mở bình thường.

Chưa chạy production build, commit, push hoặc deploy trong task này.

## Cấu hình GA4 để đo chính xác

1. Trong Admin của GA4, xác nhận Web data stream dùng website `https://bbookmakeup.com` và Measurement ID đúng.
2. Đặt reporting timezone property thành `Asia/Ho_Chi_Minh`, cấu hình data retention phù hợp (khuyến nghị 2 tháng).
3. Trong Enhanced Measurement, chỉ giữ **Page views**, tắt đo thay đổi trang qua browser history: website không có SPA routes và các anchor section không phải page mới. Không thêm page_view bằng tay hoặc qua GTM.
4. Tắt các mục tự động khác nếu không cần, đặc biệt Outbound clicks, File downloads và Form interactions: tránh thêm event tự động mang URL/form ngoài các thông tin tối thiểu của code này. Custom events vẫn hoạt động.
5. Nếu muốn báo cáo theo `button_location` và `destination_type`, tạo hai custom dimensions dạng Event với đúng tên parameter. Không cần tạo custom dimension để event được thu thập.
6. Không đặt email, tên, số điện thoại, mã tài khoản hoặc thông tin cá nhân vào URL path hay UTM. Code bỏ query/hash khỏi page_location và chỉ giữ origin của referrer. UTM được allowlist theo ký tự/độ dài; việc này không thay thế kiểm soát nội dung chiến dịch.

Page views được gửi tự động một lần khi Google tag được cấu hình sau consent. GA4 tự suy ra sessions và nguồn truy cập; code không gửi thêm session_start giả. Consent lưu trên trình duyệt, có thể rút lại; cookie `_ga*` được xóa khi rút lại. Các tab khác đồng bộ lựa chọn bằng sự kiện storage. Dữ liệu đã gửi không tự động bị xóa khi rút consent.

## UTM và nguồn truy cập

Ví dụ link chiến dịch (chỉ dùng dữ liệu marketing, không chứa PII):

```text
https://bbookmakeup.com/?utm_source=facebook&utm_medium=social&utm_campaign=launch&utm_content=post_01
https://bbookmakeup.com/?utm_source=threads&utm_medium=social&utm_campaign=launch&utm_content=bio
https://bbookmakeup.com/?utm_source=tiktok&utm_medium=social&utm_campaign=launch&utm_content=video_01
```

Các tham số được chuyển vào `campaign_source`, `campaign_medium`, `campaign_name`, `campaign_content` của Google tag. GA4 xác định Google/referral/Direct từ attribution thực tế. Không tự gán social chưa rõ nguồn; một số trình duyệt trong ứng dụng có thể không gửi referrer, vì vậy nên dùng UTM. Xem báo cáo **Traffic acquisition** bằng `Session source / medium` và `Session campaign`; không dùng First user source để diễn giải nguồn của phiên hiện tại.

## Xác nhận Realtime / DebugView

1. Mở trang bằng cửa sổ riêng tư, tạm tắt ad blocker cho lần kiểm tra, mở DevTools → Network.
2. Trước khi consent: không có request `gtag/js` hay GA `g/collect`. Chọn Từ chối và nhấn APK vẫn tải được, không có custom event.
3. Chọn Đồng ý. Có một `gtag/js?id=...` và một event `page_view`. Google có thể gộp nhiều event vào một request, nên đếm event/payload, không chỉ đếm request.
4. Mở GA4 → Reports → Realtime, xem page_view và người dùng mới. Nhấn APK một lần: kiểm tra event `apk_download_click`, `button_location=download`, `destination_type=apk`. Không tính render nút hoặc link Expo thành event.
5. Google Play chưa được cấu hình nên không có `play_store_click`. Sau khi có link chính thức, nhấn một lần phải mở cửa hàng và gửi event với `destination_type=google_play`.
6. Mở site qua Google Tag Assistant hoặc bật Google Analytics Debugger; mở GA4 → Admin → DebugView. Kiểm tra event theo timeline, không gửi một custom click bằng Console rồi nhấn thật vì đó là hai event khác nhau.
7. Thử UTM trong phiên riêng tư mới: kiểm tra campaign parameters và báo cáo session attribution sau khi GA4 xử lý. Realtime/DebugView có attribution hạn chế; báo cáo chuẩn có thể cần 24–48 giờ.
8. Rút consent qua nút cuối trang, nhấn APK lại: tải vẫn hoạt động nhưng custom event ngừng. Đồng ý lại không nạp tag hoặc page_view trùng trong cùng document. Refresh/tải trang mới là một page view mới hợp lệ.

Tham khảo chính thức: [Google tag configuration](https://developers.google.com/analytics/devguides/collection/ga4/reference/config), [kiểm tra thu thập dữ liệu](https://developers.google.com/analytics/devguides/collection/ga4/troubleshoot), [DebugView](https://support.google.com/analytics/answer/7201382?hl=en).

## Phạm vi và giới hạn xác minh

Các file tạo/sửa:

- Tracking: `analytics.js`, `index.html`.
- Cấu hình: `.env.example`, `.gitignore`, `package.json`, `scripts/analytics-config.mjs`, `scripts/serve.mjs`, `scripts/build.mjs`.
- Trang pháp lý và nguồn sinh: `privacy.html`, `privacy/index.html`, `delete-account.html`, `delete-account/index.html`, `scripts/generate-legal.mjs`, `legal/content.json`, `legal/privacy.txt`.
- Kiểm thử và hướng dẫn: `scripts/analytics.test.mjs`, `README.md`, `GA4_SETUP.md`.
- Chỉ local, Git ignore: `.env.local` chứa ID bạn cung cấp; `analytics-config.js` được sinh từ môi trường. Không hardcode Measurement ID production vào source được theo dõi bởi Git.

Kết quả kiểm tra ngày 13/10/2026: `npm test` 5/5 đạt; `npm run check` đạt; `git diff --check` đạt. HTTP smoke với server local tạm thời: trang chính, hai trang pháp lý và hai analytics assets trả 200; mỗi document nạp analytics script một lần; `.env.local` trả 404; APK HEAD trả 200, Content-Length trên 100 MB, Content-Disposition vẫn là attachment. Kiểm thử consent/click dùng DOM fixture; chưa kiểm tra trực quan banner trên trình duyệt desktop/mobile hoặc xác nhận request nhận tại Google. Không chạy production build. `git status` của `bbook-admin` không còn thay đổi.

Chỉ sửa `bbook-web`; Admin và backend được giữ nguyên. Không cần service account hoặc private key trong giai đoạn thu thập. Các event là lượt nhấn, không phải tải hoàn tất hay cài đặt. Tracking phụ thuộc consent, kết nối mạng và trình chặn quảng cáo. Kiểm thử local dùng fixture trong bộ test, không gửi event giả tới Google. Chưa xác nhận receipt trong property GA4 thật hoặc kiểm thử Google Play với URL production; chủ property thực hiện các bước trên sau deploy.
