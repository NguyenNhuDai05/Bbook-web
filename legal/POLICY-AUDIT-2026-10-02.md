# Cập nhật Phase 3 — 02/10/2026

Bản audit phía dưới mô tả **code trước Phase 3**, giữ lại để đối chiếu. Những thiếu sót
về xóa trường CCCD/ngân hàng/push/OTP và storage đã có bản sửa local; chưa deploy.
Xem [audit và phân loại hiện tại](D:/EXE/BeautyBook/docs/ACCOUNT-DELETION-AUDIT.md)
và [hướng dẫn phát hành/hỗ trợ](D:/EXE/BeautyBook/docs/ACCOUNT-DELETION-RELEASE.md).

Privacy website/app đã cập nhật theo luồng mới: tiếp nhận != xác nhận xóa file;
Blocked/PendingStorage/RetryPending/NeedsReview/Completed; tài khoản cũ cần đối soát
cả ảnh mất URL. Không hứa 72h/30 ngày hoặc ẩn danh không thể liên kết lại.
Chủ ứng dụng xác nhận bbooksupport@gmail.com là email chính thức được theo dõi.
Không gửi email thử, không xác nhận lịch backup/log hoặc thời hạn pháp lý từ code.

Các điểm còn phải xử lý trước công bố: xác minh dữ liệu legacy/Storage policies,
quy trình backup/log/provider, căn cứ và lịch lưu giao dịch; website chưa deploy.

---

# Đối chiếu chính sách BBook — 02/10/2026

## Kết luận
Đã chuẩn bị privacy.html và delete-account.html, đồng bộ nội dung chính sách vào app. Trang static không cần đăng nhập, có đường dẫn email yêu cầu xóa. Chưa deploy/push; chưa thể dùng kết quả local để khẳng định URL production hoạt động hoặc hệ thống đã đáp ứng toàn bộ yêu cầu Google Play.

**Blocker thực tế:** xóa tài khoản chưa xóa hết dữ liệu cá nhân liên quan; chưa có lịch lưu giữ/hủy cụ thể và quy trình thực thi đã được xác minh cho phần còn lại. Mô tả trung thực sự thiếu hụt không biến nó thành ngoại lệ lưu giữ hợp lệ.

## Căn cứ mã nguồn đã đọc
- BE `BeautyBookBackend/Services/UserService.cs:86–229`: điều kiện chặn xóa, cập nhật/xóa từng bảng và từng trường; không gọi storage deletion. Email bị thay bằng địa chỉ có UserId, UserId vẫn giữ. Không gọi đây là ẩn danh không thể liên kết lại.
- BE `Models/User.cs`, `Models/MakeupArtistProfile.cs`, `Models/Booking.cs`, `Models/BankAccount.cs`, `Models/EmailOtp.cs`, `Models/DevicePushToken.cs`, `Models/BookingComplaint.cs`: dữ liệu đang được biểu diễn/lưu.
- BE `Services/VerificationMediaService.cs`, `Services/VerificationImage.cs`, `Services/SupabaseVerificationStorage.cs`, `Controllers/VerificationMediaController.cs`: lưu ảnh thật, chuẩn hóa JPEG/loại metadata, kho private, kiểm quyền và signed URL 120 giây. Không có AI/vector trong luồng xác minh này.
- BE `Services/VerificationMediaMaintenance.cs:137–160`: dọn ảnh đủ điều kiện không được tham chiếu, quá 24 giờ, bằng job; không phải TTL xóa mọi tài liệu. Không xác nhận job đã chạy production.
- BE `Services/ComplaintService.cs`: từ chối upload ảnh khiếu nại mới, không trả ảnh legacy trong DTO; văn bản khiếu nại vẫn lưu.
- BE `Services/AuthService.cs`, `Services/EmailOtpService.cs`: đăng nhập/OTP, hạn sử dụng OTP 5 phút; hết hạn không tự xóa toàn bộ bản ghi. Bản ghi gửi OTP thất bại có thể bị gỡ riêng.
- BE `Services/PayOsService.cs`: payload tạo liên kết thanh toán gồm orderCode, amount, description, return/cancel URL, expiration/signature; không suy diễn gửi toàn bộ hồ sơ đến PayOS.
- FE `services/locationService.ts`, `app/(mua)/bank-account-form.tsx`, `app/refund-bank-account-form.tsx`, `services/NotificationService.ts`, `store/useAuthStore.ts:186–201`: vị trí chủ động, VietQR nhận dữ liệu trong URL, đăng ký push, dọn AsyncStorage/query cache khi xóa thành công.
- FE tìm kiếm luồng calendar/AI: chưa thấy đọc lịch thiết bị/Filter AI/nhận diện sinh trắc học. Quyền calendar có trong cấu hình không đồng nghĩa đã kiểm chứng truy cập lịch thiết bị. Ngày sinh/giới tính không là trường User độc lập; thông tin đó vẫn có thể xuất hiện trong ảnh CCCD hoặc văn bản người dùng nhập.

