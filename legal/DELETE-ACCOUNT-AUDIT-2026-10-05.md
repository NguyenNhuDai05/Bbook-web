# Audit xóa tài khoản BBook — 05/10/2026

Phạm vi: đọc code local mobile/backend/web; sửa riêng nội dung và cách trình bày trang /delete-account/. Không sửa backend/mobile, migration hoặc dữ liệu; không push/deploy. Kết quả đọc code không xác nhận phiên bản production, worker đang chạy hoặc tệp thật đã được xóa.

## A. Deletion implementation

Luồng khách hàng: app/(tabs)/_layout.tsx đặt tên tab **Tài khoản** → app/(tabs)/profile.tsx → useAuthStore.deleteAccount → authService → ApiAuthRepository DELETE /User/me → UserController.DeleteOwnAccount → UserService.DeleteOwnAccountAsync → AccountDeletionService.DeleteAsync.

Luồng MUA: Profile → nút mở /(mua)/settings trong profile.tsx → Xóa tài khoản; sau đó dùng cùng luồng.

Luồng ngoài app: email hỗ trợ; AccountDeletionAdminController POST api/admin/account-deletions/{userId} yêu cầu ConfirmOwnerRequestVerified rồi dùng cùng service. Code không chứng minh hộp thư được theo dõi hoặc có thời hạn phản hồi; cần kiểm tra vận hành.

Service mở transaction và khóa chống xung đột, kiểm tra write guards, ghi yêu cầu. Khi đủ điều kiện, dọn dữ liệu liên quan, thay tên thành Người dùng đã xóa, email thành deleted-{id}@deleted.bbook.local, bỏ phone/avatar, thay password hash bằng dữ liệu ngẫu nhiên, IsActive=false và DeletedAt được ghi. Bản ghi Users vẫn tồn tại: đây là PSEUDONYMIZE kèm vô hiệu hóa xác thực, không hard delete, không phải ẩn danh tuyệt đối.

JWT OnTokenValidated trong Program.cs kiểm tra IsActive/DeletedAt cho yêu cầu mới; AccountConnections.Abort ngắt chat, worker tiếp tục kiểm tra kết nối. AuthService chặn đăng nhập mật khẩu/đặt lại mật khẩu với tài khoản đã xóa. Đăng nhập Google tìm theo email được Google xác minh: email cũ không còn trên Users nên tạo user mới. Không có Google subject/token riêng trong User model để xóa; ảnh Google là URL bên ngoài, code chỉ bỏ liên kết, không xóa ảnh/tài khoản tại Google. Đăng ký cùng email không phục hồi bản ghi cũ.

HTTP 202 là tiếp nhận sau khi dọn dữ liệu hồ sơ; không phải xác nhận mọi tệp đã xóa. ReferenceCode là UserId; app lấy cùng mã từ authUser.id trước khi đăng xuất, không phải mã yêu cầu độc lập. Repository hiện bỏ response body nhưng mã hiển thị đúng nguồn này.

## Điều kiện chặn, theo AccountDeletionService.cs

| Nhóm | Điều kiện thực tế |
|---|---|
| Booking | Pending, Approved, WaitingCustomer, PendingPayment, PendingConfirmation, InProgress, Disputed cho CustomerId hoặc MUAId |
| Tiền cọc/thanh toán booking | Frozen, RefundPending, DepositHeld |
| BookingPayments của khách hàng | Created, Pending, RefundPending |
| Refund của booking hai bên | Pending, ManualActionRequired, Processing, Failed, AwaitingDestination |
| Nạp tiền | WalletTopUps Pending |
| Số dư | Wallet.Balance != 0 |
| Khoản MUA phải nhận | OnHold, Available, Frozen, PayoutPending |
| Payout | Pending, ManualActionRequired, Processing, hoặc Failed chưa ReconciledAt |
| Khiếu nại | BookingComplaints IsOpen của booking liên quan |

Blocked lưu yêu cầu nhưng chưa dọn dữ liệu; worker chỉ chọn DatabaseCompletedAt có giá trị nên không tự xóa khi tất toán xong. Cần chủ tài khoản/support xác nhận lại. Admin và demo/review accounts có bảo vệ riêng, không dùng để test deletion tài khoản thật.

## B. Google Play gaps và gap analysis

Google yêu cầu đường dẫn trong app và bên ngoài, xóa associated data, không coi deactivate là deletion, minh bạch dữ liệu giữ lại. Nguồn: https://support.google.com/googleplay/android-developer/answer/13327111 và https://support.google.com/googleplay/android-developer/answer/10144311 . Email support là một lối khởi tạo yêu cầu phù hợp về hình thức, nhưng phải thực sự được xử lý.

