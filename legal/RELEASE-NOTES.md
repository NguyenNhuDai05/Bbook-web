# BBook policy / Phase 3 — 02/10/2026

Nguồn: legal/content.json. node scripts/generate-legal.mjs tạo privacy.html,
delete-account.html và legal/privacy.txt; npm run build đưa trang/CSS vào dist.
Privacy text đồng bộ nguyên văn vào cuối bbeauty-app/docs/chinhsach.txt.

Policy là bản chuẩn bị cho backend/app mới, chưa xác nhận production đã có Phase 3.
Phải validate backend trước khi công bố policy và build app tương ứng.

Đã bỏ AI/face-vector, thời hạn xóa vị trí sau booking, chứng nhận/pháp nhân/escrow/SLA
không chứng minh, cam kết 72h/30 ngày và lời hứa xóa/ẩn danh mọi dữ liệu. Chủ ứng dụng
đã xác nhận email hỗ trợ chính thức, trực tiếp tiếp nhận yêu cầu ngoài app.

Luồng mới: dọn dữ liệu cá nhân trong transaction, disable/login-token revoked, worker
xóa file server-owned và xác nhận missing-object; retry khi lỗi, NeedsReview cho ảnh
cũ/chia sẻ/mất reference. Giữ minimal ledger/FK, không gọi là anonymous toàn bộ.

Thời hạn đề xuất 180 ngày đối soát / 30 ngày log-backup-email nằm riêng trong audit;
không được đưa thành SLA khi chưa được xác nhận/enforce. Không có timed ledger purge.

Chưa push/deploy/production job. Website index/build/serve dirty có trước được giữ.
Không nhập URL Play Console trước khi HTTPS 200 và quy trình support/legacy hoàn chỉnh.
Xem BeautyBook/docs/ACCOUNT-DELETION-AUDIT.md và ACCOUNT-DELETION-RELEASE.md.