## Mâu thuẫn và nội dung bị bỏ
| Nội dung cũ | Kết quả đối chiếu / sửa |
|---|---|
| Filter AI thử makeup, vector khuôn mặt tức thời, không lưu ảnh gốc | Không có luồng tương ứng; xác minh lưu ảnh giấy tờ/chân dung, admin xét duyệt. Bỏ mô tả AI và cam kết không lưu ảnh. |
| GPS chỉ giữ trong phiên, xóa sau booking | Booking/MUA có trường địa chỉ/tọa độ, không có cleanup sau lịch hẹn. Bỏ cam kết. |
| Privacy chỉ dành Customer | Bao gồm Customer/MUA, ảnh CCCD/chứng chỉ, chat, portfolio/dịch vụ, ngân hàng và QR. |
| Hứa xóa toàn bộ không thể khôi phục trong 72 giờ (app) / 30 ngày (web) | Không có quy trình được chứng minh hoàn tất đầy đủ. Bỏ cả hai SLA; nêu đúng phạm vi và đề nghị hỗ trợ xác nhận xử lý. |
| Ẩn danh không thể liên kết lại | UserId/khóa ngoại và nhiều dữ liệu còn giữ; gọi là thay thế một phần thông tin và vô hiệu hóa. |
| PCI-DSS, giấy phép nhà cung cấp | Không chứng minh từ code; bỏ bảo đảm/chứng nhận. |
| Các lựa chọn consent GPS/AI/marketing viết trong file như đã có UI riêng | Register chỉ có checkbox điều khoản/chính sách; bỏ mô tả những lựa chọn chưa triển khai. |
| Công ty cổ phần/sàn được công nhận/escrow/theo dõi hành trình và SLA hòa giải/hoàn tiền cố định trong văn bản gộp | Không chứng minh từ code. Lưu nguyên văn bản gốc ngoài repo; thay phần terms hiển thị bằng nội dung tối thiểu, không đặt tỷ lệ/SLA hoặc tư cách pháp lý mới. |

## Dữ liệu thu thập
Tài khoản/hồ sơ/ảnh đại diện; thông tin xác thực, token và OTP; hồ sơ MUA, địa chỉ/tọa độ, mạng xã hội, portfolio/dịch vụ; ảnh CCCD/chân dung/chứng chỉ và xét duyệt; booking/ghi chú/địa chỉ; ngân hàng/QR, ví, thanh toán/hoàn tiền/chi trả; chat/ảnh, đánh giá/bình luận/thích/lưu, khiếu nại; push token, nền tảng/tên thiết bị, thông báo, lỗi/log truy cập ảnh; email hỗ trợ nếu người dùng gửi.

## Khi thao tác xóa thành công
- Xóa: thông báo, portfolio likes/saves, message reactions.
- Thay thế/bỏ: tên, email, password hash, điện thoại, URL avatar; bình luận portfolio; nội dung/URL ảnh tin nhắn của sender; comment/URL ảnh review Customer, phản hồi MUA, comment ProductReview.
- MUA: bỏ Bio, PortfolioCoverUrl, City/OperatingAreas và trường operating-location/tọa độ, ExperienceLevel/Specialization/SocialLinks; suspend. Portfolio ẩn và bỏ title/description/images/tags; dịch vụ đổi tên, bỏ description/images/tags. Bản ghi vẫn giữ.
- Push token inactive (không xóa); app clear AsyncStorage/query cache (không khẳng định dọn mọi file/cache/backup).

