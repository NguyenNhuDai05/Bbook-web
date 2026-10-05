# Đối chiếu Privacy Policy — 05/10/2026

Phạm vi: bbeauty-app, BeautyBook/BeautyBookBackend và bbook-web hiện tại. Bản người dùng gửi là nền tảng nội dung; không bổ sung chức năng từ suy đoán. Tài liệu này là ghi chú kiểm tra, không hiển thị trong app hoặc trang privacy.

| Nội dung | Bằng chứng trong project / kết quả |
|---|---|
| Mật khẩu, OTP | AuthService.cs, PasswordHasher.cs, EmailOtpService.cs: mật khẩu/OTP được băm, OTP có thời hạn. Không đưa thuật toán vào chính sách. |
| Đăng nhập Google | AuthService.GoogleLoginAsync: email, tên và ảnh đại diện. Đã nêu rõ loại dữ liệu. |
| Hồ sơ công khai | MuaService.MapToDto: hồ sơ công khai loại email, số điện thoại và giấy tờ; điểm công khai phụ thuộc lựa chọn của MUA. |
| Vị trí | locationService.ts: xin quyền foreground khi người dùng gọi current(); NearbyMuasController.BuildQuery làm gần đúng vị trí không công khai trước khi tính khoảng cách. Không có luồng theo dõi nền trong app. |
| Xác minh | VerificationMediaController và VerificationMediaService: ảnh giấy tờ, chân dung, chứng chỉ lưu riêng tư; xét duyệt admin. Không tìm thấy xử lý nhận diện khuôn mặt/AI trong luồng này. |
| QR ngân hàng | UploadController.UploadBankQr: đọc ảnh, không gọi Storage. Đã bỏ cách diễn đạt mơ hồ “không lưu lâu dài như ảnh công khai”. |
| QR MoMo | FinancialMediaService, FinancialMediaController: ảnh nhận tiền lưu riêng tư, owner/admin truy cập theo việc xét duyệt/chi trả/hoàn tiền. |
| Chat và báo cáo | ChatController kiểm tra thành viên; ModerationService.Detail/ReportedImage cho admin xem tin nhắn và ảnh bị báo cáo. Đã sửa câu “chỉ” người trong chat được xem. |
| Thông báo | ChatNotificationService.QueueMessageAsync tạo tên người gửi + tối đa 160 ký tự xem trước; PushNotificationWorker gửi nội dung qua Expo. Đã bổ sung loại dữ liệu này. |
| Tương tác | FollowController, ModerationService và các luồng like/save/comment/review: đã bổ sung theo dõi, chặn và báo cáo. |
| Tích hợp bên thứ ba | Program.cs: Brevo, Supabase Storage, Expo, PayOS; LocationService: Google Places/Geocoding. Supabase database chỉ xuất hiện trong cấu hình ví dụ, không đủ để kết luận database production ở Supabase: chính sách chỉ xác nhận Supabase cho tệp. Chủ dự án xác nhận website deploy Render. |
| Xóa có điều kiện | AccountDeletionService.DeleteAsync: ghi nhận Blocked nếu còn booking/giao dịch/số dư/khiếu nại; chưa xóa tài khoản, cần xác nhận lại sau tất toán. Đã nói rõ, không hứa tự xóa khi tất toán. |
| Dọn dữ liệu và tệp | AccountDeletionData/Storage/Worker: dọn nội dung cá nhân, giữ một số cấu trúc/lịch sử giao dịch; tệp xác định chủ sở hữu xử lý riêng và thử lại. Bổ sung ảnh công khai, phân biệt tiếp nhận và hoàn tất xóa ảnh; không hứa xóa tất cả ngay. |

## Những tuyên bố không thể chứng minh chỉ bằng source code

“Không bán dữ liệu” là cam kết vận hành do chủ dự án cung cấp trong bản chính sách, không phải kết luận rằng việc tìm kiếm code chứng minh mọi hoạt động của tổ chức. Đối tượng 18+ là phạm vi dịch vụ; không bổ sung tuyên bố có kiểm tra tuổi vì không thấy luồng đó. Hoạt động email hỗ trợ, thời hạn log/backup của nhà cung cấp, cấu hình production và nghĩa vụ pháp lý không thể xác nhận chỉ từ code. Không thêm SLA, chứng nhận bảo mật, xuất dữ liệu, AI, mã hóa đầu cuối hay xóa tự động chưa tồn tại.

## Kiểm tra nội dung và phân phối

Privacy Policy có 11 mục, có nhóm dữ liệu dễ đọc. Web và app sinh từ legal/content.json; app giữ phần điều khoản hiện đang hiển thị. Trang công khai không cần đăng nhập. Google Play yêu cầu chính sách mô tả dữ liệu, cách dùng/chia sẻ, bảo vệ, lưu giữ/xóa và liên hệ: https://support.google.com/googleplay/android-developer/answer/10144311 . Đây không phải xác nhận được Google Play duyệt hoặc thay thế việc khai Data safety theo bản phát hành thực tế.
