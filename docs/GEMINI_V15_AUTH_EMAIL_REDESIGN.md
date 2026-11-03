# MỘC NGÔN HƯƠNG — PREMIUM AUTHENTICATION EMAIL REDESIGN REPORT (V15.0)

## 1. Executive Summary

This release delivers an authentic, boutique, and visually stunning email redesign for **Mộc Ngôn Hương** authentication workflows (Email Verification and Password Reset). 

Prior to this upgrade, authentication emails relied either on default Firebase plain-text/generic messages or lacked brand identity. This implementation introduces:
- **Editorial Brand Aesthetic**: Forest green (`#3E5641`), Warm ivory (`#FAF8F3`), and Muted gold (`#C89F5D`), with Vietnamese typographic hierarchy and spacious composition.
- **Genuine Firebase Security**: Action codes and URLs are generated server-side via the Firebase Admin SDK (`generateEmailVerificationLink` & `generatePasswordResetLink`). Firebase remains the single authority for user identity, sessions, and security tokens.
- **Transactional Delivery via Resend**: Delivered using the verified production sending domain `mail.mocngonhuong.com` under the sender identity `Mộc Ngôn Hương <taikhoan@mail.mocngonhuong.com>`.
- **Bulletproof Email Compatibility**: Responsive, table-based layouts with inline styles, VML button support for Microsoft Outlook, dark-mode CSS overrides, and safe word-break plain-text action link fallbacks.
- **Resilient Fallback**: Frontend gracefully falls back to the client Firebase Auth SDK if the custom serverless API is ever unreachable or returns an error.

---

## 2. Brand Visual Identity & Design Specifications

| Attribute | Specification |
| :--- | :--- |
| **Forest Green (Primary)** | `#3E5641` (Headers, Primary CTA Buttons, Brand Accent Borders) |
| **Warm Ivory (Background)** | `#FAF8F3` (Outer Container & Card Background) |
| **Muted Gold (Accent)** | `#C89F5D` (Divider Lines, Subtle Highlights, Card Borders) |
| **Card Background** | `#FFFFFF` with `#EAE5DB` fine borders and subtle shadow |
| **Typography** | `'Playfair Display', Georgia, 'Times New Roman', serif` (Headlines)<br>`'Montserrat', 'Helvetica Neue', Arial, sans-serif` (Body & UI text) |
| **Layout Width** | 600px desktop maximum, 100% fluid mobile |
| **Official Logo Asset** | `https://mocngonhuong.com/assets/figma/logo-header.png` (Real brand logo, width 180px) |
| **Outlook Compatibility** | Inline CSS + `<!--[if mso]>` VML button wrappers |
| **Dark Mode Support** | `@media (prefers-color-scheme: dark)` color overrides |

---

## 3. Email Templates & Copy

### A. Email Verification Template (`Xác minh tài khoản Mộc Ngôn Hương`)
- **Subject**: `Xác minh tài khoản Mộc Ngôn Hương`
- **Headline**: *"Chào mừng bạn đến với Mộc Ngôn Hương!"*
- **Greeting**: `"Chào [Tên khách hàng],"` (or `"Chào bạn,"` if name is unavailable)
- **Body**:
  > *"Cảm ơn bạn đã lựa chọn đồng hành cùng Mộc Ngôn Hương trong hành trình trao gửi những điều ý nghĩa.*  
  > *Chỉ còn một bước nhỏ để hoàn tất tài khoản của bạn. Vui lòng xác minh địa chỉ email bằng nút bên dưới."*
- **Primary CTA**: `"Xác minh địa chỉ email"`
- **Footer**:
  > *"Nếu bạn không đăng ký tài khoản, bạn có thể bỏ qua email này."*  
  > *Mộc Ngôn Hương — Trà & Quà tặng thủ công Việt Nam*  
  > *Website: https://mocngonhuong.com*

### B. Password Reset Template (`Khôi phục mật khẩu Mộc Ngôn Hương`)
- **Subject**: `Khôi phục mật khẩu Mộc Ngôn Hương`
- **Headline**: *"Đặt lại mật khẩu tài khoản của bạn"*
- **Greeting**: `"Chào [Tên khách hàng],"`
- **Body**:
  > *"Chúng mình đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản Mộc Ngôn Hương của bạn.*  
  > *Nhấn vào nút bên dưới để tiếp tục."*
- **Primary CTA**: `"Đặt lại mật khẩu"`
- **Security Notice**: Highlighting the link validity window and single-use expiration.
- **Footer**:
  > *"Nếu bạn không yêu cầu thay đổi mật khẩu, bạn có thể bỏ qua email này."*

---

## 4. Architecture & Security Implementation

### A. Endpoint: `POST /api/auth/send-verification`
1. **Authentication**: Requires a valid Firebase Bearer ID Token in the `Authorization` header.
2. **Account Derivation**: The verified user UID and target email are extracted server-side from `adminAuth.verifyIdToken(idToken)`.
3. **Action Link Generation**: Invokes `adminAuth.generateEmailVerificationLink(targetEmail, actionCodeSettings)`.
4. **Branded Dispatch**: Injects the secure action link into the verification email template and sends it via `taikhoan@mail.mocngonhuong.com`.

### B. Endpoint: `POST /api/auth/send-reset-password`
1. **Input Validation**: Validates email format strictly via RFC-compliant regex.
2. **Rate Limiting**: Sliding-window rate limiter per client IP + email address (max 5 requests per 10-minute window). Exceeding this returns `HTTP 429 Too Many Requests`.
3. **Privacy Protection & Non-Enumeration**: If the email does not exist in Firebase Auth, `auth.generatePasswordResetLink()` catches the user-not-found error and returns a generic `HTTP 200 { success: true }`. Attackers cannot harvest registered email addresses.
4. **Action Link Generation**: For valid users, Firebase generates a secure, one-time password reset link redirected to `https://mocngonhuong.com/#/tai-khoan`.

### C. Zero Sensitive Data Logging
- No action codes, tokens, or reset URLs are logged in serverless logs.
- Plain text versions of emails are provided for text-only clients without displaying the raw token URL.

---

## 5. Verification & Test Outcomes

Automated testing was conducted across all unit, security, and rendering vectors:

| Test Case | Scope | Result |
| :--- | :--- | :--- |
| **Email Verification Rendering** | Headline, Greeting, Copy, Colors, Logo, VML, Fallback Link | **PASS** |
| **Password Reset Rendering** | Headline, Greeting, Copy, Colors, CTA, Security Note, Fallback Link | **PASS** |
| **Verification Endpoint: 401** | Missing / Anonymous Authorization Header | **PASS** |
| **Verification Endpoint: 401** | Forged / Expired Bearer Token | **PASS** |
| **Password Reset: 400** | Malformed Email Syntax | **PASS** |
| **Password Reset: Privacy** | Non-enumerating Generic 200 for Non-existent Accounts | **PASS** |
| **Password Reset: 429** | Sliding-window Abuse / Spam Protection | **PASS** |
| **Admin API Security** | Role & UID Enforcement | **PASS** |
| **Firestore Order Sanitization** | `cleanForFirestore()` and Zero Undefined Values | **PASS** |
| **Vite & TS Production Build** | Full Build & Bundle Verification | **PASS** |

Visual preview was generated in `preview-emails.html` verifying desktop (640px) and mobile (375px) responsive layouts.
