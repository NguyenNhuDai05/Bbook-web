# BBook Landing Page

Link ngắn social `/fb`, `/tt`, `/threads`: xem [hướng dẫn cấu hình Render và kiểm thử](SOCIAL_SHORT_LINKS.md). Cần nhập ba HTTP redirect rules trên Render Dashboard; deploy source không tự áp dụng rule hosting.

Chia sẻ hồ sơ `https://bbookmakeup.com/mua/{id}`, bài viết `/posts/{id}` và xác minh Android: xem [hướng dẫn rollout chia sẻ](PROFILE_SHARING.md). Source đã chuẩn bị association; cần deploy website và thêm hai rule hosting trước khi phát hành link.

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
- `assets/images/bbook-logo.png`: logo do chủ ứng dụng cung cấp, dùng cho đầu/chân trang và biểu tượng website. CSS phóng phần chữ ở giữa ảnh gốc để logo không bị nhỏ do khoảng trống quanh ảnh.

Mockup app là minh họa bằng HTML/CSS, không phải screenshot thật. Không sử dụng đánh giá, số lượng người dùng hay số liệu giả. Google Analytics 4 được bật qua cấu hình môi trường và đồng ý cookie; xem [hướng dẫn GA4](GA4_SETUP.md). Các nút tải hiện mở Google Play và phát event `play_store_click` khi người dùng đã đồng ý thống kê. Phiên bản iOS chưa được phát hành.

## Phát hành Android trên Google Play

Landing page dùng Google Play để người dùng cài đặt và cập nhật BBook. Các nút tải APK, dung lượng file và hướng dẫn cài từ nguồn ngoài đã được thay bằng nút “Tải app” và hướng dẫn cài qua CH Play. Bộ đếm APK cũ không ghi nhận các lượt nhấn Google Play.

Website không còn lưu trữ hoặc phân phối APK. Các phần APK cũ, manifest và lệnh đóng gói APK đã được bỏ khỏi repository. Build không phụ thuộc bản Android và không thay đổi ảnh hay cấu hình cache.

### Deploy website trên Render

Giữ Build Command `npm run build` và Publish Directory `dist`. Build tạo lại thư mục `dist/` để loại bỏ APK còn sót từ lần build cũ, loại trừ `assets/downloads/` và mọi file `.apk` trong assets. Các ảnh được sao chép nguyên byte; các trang pháp lý và `.well-known/assetlinks.json` vẫn được xuất bình thường.

Sau khi tự deploy, kiểm tra trang chủ/nút Google Play, ảnh, trang pháp lý, link social và xác minh Android còn hoạt động. URL cũ `/assets/downloads/bbook-android.apk` phải trả 404 và không còn tải APK. Nếu hosting có rule fallback bắt mọi đường dẫn, cần bảo đảm URL này không trả nội dung APK; file không còn trong bản build. Source thay đổi không tự cập nhật nội dung đang chạy trước khi có deploy mới.