| Nội dung | Code thực tế | Trang trước sửa | Đề xuất đã thực hiện |
|---|---|---|---|
| Deletion | Pseudonymization + cleanup + worker xóa tệp | Chủ yếu nói vô hiệu hóa | Nêu tài khoản không dùng được và dữ liệu cá nhân được loại bỏ |
| Navigation | Tài khoản; MUA Profile → Cài đặt | Cá nhân; Cài đặt | Sửa đúng nhãn trong code |
| Email | Hỗ trợ + admin xử lý yêu cầu đã xác minh | Có subject, văn bản lặp | CTA nổi bật, body ngắn, email dễ chọn/copy |
| Tệp | Xóa provider, xác nhận mất tệp; legacy/shared NeedsReview | Dày thuật ngữ | Giải thích xử lý sau và ngoại lệ |
| Retention | IDs/history/rating/moderation vẫn còn | Foreign key, database relation | Mục đích đối soát và duy trì quyết định kiểm duyệt |
| Thời gian | Không có SLA chung | Nhắc 72h/30 ngày để phủ định | Bỏ con số và cam kết không có bằng chứng |

Không phát hiện CRITICAL kiểu chỉ IsActive=false và để nguyên toàn bộ hồ sơ. Tuy nhiên, chưa thể xác nhận đạt mọi yêu cầu Google Play chỉ bằng code/trang mới:

- Ảnh legacy không xác định được ownership hoặc không còn URL có thể chưa được xóa; NeedsReview cần xử lý vận hành thực tế.
- Ảnh được nơi khác tham chiếu không được worker tự xóa, cần quyết định phạm vi và kết quả.
- Không có thời hạn retention/expiry chung cho transaction history, IDs, rating, media manifests, deletion records. Cần xác định chính sách thực tế, không tự thêm thời hạn.
- Bản ghi Users, profile và nội dung lịch sử còn liên kết với ID; không tuyên bố đã ẩn danh tuyệt đối.
- Chưa xác minh live deployment/migrations/write guards/provider bucket/worker, hiệu lực token cũ trên production hoặc support inbox.
- Mobile còn câu “Xóa vĩnh viễn tài khoản và dữ liệu cá nhân” và thông báo “vô hiệu hóa”; cách viết có thể khiến hiểu sai phạm vi/timing. Chỉ ghi nhận, không sửa mobile theo giới hạn yêu cầu.

## C/D. Associated data và dữ liệu giữ lại

Bằng chứng chính: Services/AccountDeletionService.cs và AccountDeletionData.cs, cùng Models và DbSets trong ApplicationDbContext.

| Nhóm | Phân loại | Kết quả |
|---|---|---|
| Customer account/profile | PSEUDONYMIZE / RETAIN | Không có entity CustomerProfile riêng; User giữ ID, role, CreatedAt, các cờ; xóa nhận dạng nêu trên |
| MUA bio, address, locations, tọa độ, socials, xác minh | PSEUDONYMIZE / RETAIN | Bỏ/reset dữ liệu; profile Suspended; AverageRating/TotalBookings và ID vẫn còn |
| Khu vực hoạt động, styles, schedule, time off, follows/blocks | DELETE | OperatingAreas.Clear xử lý tracked children khi SaveChanges; nhóm còn lại ExecuteDelete |
| Portfolio/feed/posts | PSEUDONYMIZE / RETAIN / FILE CLEANUP | Portfolio là bài trong feed; ẩn, bỏ title/description/images/tags; ID/history vẫn còn; không thấy entity FeedPost độc lập |
| Services | PSEUDONYMIZE / RETAIN / FILE CLEANUP | IsActive=false, tên thay thế; bỏ description/images/tags; Price/DurationMinutes và ID còn |
| CCCD, portrait, certificates | PSEUDONYMIZE / FILE CLEANUP / RETAIN | Bỏ liên kết hồ sơ; media manifest và deletion audit metadata còn; dọn hash/size/context khi private file và legacy đã xóa |
| Bank/MoMo receiving accounts | DELETE / PSEUDONYMIZE / FILE CLEANUP | Xóa BankAccounts của người yêu cầu; bỏ destination/payout snapshots thuộc người đó; không xóa tài khoản của bên còn lại |
| Bank QR | UNVERIFIED với legacy | Bank QR hiện tại giải mã dữ liệu, không chứng minh có file bank QR mới; các URL cũ được capture và có thể NeedsReview |
| Wallet/balance | RETAIN | Balance phải bằng 0; wallet tồn tại; transaction description bị bỏ |
| Booking/booking services | PSEUDONYMIZE / RETAIN | Bỏ địa chỉ, tọa độ, notes, cancel/dispute reason; thay service name; IDs, amount/status/timestamps còn |
| Payments/topups/refunds/payouts/receivables | PSEUDONYMIZE / RETAIN | Bỏ checkout/QR/webhook cho payments/topups của người đó, lý do/lỗi liên quan và nhận tiền snapshots theo phạm vi; giữ amounts/status/IDs/timestamps để đối soát |
| Chat | PSEUDONYMIZE / RETAIN / FILE CLEANUP | Bỏ content/image của sender; ChatRooms, messages IDs, timestamp còn; reaction của người yêu cầu bị DELETE |
| Reviews/product reviews | PSEUDONYMIZE / RETAIN / FILE CLEANUP | Bỏ comment/image của customer và reply của MUA; product review comment bỏ; Rating/ID/date còn |
| Comments | PSEUDONYMIZE / RETAIN | Thay nội dung comment của user hoặc trên portfolio của MUA; có thể xử lý cả comment bên khác trên portfolio bị dọn |
| Likes/saves | DELETE | Của user hoặc trên portfolio của user |
| Notifications/push tokens/OTP | DELETE / PSEUDONYMIZE | Xóa của user và OTP theo email; giảm thiểu notification của người khác khi tìm được liên kết booking/message/account; bản notification trên thiết bị/Expo không được chứng minh xóa |
| Complaints | PSEUDONYMIZE / RETAIN / FILE CLEANUP | Bỏ body/images tin nhắn của author; bỏ description/decision reason theo phạm vi; giữ case IDs/decision fields; case mở chặn deletion |
| ContentReports | PSEUDONYMIZE / RETAIN | Bỏ description/decision note; Pending chuyển Dismissed; giữ IDs/decisions để không phục hồi nội dung bị kiểm duyệt |
| Product catalogue/styles/notification campaigns | RETAIN | Dữ liệu hệ thống không thuộc tài khoản khách hàng; không xóa toàn cục |
| Deletion requests/media records/private-media maintenance jobs | RETAIN / UNVERIFIED | Metadata phục vụ xử lý và kiểm tra; không có retention expiry chung. PrivateMediaJobs.RequestedBy là admin; deletion admin bị từ chối; không thấy cleanup job metadata trong flow customer/MUA |

