# Social Short Links — BBook

## Kiến trúc và giải pháp

Audit repository: website là HTML/CSS/JavaScript tĩnh, không có Next.js/App Router hoặc `next.config.*`. `npm run build` tạo `dist`; README hiện tại hướng dẫn Render Static Site với Build Command `npm run build` và Publish Directory `dist`. Server Node `scripts/serve.mjs` chỉ dùng cho local. Các trang `/privacy/`, `/delete-account/` và URL `.html` hiện có được giữ nguyên. Không có cấu hình redirect/rewrite hosting trong repo; chưa truy cập Dashboard Render để xác minh các rule đang chạy trên production.

Dùng **HTTP 301 Redirect tại Render Static Site**, theo [tài liệu Render](https://render.com/docs/redirects-rewrites). Không dùng Next.js redirects, JavaScript redirect page, meta refresh, `_redirects` hoặc dịch vụ backend. `social-redirects.json` lưu ba rule cần nhập vào Dashboard; file JSON **không được Render tự động áp dụng**. Server local đọc cùng file để mô phỏng redirect.

## Cấu hình Render thủ công — bắt buộc

Mở Render → Static Site của **bbook-web** → Redirects/Rewrites. Thêm ba rule dưới đây, với Action **Redirect** (không phải Rewrite):

| Source | Destination | Action |
| --- | --- | --- |
| `/fb` | `/?utm_source=facebook&utm_medium=social&utm_campaign=bbook_launch` | Redirect |
| `/tt` | `/?utm_source=tiktok&utm_medium=social&utm_campaign=bbook_launch` | Redirect |
| `/threads` | `/?utm_source=threads&utm_medium=social&utm_campaign=bbook_launch` | Redirect |

Destination là đường dẫn tương đối cùng origin: trên `https://bbookmakeup.com` sẽ chuyển tới đúng URL production yêu cầu, không cho phép nhập domain bên ngoài từ query của người truy cập. Không dùng wildcard, không tạo rule từ `/`, không redirect URL đích về link ngắn. Ba rule này không áp dụng cho đường dẫn con như `/fb/other`.

Đặt ba rule trước các rule wildcard/catch-all nếu Dashboard đang có; giữ nguyên rule không liên quan. Không tạo file/thư mục `fb`, `tt`, `threads` trong `dist`: Render ưu tiên file tồn tại hơn rule redirect. Nếu có rewrite `/* → /index.html` sẵn, kiểm tra thứ tự để các short links không bị phục vụ trang chủ ở URL thiếu UTM.

301 có thể được browser/CDN cache. Nếu đổi UTM sau này, kiểm tra với Disable cache/cửa sổ riêng tư để tránh redirect cũ. Các đường dẫn được yêu cầu là `/fb`, `/tt`, `/threads`; biến thể dấu `/` cuối không được repo khai báo thêm rule, nên không đưa biến thể đó vào hồ sơ social nếu chưa test riêng trên hosting.

## GA4 được bảo toàn

Không sửa `analytics.js`, Measurement ID, consent, events hoặc APK/Google Play. HTTP redirect không phục vụ document và không chạy Google tag ở short link. Trang chủ đích mới chạy analytics sau consent và đọc UTM từ URL như trước; không thêm page_view hay session_start thủ công, không sửa attribution.

## Test local

Chạy `npm test`, `npm run check`, `npm run dev`. Repo không có TypeScript/typecheck. Mở từng link `http://localhost:5173/fb`, `/tt`, `/threads`: phải tự chuyển sang `/` với đủ ba UTM. Refresh URL đích phải vẫn là trang chủ, không quay về link ngắn. Không dùng curl `-L` nếu đang kiểm tra status/Location của redirect:

```powershell
curl.exe -I 'http://localhost:5173/fb'
curl.exe -I 'http://localhost:5173/tt'
curl.exe -I 'http://localhost:5173/threads'
```

Phải trả 301 và Location đúng bảng. Trang `/`, `/privacy/`, `/delete-account/`, analytics assets và APK vẫn hoạt động. Node server local không chạy trên Render Static Site, nên local pass không thay thế cấu hình Dashboard.

## Tự deploy và xác nhận production

1. Tự commit/push/deploy khi bạn sẵn sàng; giữ Static Site, Build Command `npm run build`, Publish Directory `dist` và biến `NEXT_PUBLIC_GA_MEASUREMENT_ID` hiện tại. Không cần package hoặc biến môi trường mới.
2. Nhập/lưu ba rule hosting như trên. Deploy source code đơn thuần không tự tạo rule Render.
   Với trang chủ và GA4 hiện đã deploy, thao tác lưu rule hosting là phần kích hoạt short links trên production; source mới chủ yếu bổ sung cấu hình có thể review và kiểm thử local. Không cần đổi loại service hoặc build lại ứng dụng Android.
3. Chrome DevTools → Network → bật **Preserve log** và **Disable cache**. Mở lần lượt ba public short links bằng phiên riêng tư mới cho mỗi nguồn.
4. Kiểm tra request document đầu: HTTP 301, Location đầy đủ UTM. Request document tiếp: trang chủ trả 200, URL vẫn có UTM. Không có request document lặp qua short link. Refresh URL đích chỉ tải trang chủ.
5. Đồng ý analytics để Google tag gửi dữ liệu. Trong Network lọc `collect`; mở Query String Parameters/Payload (event có thể nằm trong batch POST). Kiểm tra `tid` là Measurement ID hiện tại, `cs` lần lượt `facebook` / `tiktok` / `threads`, `cm=social`, `cn=bbook_launch`.
6. Một lần vào short link chỉ tạo page_view của trang đích; không có page_view tại `/fb`, `/tt`, `/threads`. Refresh chủ động là page_view mới hợp lệ. Trước consent/từ chối không gửi GA4 là hành vi đúng.
7. Kiểm tra Realtime/DebugView; báo cáo acquisition chuẩn có độ trễ. Dùng phiên riêng tư mới khi kiểm tra từng nguồn để tránh diễn giải sai attribution của phiên đã tồn tại.
8. Kiểm tra trang chủ không UTM, các trang pháp lý và nút APK/Google Play như trước. Có thể kiểm tra redirect production bằng `curl.exe -I 'https://bbookmakeup.com/fb'` và tương tự cho hai link còn lại.

## Phạm vi và giới hạn

Kết quả local ngày 13/10/2026: **7/7 tests đạt**, `npm run check` và `git diff --check` đạt. Build website hiện có chạy thành công trong bản sao tạm cô lập (không sao chép `.env.local`, không có dự án mobile bên cạnh để generator đồng bộ nhầm). HTTP smoke với server local của bản sao xác nhận GET/HEAD 301 cho cả ba short links, Location chính xác, document redirect rỗng không chạy Google tag, trang đích 200, refresh không loop, trang chủ/pháp lý/analytics assets không bị ảnh hưởng, URL con không match trả 404 và APK HEAD vẫn trả 200/attachment/dung lượng đúng. Không thay đổi build script, Measurement ID hoặc analytics source. Chưa test request GA4 thật hoặc lưu rules trên Render.

Chỉ thay đổi `bbook-web`: `social-redirects.json`, `scripts/social-links.mjs`, `scripts/social-links.test.mjs`, `scripts/serve.mjs`, `package.json`, `SOCIAL_SHORT_LINKS.md`, `README.md`. Không đổi UI, analytics, backend/Admin, URL tải hoặc package dependencies. Không commit/push/deploy hoặc build APK/AAB. Các rule Render, redirect production và GA4 receipt phải xác nhận sau khi bạn lưu rule/deploy; chưa có quyền truy cập Dashboard Render trong task.
