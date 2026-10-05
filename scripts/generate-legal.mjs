import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const content = JSON.parse(await readFile(path.join(root, 'legal/content.json'), 'utf8'));
const escape = value => value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
for (const [key, file] of [['privacy', 'privacy.html'], ['deletion', 'delete-account.html']]) {
  const document = content[key];
  const paragraphs = items => items.map(p => `<p>${escape(p)}</p>`).join('\n');
  const body = document.sections.map(section => `<section><h2>${escape(section.title)}</h2>${paragraphs(section.paragraphs)}${(section.subsections || []).map(subsection => `<h3>${escape(subsection.title)}</h3>${paragraphs(subsection.paragraphs)}`).join('\n')}</section>`).join('\n');
  const subject = encodeURIComponent('Yêu cầu xóa tài khoản BBook');
  const emailBody = encodeURIComponent('Xin chào BBook,\n\nTôi muốn yêu cầu xóa tài khoản BBook và dữ liệu liên quan.\n\nEmail đăng ký hoặc mã tài khoản:\n\nCảm ơn.');
  const requestUrl = `mailto:${escape(content.email)}?subject=${subject}&amp;body=${emailBody}`;
  const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(document.title)} | B-Book</title><meta name="description" content="${escape(document.title)}. Liên hệ ${escape(content.email)}."><link rel="stylesheet" href="/legal.css"></head>
<body${key === 'deletion' ? ' class="deletion-page"' : ''}><a class="skip-link" href="#content">Đến nội dung</a><header><a class="brand" href="/">BBook</a><nav aria-label="Thông tin hỗ trợ"><a href="/privacy/">Quyền riêng tư</a><a href="/delete-account/">Xóa tài khoản</a></nav></header>
<main id="content"><p class="eyebrow">B-BOOK · THÔNG TIN NGƯỜI DÙNG</p><h1>${escape(document.title)}</h1><p class="meta">Bản sửa đổi ${escape(content.revision)} · Dành cho người từ đủ 18 tuổi</p>
${key === 'deletion' ? `${document.intro ? `<p class="intro">${escape(document.intro)}</p>\n` : ''}<p class="request-action"><a href="${requestUrl}">Soạn email yêu cầu xóa tài khoản</a></p><p class="request-email">Email hỗ trợ: <a href="${requestUrl}">${escape(content.email)}</a></p>` : ''}
${body}
${key === 'deletion' ? '<p class="policy-link"><a href="/privacy/">Đọc Chính sách quyền riêng tư BBook</a></p>' : `<aside><h2>Liên hệ B-Book</h2><p><a href="mailto:${escape(content.email)}">${escape(content.email)}</a></p><p>Bấm liên kết để mở ứng dụng email, hoặc sao chép địa chỉ để gửi thư. Trang này không tự gửi yêu cầu.</p></aside>`}</main>
<footer><a href="/">BBook</a><a href="/privacy/">Chính sách quyền riêng tư</a><a href="/delete-account/">Yêu cầu xóa tài khoản</a></footer></body></html>\n`;
  await writeFile(path.join(root, file), html);
  const directory = path.join(root, file.replace(/\.html$/, ''));
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), html);
}
const privacyText = [content.privacy.title.toUpperCase(), `Bản sửa đổi: ${content.revision} · Dành cho người từ đủ 18 tuổi`, ...content.privacy.sections.flatMap(s => [`## ${s.title}`, ...s.paragraphs, ...(s.subsections || []).flatMap(sub => [`### ${sub.title}`, ...sub.paragraphs])])].join('\n\n') + '\n';
await writeFile(path.join(root, 'legal/privacy.txt'), privacyText);
const appDocs = path.resolve(root, '../bbeauty-app/docs');
let appAvailable = true;
try { await access(path.join(appDocs, 'terms.txt')); }
catch (error) { if (error.code !== 'ENOENT') throw error; appAvailable = false; }
if (appAvailable) {
  const terms = (await readFile(path.join(appDocs, 'terms.txt'), 'utf8')).trim();
  await writeFile(path.join(appDocs, 'chinhsach.txt'), `${terms}\n\n${privacyText}`);
}
console.log(`Generated web legal pages${appAvailable ? ' and synchronized app policy' : ''}.`);
