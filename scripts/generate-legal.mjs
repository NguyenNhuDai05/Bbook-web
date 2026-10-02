import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const content = JSON.parse(await readFile(path.join(root, 'legal/content.json'), 'utf8'));
const escape = value => value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
for (const [key, file] of [['privacy', 'privacy.html'], ['deletion', 'delete-account.html']]) {
  const document = content[key];
  const body = document.sections.map(section => `<section><h2>${escape(section.title)}</h2>${section.paragraphs.map(p => `<p>${escape(p)}</p>`).join('\n')}</section>`).join('\n');
  const subject = encodeURIComponent('Yêu cầu xóa tài khoản BBook');
  const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(document.title)} | B-Book</title><meta name="description" content="${escape(document.title)}. Liên hệ ${escape(content.email)}."><link rel="stylesheet" href="legal.css"></head>
<body><a class="skip-link" href="#content">Đến nội dung</a><header><a class="brand" href="/">BBook</a><nav aria-label="Thông tin hỗ trợ"><a href="privacy.html">Quyền riêng tư</a><a href="delete-account.html">Xóa tài khoản</a></nav></header>
<main id="content"><p class="eyebrow">B-BOOK · THÔNG TIN NGƯỜI DÙNG</p><h1>${escape(document.title)}</h1><p class="meta">Bản sửa đổi ${escape(content.revision)} · Dành cho người từ đủ 18 tuổi</p>
${key === 'deletion' ? `<p class="request-action"><a href="mailto:${escape(content.email)}?subject=${subject}">Soạn email yêu cầu xóa tài khoản</a></p>` : ''}
${body}
<aside><h2>Liên hệ B-Book</h2><p><a href="mailto:${escape(content.email)}${key === 'deletion' ? `?subject=${subject}` : ''}">${escape(content.email)}</a></p><p>Bấm liên kết để mở ứng dụng email, hoặc sao chép địa chỉ để gửi thư. Trang này không tự gửi yêu cầu.</p></aside></main>
<footer><a href="/">BBook</a><a href="privacy.html">Chính sách quyền riêng tư</a><a href="delete-account.html">Yêu cầu xóa tài khoản</a></footer></body></html>\n`;
  await writeFile(path.join(root, file), html);
}
const privacyText = [content.privacy.title.toUpperCase(), `Nhà phát triển: ${content.developer}. Bản sửa đổi: ${content.revision}.`, ...content.privacy.sections.flatMap(s => ['', s.title, ...s.paragraphs])].join('\n\n') + '\n';
await writeFile(path.join(root, 'legal/privacy.txt'), privacyText);
console.log('Generated privacy.html, delete-account.html and legal/privacy.txt.');
