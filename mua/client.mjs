export function checkoutUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'pay.payos.vn' || url.username || url.password || url.port) throw new Error('Địa chỉ thanh toán không hợp lệ.');
  return url.href;
}
export const money = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
export const date = value => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)) : '—';
export const labels = { PaymentPending: 'Chờ thanh toán', PaidAwaitingFulfillment: 'Đã nhận tiền · đang cấp quyền', Fulfilled: 'Đã hoàn tất', ManualReview: 'Đang được hỗ trợ kiểm tra', Cancelled: 'Đã hủy / hết hạn', Refunded: 'Đã hoàn tiền', Revoked: 'Quyền đã thu hồi', Preparing: 'Đang chuẩn bị', Scheduled: 'Đã lên lịch', Published: 'Đã đăng', NeedsContent: 'Cần bổ sung nội dung', RevisionRequested: 'Đang xử lý yêu cầu sửa', Approved: 'Đã được duyệt', PendingReview: 'Chờ xét duyệt', Rejected: 'Cần cập nhật hồ sơ', Draft: 'Đang hoàn thiện' };
const errors = { CUSTOMER_AI_CHECKOUT_DISABLED: 'Thanh toán AI hiện chưa mở. Bạn chưa bị tính phí.', AI_ALREADY_PURCHASED: 'Tài khoản đã có quyền AI. Hãy đồng bộ lại trạng thái.', CUSTOMER_REQUIRED: 'Gói AI này dành cho tài khoản Customer.', PAYOS_CONFIG_MISSING: 'Thanh toán đang được cấu hình. Vui lòng thử lại sau.', LIVE_PAYOS_DISABLED: 'Thanh toán hiện chưa mở.', TERMS_VERSION_MISMATCH: 'Điều khoản đã cập nhật. Hãy tải lại trang trước khi tiếp tục.', PAYMENT_MISMATCH: 'Giao dịch đang cần kiểm tra. Vui lòng giữ mã đơn và liên hệ hỗ trợ.', WEB_CHECKOUT_DISABLED: 'Thanh toán hiện chưa mở. Bạn chưa bị tính phí.', ACTIVATION_NOT_PURCHASABLE: 'Tài khoản đã được kích hoạt hoặc được miễn phí.', MUA_NOT_ELIGIBLE: 'Hồ sơ hiện chưa đủ điều kiện thực hiện giao dịch.', MUA_NOT_APPROVED_OR_SUSPENDED: 'Hồ sơ cần được duyệt và đang hoạt động trước khi thanh toán.', EMAIL_NOT_VERIFIED: 'Email tài khoản chưa có bằng chứng xác minh. Vui lòng liên hệ hỗ trợ.', PENDING_ORDER_NEEDS_REVIEW: 'Một đơn trước đang cần đối soát. Vui lòng liên hệ hỗ trợ.', REVISION_ALREADY_USED: 'Bài đăng này đã sử dụng lượt yêu cầu sửa.' };
export function createClient(origin, fetcher = fetch) {
  if (origin) { const url = new URL(origin); if (!(url.protocol === 'https:' || url.hostname === '127.0.0.1' || url.hostname === 'localhost') || url.username || url.password || url.pathname !== '/') throw new Error('Cấu hình kết nối không hợp lệ.'); }
  let csrf = '';
  return {
    setCsrf(value) { csrf = value; },
    async call(path, method = 'GET', body, key) {
      if (!/^\/[a-z0-9/-]+$/i.test(path)) throw new Error('Đường dẫn không hợp lệ.');
      let response;
      try { response = await fetcher(`${origin}/api/web/mua${path}`, { method, signal: AbortSignal.timeout(25000), credentials: 'include', cache: 'no-store', headers: { 'Content-Type': 'application/json', ...(method !== 'GET' ? { 'X-BBook-CSRF': csrf } : {}), ...(key ? { 'Idempotency-Key': key } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }); }
      catch { throw new Error('Chưa kết nối được với BBook. Vui lòng kiểm tra mạng và thử lại.'); }
      const data = response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) { const error = new Error(errors[data?.code] || data?.message || (response.status === 401 ? 'Vui lòng đăng nhập lại.' : response.status === 403 ? 'Phiên làm việc không hợp lệ. Vui lòng đăng nhập lại.' : 'Chưa thực hiện được yêu cầu. Vui lòng thử lại hoặc liên hệ hỗ trợ.')); error.status = response.status; error.code = data?.code; throw error; }
      return data;
    },
  };
}
