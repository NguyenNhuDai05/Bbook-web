# Bộ đếm lượt nhấn APK nội bộ

Deploy theo thứ tự backend → admin → website. Backend cần migration `20261015000000_AddWebsiteApkCounters`, biến `WebsiteMetrics__Enabled=true` và origin website nằm trong danh sách cho phép (mặc định https://bbookmakeup.com và https://www.bbookmakeup.com).

Website thêm biến public trước build/start:

```text
APK_COUNTER_API_URL=https://beautybook-13zj.onrender.com/api/WebsiteMetrics/apk-click
```

Giữ Measurement ID GA4 đang có để GA4 tiếp tục hoạt động song song. Bộ đếm nội bộ không phụ thuộc Measurement ID hoặc service account Google nhưng vẫn dùng consent UI hiện có. Không đưa secret/key/token vào biến public này. `apk-counter.js` phải trả HTTP 200 sau deploy. Node server và bản dist đều đã bao gồm script mới. Không sửa APK, link tải hoặc hash release.

Chỉ ghi nhận click thật, không bị hủy, trên link APK đang bật và đã đồng ý Analytics. Mỗi click có UUID mới; tối đa ba lần gửi dùng cùng UUID. Server unique ID chống đếm lại khi retry. Lỗi gửi không chặn tải APK; offline, tắt browser sớm hoặc từ chối consent có thể làm lượt nhấn không được ghi nhận. Dữ liệu gồm UUID, giờ server nhận và ngày Việt Nam, không lưu user ID/IP/referrer/URL đầy đủ trong bảng counter.

Admin hiển thị theo ngày, tự cập nhật khoảng 45 giây (cache server 10 giây). Đây là nguồn riêng với GA4; trước lần nhận click đầu tiên chưa có dữ liệu, các ngày trước đó là —. Không backfill hoặc cộng số GA4 cũ. Cần backend hoạt động để giao dữ liệu; Render cold start/outage vẫn có thể gây trễ hoặc mất telemetry best effort.

Nghiệm thu: đồng ý Analytics → bấm APK → xác nhận APK vẫn tải → Admin tăng ở đúng ngày sau chu kỳ refresh. Refresh trang mà không bấm APK không tăng counter. Kiểm tra từ chối consent không gửi POST. Không tạo click giả vào production khi chạy tests. Cấu hình Origin không phải cơ chế chống gian lận; endpoint có rate limit, số liệu là thống kê sử dụng, không dùng làm hóa đơn.
