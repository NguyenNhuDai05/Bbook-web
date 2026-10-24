# BBook Landing Page

Link ngắn social `/fb`, `/tt`, `/threads`: xem [hướng dẫn cấu hình Render và kiểm thử](SOCIAL_SHORT_LINKS.md). Cần nhập ba HTTP redirect rules trên Render Dashboard; deploy source không tự áp dụng rule hosting.

Website giới thiệu ứng dụng BBook, tách riêng khỏi app và backend. HTML, CSS và JavaScript thuần; không có Next.js/App Router và không cần cài thư viện. Node.js 22.16+.

## Chạy trong VS Code

Mở folder này, mở Terminal và chạy:

```sh
npm run dev
```

Mở http://localhost:5173. Refresh trình duyệt sau khi sửa file.

## Build

```sh
npm run build
```

Các file website nằm trong `dist/`, có thể đưa lên dịch vụ hosting static.

Trang chính sách có URL không đuôi: `/privacy/` và `/delete-account/`.
Build tạo `privacy/index.html` và `delete-account/index.html` trong `dist/`;
hosting cần hỗ trợ directory index. Các URL `.html` cũ vẫn được giữ.
Sau khi tự deploy, kiểm tra hai URL mới tải đúng nội dung, CSS và email hỗ trợ
trước khi thay URL trong Google Play Console. Việc sửa local không cập nhật website production.

## Chỉnh nội dung

- `index.html`: nội dung và bố cục các section.
- `styles.css`: màu thương hiệu, typography và responsive.
- `app.js`: menu mobile, xem ảnh và hiệu ứng xuất hiện nội dung.
- Các nút “Tải app” và Google Play nằm trong `index.html`, trỏ trực tiếp tới `https://play.google.com/store/apps/details?id=com.bbook.app` và hoạt động cả khi tắt JavaScript. Khi đổi URL cửa hàng, cập nhật tất cả liên kết `data-store="android"`.
- `favicon.svg`: biểu tượng website.

Mockup app là minh họa bằng HTML/CSS, không phải screenshot thật. Không sử dụng đánh giá, số lượng người dùng hay số liệu giả. Google Analytics 4 được bật qua cấu hình môi trường và đồng ý cookie; xem [hướng dẫn GA4](GA4_SETUP.md). Các nút tải hiện mở Google Play và phát event `play_store_click` khi người dùng đã đồng ý thống kê. Phiên bản iOS chưa được phát hành.

## Phát hành Android trên Google Play

Landing page dùng Google Play để người dùng cài đặt và cập nhật BBook. Các nút tải APK, dung lượng file và hướng dẫn cài từ nguồn ngoài đã được thay bằng nút “Tải app” và hướng dẫn cài qua CH Play. Bộ đếm APK cũ không ghi nhận các lượt nhấn Google Play.

Các file APK và quy trình đóng gói cũ bên dưới vẫn được giữ trong repository; build hiện vẫn sao chép APK sang `dist/`, nhưng landing page không còn liên kết tải file này.

### Deploy APK từ Git

File APK 119.279.946 byte vượt giới hạn 100 MiB của một file trên GitHub. `apk-release/` chứa các phần dưới 40 MiB và manifest SHA-256; cần commit toàn bộ thư mục này. `npm run build` ghép các phần, xác minh dung lượng và SHA-256 rồi đưa APK vào `dist/assets/downloads/`. Build sẽ thất bại nếu thiếu hoặc sai file, tránh triển khai nút tải không có APK.

Khi cập nhật APK: thay `assets/downloads/bbook-android.apk`, chạy `npm run package:apk`, commit các phần và manifest mới, rồi deploy lại. Render Static Site cần Build Command `npm run build` và Publish Directory `dist`. Sau deploy, kiểm tra `/assets/downloads/bbook-android.apk` trả HTTP 200 và đúng dung lượng trong manifest. APK hiện tại yêu cầu Android 7.0 trở lên.