Lý do đối soát được hỗ trợ bởi lifecycle booking/payment/refund/payout. Không suy ra nghĩa vụ pháp lý cụ thể hoặc chứng nhận compliance từ việc bản ghi vẫn tồn tại. Nội dung người khác không tự động bị xóa toàn bộ; ngoại lệ comment trên portfolio và notification liên quan được dọn như bảng trên.

## E. File cleanup

CaptureObjectsAsync thu URL avatar, MUA cover/xác minh/certificates, portfolios, services, chat, reviews, bank QR, payouts/refunds QR và complaint messages trước khi dọn. Đồng thời chọn toàn bộ VerificationMedia/OwnedPublicMedia theo OwnerId, kể cả uploads chưa gắn nội dung, đánh dấu DeletedAt. Public uploader SupabaseImageStorage ghi OwnerId và object key uploads/{owner}/{mediaId}; private uploader VerificationMediaService ghi owner/purpose/context/checksum/location; QR riêng tư dùng FinancialMediaService.

AccountDeletionWorker được đăng ký Program.cs, chọn request đã dọn DB chưa Completed, xử lý qua AccountDeletionStorage. Lỗi đặt RetryPending và lần thử sau 5 phút; NeedsReview có lần thử tiếp sau 1 giờ. Worker không tự xử lý Blocked hoặc tự quyết định legacy ownership.

AccountDeletionStorage gọi DeleteAsync rồi DownloadAsync; chỉ StorageObjectMissingException mới xác nhận tệp mất. SupabaseVerificationStorage.DeleteAsync gửi HTTP DELETE object/{bucket}, không chỉ null URL. FinancialStorage dùng bucket riêng và kiểm tra private. Public files được xóa từ public/legacy bucket. Kiểm tra đường dẫn, owner, nơi lưu và tham chiếu còn lại trước khi xóa. Private legacy có checksum/location proof. Incomplete uploads được chờ trước khi xác nhận xóa.

| Media | Kết luận từ code |
|---|---|
| Avatar, portfolio, service, review, complaint/feed images | FILE CLEANUP nếu OwnedPublicMedia/owner xác định và không còn reference; legacy cần review |
| CCCD hai mặt, portrait, certificates, chat images | FILE CLEANUP qua VerificationMedia và kiểm tra source legacy nếu có |
| QR MoMo private | FILE CLEANUP qua financial target; snapshot refs được bỏ trong phạm vi; financial legacy còn cần review |
| Google avatar, tệp ngoài provider BBook | Chỉ bỏ URL liên kết; không chứng minh xóa ở Google/ngoài hệ thống |
| Public legacy chưa track/lost references, shared files, đổi storage location | UNVERIFIED / NeedsReview, không coi null URL là xóa thật |
| Provider backups/logs/cache và bản sao thiết bị/người khác | UNVERIFIED; chưa có cơ chế chứng minh xóa tất cả |

