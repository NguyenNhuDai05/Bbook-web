# BBook Landing Page

Website giới thiệu ứng dụng BBook, tách riêng khỏi app và backend. HTML, CSS và JavaScript thuần; không cần cài thư viện. Node.js 20.11+.

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

## Chỉnh nội dung

- `index.html`: nội dung và bố cục các section.
- `styles.css`: màu thương hiệu, typography và responsive.
- `app.js`: menu mobile và URL tải app. Điền link chính thức vào `appLinks`; nút store tự chuyển sang trạng thái tải. Khi phát hành, cập nhật FAQ về ngày tải ứng dụng trong HTML.
- `favicon.svg`: biểu tượng website.

Mockup app là minh họa bằng HTML/CSS, không phải screenshot thật. Không sử dụng đánh giá, số lượng người dùng hay số liệu giả. Chưa tích hợp analytics, form, link store hay nội dung pháp lý do chưa có dữ liệu chính thức. Trước khi phát hành công khai, bổ sung chính sách quyền riêng tư/điều khoản đã được duyệt và thông tin liên hệ.

## Bản trải nghiệm Android

APK được lưu tại `assets/downloads/bbook-android.apk` và tải trực tiếp bằng nút trong `index.html`, kể cả khi JavaScript bị tắt. Thay file này để cập nhật bản thử nghiệm; đồng thời cập nhật dung lượng hiển thị. `npm run build` sao chép cả APK sang `dist/assets/downloads/`. Khi đưa website lên hosting static, cần tải lên toàn bộ `dist/` và chọn dịch vụ hỗ trợ file 114 MB. Người dùng không cần tài khoản Expo. Link cửa hàng được cấu hình riêng trong `appLinks`.

### Deploy APK từ Git

File APK 119.279.946 byte vượt giới hạn 100 MiB của một file trên GitHub. `apk-release/` chứa các phần dưới 40 MiB và manifest SHA-256; cần commit toàn bộ thư mục này. `npm run build` ghép các phần, xác minh dung lượng và SHA-256 rồi đưa APK vào `dist/assets/downloads/`. Build sẽ thất bại nếu thiếu hoặc sai file, tránh triển khai nút tải không có APK.

Khi cập nhật APK: thay `assets/downloads/bbook-android.apk`, chạy `npm run package:apk`, commit các phần và manifest mới, rồi deploy lại. Render Static Site cần Build Command `npm run build` và Publish Directory `dist`. Sau deploy, kiểm tra `/assets/downloads/bbook-android.apk` trả HTTP 200 và đúng dung lượng trong manifest. APK hiện tại yêu cầu Android 7.0 trở lên.
