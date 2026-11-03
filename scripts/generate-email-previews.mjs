import fs from 'fs';
import path from 'path';
import { renderVerificationEmail, renderPasswordResetEmail } from '../api/_lib/authEmailTemplates.js';

const verificationSample = renderVerificationEmail({
  customerName: 'Hoài Nam',
  verificationLink: 'https://moc-ngon-huong.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=sampleVerificationCode123456789&apiKey=AIzaSyDXeJnyXJzLh7pnEVt6i3PDnIko8aaOEVk&continueUrl=https%3A%2F%2Fmocngonhuong.com%2F%23%2Ftai-khoan',
});

const resetSample = renderPasswordResetEmail({
  customerName: 'Hoài Nam',
  resetLink: 'https://moc-ngon-huong.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=sampleResetCode987654321&apiKey=AIzaSyDXeJnyXJzLh7pnEVt6i3PDnIko8aaOEVk&continueUrl=https%3A%2F%2Fmocngonhuong.com%2F%23%2Ftai-khoan',
});

// Escape HTML for srcdoc iframe injection
const escapeHtml = (str) =>
  str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const previewHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Mộc Ngôn Hương — Email Visual Design Preview</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #111412;
      color: #E8EFE9;
      padding: 24px;
    }
    .header {
      max-width: 1200px;
      margin: 0 auto 24px auto;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border-b: 1px solid #283329;
      padding-bottom: 20px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 700;
      color: #C89F5D;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .subtitle {
      font-size: 14px;
      color: #8C998E;
      margin-top: 4px;
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }
    .btn {
      background: #1F2721;
      color: #CAD5CB;
      border: 1px solid #364438;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.15s ease;
    }
    .btn:hover {
      background: #2D3930;
      color: #FFF;
    }
    .btn.active {
      background: #3E5641;
      color: #FAF8F3;
      border-color: #C89F5D;
      font-weight: 600;
    }
    .grid {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr;
      gap: 32px;
    }
    .preview-section {
      background: #171C18;
      border: 1px solid #283329;
      border-radius: 16px;
      padding: 24px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #C89F5D;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-desc {
      font-size: 13px;
      color: #8C998E;
      margin-bottom: 16px;
    }
    .frames-row {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      justify-content: center;
      align-items: flex-start;
    }
    .device-card {
      background: #0E120F;
      border: 1px solid #2A362C;
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .device-header {
      background: #1F2721;
      padding: 8px 14px;
      font-size: 12px;
      font-weight: 600;
      color: #A3B2A6;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #2A362C;
    }
    .frame-desktop {
      width: 640px;
      max-width: 100%;
      height: 740px;
      border: none;
      background: #FAF8F3;
    }
    .frame-mobile {
      width: 375px;
      height: 740px;
      border: none;
      background: #FAF8F3;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-title">Mộc Ngôn Hương — Premium Authentication Emails</div>
      <div class="subtitle">Bản xem trước trực quan chuẩn Desktop (600px+) và Mobile (375px) — Tông màu Xanh rừng (#3E5641), Ngà ấm (#FAF8F3), Vàng kim (#C89F5D)</div>
    </div>
  </div>

  <div class="grid">
    <!-- TEMPLATE 1: EMAIL VERIFICATION -->
    <div class="preview-section">
      <div class="section-title">
        <span>✉ 1. Email Xác Minh Tài Khoản (Verification Email)</span>
      </div>
      <div class="section-desc">
        Tiêu đề: <strong>${verificationSample.subject}</strong> | Người gửi: <strong>Mộc Ngôn Hương &lt;taikhoan@mail.mocngonhuong.com&gt;</strong>
      </div>

      <div class="frames-row">
        <!-- Desktop -->
        <div class="device-card">
          <div class="device-header">
            <span>Màn hình Máy tính / Desktop (600px Max-Width)</span>
            <span>Gmail / Apple Mail / Outlook</span>
          </div>
          <iframe class="frame-desktop" srcdoc="${escapeHtml(verificationSample.html)}"></iframe>
        </div>

        <!-- Mobile -->
        <div class="device-card">
          <div class="device-header">
            <span>Màn hình Điện thoại / Mobile (375px)</span>
            <span>iPhone / Android Email</span>
          </div>
          <iframe class="frame-mobile" srcdoc="${escapeHtml(verificationSample.html)}"></iframe>
        </div>
      </div>
    </div>

    <!-- TEMPLATE 2: PASSWORD RESET -->
    <div class="preview-section">
      <div class="section-title">
        <span>🔐 2. Email Khôi Phục Mật Khẩu (Password Reset Email)</span>
      </div>
      <div class="section-desc">
        Tiêu đề: <strong>${resetSample.subject}</strong> | Người gửi: <strong>Mộc Ngôn Hương &lt;taikhoan@mail.mocngonhuong.com&gt;</strong>
      </div>

      <div class="frames-row">
        <!-- Desktop -->
        <div class="device-card">
          <div class="device-header">
            <span>Màn hình Máy tính / Desktop (600px Max-Width)</span>
            <span>Gmail / Apple Mail / Outlook</span>
          </div>
          <iframe class="frame-desktop" srcdoc="${escapeHtml(resetSample.html)}"></iframe>
        </div>

        <!-- Mobile -->
        <div class="device-card">
          <div class="device-header">
            <span>Màn hình Điện thoại / Mobile (375px)</span>
            <span>iPhone / Android Email</span>
          </div>
          <iframe class="frame-mobile" srcdoc="${escapeHtml(resetSample.html)}"></iframe>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

const outPath = path.resolve(process.cwd(), 'preview-emails.html');
fs.writeFileSync(outPath, previewHtml, 'utf-8');
console.log('✓ Successfully generated visual preview HTML at:', outPath);