Không thực hiện production delete hoặc chạy cleanup. “Có code xóa thật” khác “đã xác nhận xóa tệp production”.

## F. Privacy Policy synchronization issue

Không sửa ý nghĩa Privacy Policy trong đợt này. Ba điểm cần xem xét:

1. Mục 7 câu “Đối với tài khoản khách hàng, chức năng này nằm tại Cá nhân → Xóa tài khoản.” Code hiện tại đặt nhãn tab **Tài khoản**. Đề xuất Tài khoản → Xóa tài khoản; MUA có thể ghi đầy đủ Profile → Cài đặt → Xóa tài khoản. Trang deletion đã dùng nhãn đúng.
2. Mục 7 câu “Một số dữ liệu tối thiểu liên quan đến booking, giao dịch, thanh toán, tranh chấp, bảo mật hoặc nghĩa vụ pháp lý có thể được giữ lại khi cần thiết.” Code không chứng minh nghĩa vụ pháp lý cụ thể; đề xuất chỉ nêu đối soát giao dịch, giải quyết tranh chấp và duy trì quyết định xử lý nội dung nếu đó là mục đích vận hành được xác nhận. Mục 6 cũng có cụm “đáp ứng các nghĩa vụ áp dụng” cần xem căn cứ.
3. Mục 7 “...không làm mất dữ liệu cần thiết của người dùng khác hoặc phá vỡ các bản ghi cần giữ lại.” Vế “phá vỡ các bản ghi” là lý do kỹ thuật; đề xuất mô tả nội dung người khác và lịch sử cần đối soát. Code dọn cả comment trên portfolio của MUA và notifications liên quan nên không hiểu là mọi nội dung người khác luôn nguyên vẹn.

Các phạm vi booking/payment/bank/MoMo/verification/private media/chat/legacy/provider còn lại tương thích về bản chất. Không xác nhận tên nhãn trên APK production cũ.

## G. Files changed

legal/content.json (chỉ deletion); scripts/generate-legal.mjs (intro/CTA/body/link riêng trang deletion); legal.css (selectors riêng deletion-page); delete-account.html; delete-account/index.html; legal/DELETE-ACCOUNT-AUDIT-2026-10-05.md (báo cáo này). privacy.html và privacy/index.html không có diff; nội dung Privacy Policy được giữ nguyên. Trang public không chứa bảng audit/developer notes này.

## H. Validation

npm run build: PASS. node --check scripts/generate-legal.mjs và scripts/build.mjs: PASS. Project không khai báo TypeScript/lint/test scripts; không tự ghi là đã chạy những check không tồn tại.

Edge headless trên local dist /delete-account/: HTTP 200, không horizontal overflow ở 320/375/390/768/1280px. Kiểm tra mailto recipient, decoded subject và body: PASS. Screenshot 390px đã xem; heading/CTA/email/link dễ thấy, không redesign landing. Chưa xác nhận mở mail client thực tế hoặc gửi email. Không gửi thư trong audit.

## I. Manual checks before Google Play submission

- Kiểm tra URL production /delete-account/ công khai, không login, đúng nội dung đã duyệt sau khi bạn chủ động deploy. Đối chiếu tên BBook/B-Book với store listing.
- Mở CTA trên Android và desktop: mail client điền đúng người nhận, subject/body; trường hợp không có mail client vẫn copy email được.
- Dùng tài khoản thử customer/MUA thường trên staging, không dùng protected demo review account: xóa đủ điều kiện; thử booking/refund/payout/balance/complaint chưa giải quyết; kiểm tra việc xác nhận lại sau tất toán.
- Xác nhận JWT cũ bị từ chối, chat ngắt, password/Google không phục hồi account cũ, đăng ký lại tạo ID mới.
- Xác nhận cleanup worker/migrations/guards/provider đúng môi trường và tệp của tài khoản thử thực sự không còn truy cập; kiểm tra PendingStorage/RetryPending/NeedsReview và legacy/shared cases. Không chạy xóa production hàng loạt để kiểm tra.
- Xác nhận support inbox có người xử lý và admin có thể thực hiện yêu cầu đã xác minh; lưu mã tham chiếu và kiểm tra kết quả được phản hồi.
- Xác định phạm vi/mục đích/thời hạn thực tế của dữ liệu còn giữ, xử lý các Privacy Policy synchronization issues và đối chiếu Data safety với hành vi thật. Không tuyên bố compliance trước khi những điểm vận hành này được xác minh.
