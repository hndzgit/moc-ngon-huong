/**
 * api/_lib/authEmailTemplates.ts
 * Premium, Brand-Consistent Authentication Email Templates for Mộc Ngôn Hương
 * 
 * Visual Identity:
 * - Forest green: #3E5641
 * - Warm ivory: #FAF8F3
 * - Muted gold: #C89F5D
 * - Typography: Vietnamese editorial typography with high email-client compatibility
 * - Logo: https://mocngonhuong.com/assets/figma/logo-header.png
 */

export interface EmailTemplateResult {
  subject: string;
  html: string;
  text: string;
}

/**
 * Builds the HTML for the Email Verification message.
 */
export function renderVerificationEmail(params: {
  customerName?: string;
  verificationLink: string;
}): EmailTemplateResult {
  const name = params.customerName?.trim() || 'bạn';
  const actionUrl = params.verificationLink;

  const subject = 'Xác minh tài khoản Mộc Ngôn Hương';

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="vi">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${subject}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; min-width: 100%; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #1A1E1B !important; }
      .card-bg { background-color: #242A25 !important; border-color: #353F36 !important; }
      .text-title { color: #E8EFE9 !important; }
      .text-body { color: #C5D1C6 !important; }
      .text-muted { color: #9AABA0 !important; }
      .fallback-box { background-color: #1E241F !important; border-color: #353F36 !important; }
      .fallback-link { color: #C89F5D !important; }
    }
  </style>
</head>
<body class="email-bg" style="margin: 0; padding: 0; background-color: #FAF8F3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-bg" style="background-color: #FAF8F3; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 16px 50px 16px;">
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="card-bg" style="max-width: 600px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid #ECE7DF; box-shadow: 0 4px 20px rgba(62,86,65,0.06); overflow: hidden;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td align="center" style="padding: 44px 36px 20px 36px;">
              <a href="https://mocngonhuong.com" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="https://mocngonhuong.com/assets/figma/logo-header.png" width="80" height="72" alt="Mộc Ngôn Hương" style="display: block; margin: 0 auto; width: 80px; height: 72px; object-fit: contain;" />
              </a>
              <p style="margin: 14px 0 0 0; font-family: 'Times New Roman', Georgia, serif; font-size: 11px; letter-spacing: 3px; color: #C89F5D; text-transform: uppercase; font-weight: 700; text-align: center;">
                MỘC NGÔN HƯƠNG
              </p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #8C7B6B; font-style: italic; text-align: center; font-family: 'Times New Roman', Georgia, serif;">
                Vị Trà Đong Đầy Yêu Thương
              </p>

              <!-- Muted Gold Ornament Line -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="60" align="center" style="margin: 18px auto 0 auto;">
                <tr>
                  <td style="height: 1px; background-color: #C89F5D; line-height: 1px; font-size: 1px;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CONTENT BODY -->
          <tr>
            <td style="padding: 10px 40px 36px 40px;">
              <h1 class="text-title" style="margin: 0 0 20px 0; font-family: 'Times New Roman', Georgia, serif; font-size: 24px; line-height: 34px; color: #3E5641; font-weight: 700; text-align: center;">
                Chào mừng bạn đến với Mộc Ngôn Hương!
              </h1>

              <p class="text-body" style="margin: 0 0 16px 0; font-size: 15px; line-height: 26px; color: #2C352D;">
                Chào <strong>${name}</strong>,
              </p>

              <p class="text-body" style="margin: 0 0 16px 0; font-size: 15px; line-height: 26px; color: #4A554D;">
                Cảm ơn bạn đã lựa chọn đồng hành cùng Mộc Ngôn Hương trong hành trình trao gửi những điều ý nghĩa.
              </p>

              <p class="text-body" style="margin: 0 0 28px 0; font-size: 15px; line-height: 26px; color: #4A554D;">
                Chỉ còn một bước nhỏ để hoàn tất tài khoản của bạn. Vui lòng xác minh địa chỉ email bằng nút bên dưới:
              </p>

              <!-- PRIMARY CTA BUTTON -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 32px 0;">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${actionUrl}" style="height:50px;v-text-anchor:middle;width:260px;" arcsize="50%" stroke="f" fillcolor="#3E5641">
                      <w:anchorlock/>
                      <center style="color:#FAF8F3;font-family:sans-serif;font-size:15px;font-weight:bold;">Xác minh địa chỉ email</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${actionUrl}" target="_blank" style="display: inline-block; background-color: #3E5641; color: #FAF8F3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; text-decoration: none; padding: 15px 36px; border-radius: 28px; box-shadow: 0 4px 14px rgba(62,86,65,0.25); text-align: center; letter-spacing: 0.3px;">
                      Xác minh địa chỉ email
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <!-- SAFE PLAIN-TEXT FALLBACK BOX -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="fallback-box" style="background-color: #FAF8F3; border-radius: 12px; border: 1px solid #ECE7DF; margin: 10px 0 24px 0;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <p class="text-muted" style="margin: 0 0 6px 0; font-size: 12px; line-height: 18px; color: #73695F;">
                      Nếu nút bấm ở trên không hoạt động, bạn có thể sao chép liên kết bảo mật dưới đây và dán vào trình duyệt:
                    </p>
                    <p style="margin: 0; font-size: 11px; line-height: 16px; word-break: break-all; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;">
                      <a href="${actionUrl}" target="_blank" class="fallback-link" style="color: #3E5641; text-decoration: underline;">
                        ${actionUrl}
                      </a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- FOOTER & BRAND SIGN-OFF -->
              <div style="border-top: 1px solid #ECE7DF; padding-top: 24px; margin-top: 24px; text-align: center;">
                <p class="text-muted" style="margin: 0 0 10px 0; font-size: 13px; line-height: 20px; color: #73695F;">
                  Nếu bạn không đăng ký tài khoản tại Mộc Ngôn Hương, bạn có thể yên tâm bỏ qua email này.
                </p>
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #8C7B6B;">
                  <a href="https://mocngonhuong.com" target="_blank" style="color: #C89F5D; text-decoration: none; font-weight: 600;">mocngonhuong.com</a>
                  &nbsp;•&nbsp;
                  <a href="https://mocngonhuong.com/#/lien-he" target="_blank" class="text-muted" style="color: #8C7B6B; text-decoration: none;">Không gian tiệm trà</a>
                </p>
                <p class="text-muted" style="margin: 0; font-size: 11px; line-height: 16px; color: #A69B8D;">
                  42 Phố Hàng Điếu, Phường Cửa Đông, Quận Hoàn Kiếm, Hà Nội<br/>
                  © 2026 Mộc Ngôn Hương. Tất cả quyền được bảo lưu.
                </p>
              </div>

            </td>
          </tr>
        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Chào mừng bạn đến với Mộc Ngôn Hương!

Chào ${name},

Cảm ơn bạn đã lựa chọn đồng hành cùng Mộc Ngôn Hương trong hành trình trao gửi những điều ý nghĩa.
Chỉ còn một bước nhỏ để hoàn tất tài khoản của bạn. Vui lòng xác minh địa chỉ email bằng liên kết bên dưới:

${actionUrl}

Nếu bạn không đăng ký tài khoản, bạn có thể bỏ qua email này.

---
Mộc Ngôn Hương — Vị Trà Đong Đầy Yêu Thương
Website: https://mocngonhuong.com
Địa chỉ: 42 Phố Hàng Điếu, Hoàn Kiếm, Hà Nội`;

  return { subject, html, text };
}

/**
 * Builds the HTML for the Password Reset message.
 */
export function renderPasswordResetEmail(params: {
  customerName?: string;
  resetLink: string;
}): EmailTemplateResult {
  const name = params.customerName?.trim() || 'bạn';
  const actionUrl = params.resetLink;

  const subject = 'Khôi phục mật khẩu Mộc Ngôn Hương';

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="vi">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${subject}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; min-width: 100%; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #1A1E1B !important; }
      .card-bg { background-color: #242A25 !important; border-color: #353F36 !important; }
      .text-title { color: #E8EFE9 !important; }
      .text-body { color: #C5D1C6 !important; }
      .text-muted { color: #9AABA0 !important; }
      .fallback-box { background-color: #1E241F !important; border-color: #353F36 !important; }
      .fallback-link { color: #C89F5D !important; }
    }
  </style>
</head>
<body class="email-bg" style="margin: 0; padding: 0; background-color: #FAF8F3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-bg" style="background-color: #FAF8F3; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 16px 50px 16px;">
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="card-bg" style="max-width: 600px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid #ECE7DF; box-shadow: 0 4px 20px rgba(62,86,65,0.06); overflow: hidden;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td align="center" style="padding: 44px 36px 20px 36px;">
              <a href="https://mocngonhuong.com" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="https://mocngonhuong.com/assets/figma/logo-header.png" width="80" height="72" alt="Mộc Ngôn Hương" style="display: block; margin: 0 auto; width: 80px; height: 72px; object-fit: contain;" />
              </a>
              <p style="margin: 14px 0 0 0; font-family: 'Times New Roman', Georgia, serif; font-size: 11px; letter-spacing: 3px; color: #C89F5D; text-transform: uppercase; font-weight: 700; text-align: center;">
                MỘC NGÔN HƯƠNG
              </p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #8C7B6B; font-style: italic; text-align: center; font-family: 'Times New Roman', Georgia, serif;">
                Vị Trà Đong Đầy Yêu Thương
              </p>

              <!-- Muted Gold Ornament Line -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="60" align="center" style="margin: 18px auto 0 auto;">
                <tr>
                  <td style="height: 1px; background-color: #C89F5D; line-height: 1px; font-size: 1px;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CONTENT BODY -->
          <tr>
            <td style="padding: 10px 40px 36px 40px;">
              <h1 class="text-title" style="margin: 0 0 20px 0; font-family: 'Times New Roman', Georgia, serif; font-size: 24px; line-height: 34px; color: #3E5641; font-weight: 700; text-align: center;">
                Đặt lại mật khẩu tài khoản của bạn
              </h1>

              <p class="text-body" style="margin: 0 0 16px 0; font-size: 15px; line-height: 26px; color: #2C352D;">
                Chào <strong>${name}</strong>,
              </p>

              <p class="text-body" style="margin: 0 0 16px 0; font-size: 15px; line-height: 26px; color: #4A554D;">
                Chúng mình đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản Mộc Ngôn Hương của bạn.
              </p>

              <p class="text-body" style="margin: 0 0 28px 0; font-size: 15px; line-height: 26px; color: #4A554D;">
                Nhấn vào nút bên dưới để tiếp tục tạo mật khẩu mới an toàn:
              </p>

              <!-- PRIMARY CTA BUTTON -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 32px 0;">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${actionUrl}" style="height:50px;v-text-anchor:middle;width:220px;" arcsize="50%" stroke="f" fillcolor="#3E5641">
                      <w:anchorlock/>
                      <center style="color:#FAF8F3;font-family:sans-serif;font-size:15px;font-weight:bold;">Đặt lại mật khẩu</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${actionUrl}" target="_blank" style="display: inline-block; background-color: #3E5641; color: #FAF8F3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; text-decoration: none; padding: 15px 38px; border-radius: 28px; box-shadow: 0 4px 14px rgba(62,86,65,0.25); text-align: center; letter-spacing: 0.3px;">
                      Đặt lại mật khẩu
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <!-- SAFE PLAIN-TEXT FALLBACK BOX -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="fallback-box" style="background-color: #FAF8F3; border-radius: 12px; border: 1px solid #ECE7DF; margin: 10px 0 24px 0;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <p class="text-muted" style="margin: 0 0 6px 0; font-size: 12px; line-height: 18px; color: #73695F;">
                      Nếu nút bấm ở trên không hoạt động, bạn có thể sao chép liên kết bảo mật dưới đây và dán vào trình duyệt:
                    </p>
                    <p style="margin: 0; font-size: 11px; line-height: 16px; word-break: break-all; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;">
                      <a href="${actionUrl}" target="_blank" class="fallback-link" style="color: #3E5641; text-decoration: underline;">
                        ${actionUrl}
                      </a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- FOOTER & BRAND SIGN-OFF -->
              <div style="border-top: 1px solid #ECE7DF; padding-top: 24px; margin-top: 24px; text-align: center;">
                <p class="text-muted" style="margin: 0 0 10px 0; font-size: 13px; line-height: 20px; color: #73695F;">
                  Nếu bạn không yêu cầu thay đổi mật khẩu, bạn có thể yên tâm bỏ qua email này. Tài khoản của bạn vẫn được bảo vệ an toàn.
                </p>
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #8C7B6B;">
                  <a href="https://mocngonhuong.com" target="_blank" style="color: #C89F5D; text-decoration: none; font-weight: 600;">mocngonhuong.com</a>
                  &nbsp;•&nbsp;
                  <a href="https://mocngonhuong.com/#/lien-he" target="_blank" class="text-muted" style="color: #8C7B6B; text-decoration: none;">Không gian tiệm trà</a>
                </p>
                <p class="text-muted" style="margin: 0; font-size: 11px; line-height: 16px; color: #A69B8D;">
                  42 Phố Hàng Điếu, Phường Cửa Đông, Quận Hoàn Kiếm, Hà Nội<br/>
                  © 2026 Mộc Ngôn Hương. Tất cả quyền được bảo lưu.
                </p>
              </div>

            </td>
          </tr>
        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Đặt lại mật khẩu tài khoản của bạn

Chào ${name},

Chúng mình đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản Mộc Ngôn Hương của bạn.
Nhấn vào liên kết bên dưới để tiếp tục:

${actionUrl}

Nếu bạn không yêu cầu thay đổi mật khẩu, bạn có thể bỏ qua email này.

---
Mộc Ngôn Hương — Vị Trà Đong Đầy Yêu Thương
Website: https://mocngonhuong.com
Địa chỉ: 42 Phố Hàng Điếu, Hoàn Kiếm, Hà Nội`;

  return { subject, html, text };
}