## Dữ liệu còn giữ và lý do được xác định
- Booking, thanh toán, hoàn tiền, ví, receivable/payout, complaint: liên quan luồng đối soát/hoàn tiền/chi trả/tranh chấp; các điều kiện unsettled chặn xóa. Chưa xác nhận thời hạn lưu sau khi giải quyết hoặc nghĩa vụ pháp lý cụ thể.
- Giấy tờ/chân dung/chứng chỉ và metadata/private storage, bank accounts/QR, Address/InstagramUrl/FacebookUrl còn lại, OTP, quan hệ tài khoản, public storage objects và push-token rows: quy trình xóa chưa xử lý đầy đủ. Không gán lý do pháp lý/chống gian lận giả định để hợp thức hóa giữ dữ liệu.
- Review ratings, account IDs/created timestamps/khóa ngoại, một số hồ sơ và liên kết nội dung vẫn tồn tại. Không khẳng định xóa vật lý hoặc ẩn danh toàn bộ.

## Chưa thể khẳng định
1. Môi trường production có đúng code/config đang đối chiếu; toàn bộ private-media legacy đã migrate/cleanup; bucket thực tế vẫn private.
2. Vùng lưu trữ, mã hóa at rest, lịch backup/log purge của hạ tầng/nhà cung cấp; quy trình yêu cầu nhà cung cấp xóa dữ liệu.
3. Email hỗ trợ nhận thư và có người/quy trình xử lý; thời gian xử lý request, xác minh khi mất email đăng ký; cơ chế ghi nhận/giải quyết manual deletion. Không gửi thư thử trong phiên này.
4. Tư cách pháp nhân, đăng ký sàn/escrow, giấy phép/certification; căn cứ/thời hạn lưu giữ tài chính cụ thể.
5. Đã có kiểm soát tuổi thực tế. 18+ là đối tượng được mô tả, chưa thấy xác minh tuổi trong đăng ký.
6. Các bản sao giữ bởi người nhận hoặc hệ điều hành; việc clear AsyncStorage không bảo đảm xóa tất cả.
7. APK/AAB đang phân phối đã chứa nội dung mới. Cần build/cập nhật app sau khi review nội dung.

## Files của lần chuẩn bị này
Web: `legal/content.json`, `scripts/generate-legal.mjs`, `privacy.html`, `delete-account.html`, `legal/privacy.txt`, `legal.css`, `legal/RELEASE-NOTES.md`, báo cáo này; build tạo bản tương ứng trong dist (ignored). Không sửa lại index/build/serve đã có thay đổi từ trước.
App: `docs/chinhsach.txt`, `docs/terms.txt`, `app/policy.tsx` (nhận heading mới, subtitle Customer/MUA và bỏ nhãn “Văn bản chính thức”). Các thay đổi logo/name trước đó được giữ nguyên.
Backup nguyên văn: `D:/EXE/policy-audit-backup-2026-10-02/chinhsach-before.txt` và `content-before.json`; script đối chiếu local ngoài repo `D:/EXE/policy-reconcile-2026-10-02.mjs`.

## Kiểm tra
- npm run build: đạt; dist chứa HTML/CSS khớp source.
- GET local `/privacy.html`, `/delete-account.html`, `/legal.css`: HTTP 200, không đăng nhập, không Set-Cookie; trang xóa có mailto nổi bật và hướng dẫn nhập email/tài khoản, không cần mật khẩu/CCCD.
- Nội dung privacy text web là phần cuối của file chính sách app, kiểm tra khớp chính xác.
- TypeScript app: đạt; diff --check đạt. Kiểm tra browser ở viewport hẹp: chữ/nút/nav không bị cắt; màu đen/hồng theo website hiện có.
- Backend không thay đổi. Không push/deploy/gửi email/xóa dữ liệu/chạy production job.

## Trước khi dùng URL Play Console
Hoàn thiện hoặc xác minh thực thi xóa dữ liệu và thời hạn giữ; xác nhận email hỗ trợ và người chịu trách nhiệm; review nghĩa vụ/chính sách vận hành. Sau đó mới công bố trang và kiểm tra HTTPS production 200/no-login. Lượt kiểm tra production trước phiên này trả 404 cho cả hai URL; local 200 không thay thế điều đó.

Nguồn chính thức: https://support.google.com/googleplay/android-developer/answer/13327111 và https://support.google.com/googleplay/android-developer/answer/10144311 . Google yêu cầu xóa dữ liệu liên quan, không chỉ vô hiệu hóa tài khoản; ngoại lệ giữ cần có lý do hợp lệ và được công bố. Trang email có thể làm đường dẫn yêu cầu, nhưng phải thực sự tiếp nhận/xử lý được.
