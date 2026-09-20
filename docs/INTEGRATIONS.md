# Taleem — integration checklist

Taleem already has the **interfaces**. Live vendor APIs are not wired. This document lists what still needs to be plugged in for production.

Suggested order: **email → WhatsApp → school fee gateways → platform billing → file storage → social OAuth**.

---

## 1. School fee payments (parents → school)

Used on Fees and `/pay/[id]`. Cash and bank are **manual** today. JazzCash and EasyPaisa only open a sandbox “Pay” button (`JazzCashGateway` / `EasyPaisaGateway` in `src/lib/services/payment-school-fee.ts`).

These credentials belong to **each school**, not to Taleem.

### JazzCash

- Merchant ID, password, integrity salt
- Return URL and IPN / callback URL
- Sandbox merchant, then live merchant
- Test MSISDN from JazzCash

### EasyPaisa

- Store ID and merchant credentials
- Callback / success / failure URLs
- Sandbox store, then live store

### Bank (optional later)

- School IBAN / account title to show on challans
- Optional: upload payment proof

---

## 2. Platform billing (school → Taleem)

Schools paying Taleem for Starter / Standard. Today this is **manual** (`ManualPlatformSubscriptionGateway` in `src/lib/services/payment-platform.ts`).

Need a **separate** JazzCash / EasyPaisa (or bank) merchant from school fees:

- Taleem merchant ID / store ID
- Invoice + webhook for monthly subscription
- Map paid IPN → `PlatformSubscriptionPayment`

Do **not** reuse a school’s JazzCash keys for SaaS billing.

---

## 3. WhatsApp (alerts, not social posting)

Used for absence alerts, fee reminders, and announcement broadcast. The code path exists; `getNotificationService()` still logs to the **console**. `WhatsAppCloudNotificationService` is a stub (`src/lib/services/notification.ts`).

Plan flag already exists: `whatsappAlerts`.

### Meta WhatsApp Cloud API

- Meta Business + WhatsApp Business Account
- App ID, App Secret, permanent token
- Phone Number ID and display number
- Webhook URL + verify token (delivery / replies)
- **Approved message templates** (Pakistan requires this for school-initiated messages), for example:
  - Absence alert
  - Fee reminder / overdue
  - Announcement
  - Password reset (optional)
- Per-school sender later, or one Taleem number that prefixes the school name

Also store a valid parent **WhatsApp number** on Guardian (country code `92…`).

Env placeholders: `WHATSAPP_TOKEN`

---

## 4. SMS

Announcement “broadcast” is gated by `smsBroadcast`. `TwilioSmsNotificationService` is a stub.

Pick one:

- **Twilio:** Account SID, Auth Token, from-number
- **Pakistan aggregator** (Jazz Message, eOcean, etc.): API key, sender ID, templates if required

Need parent / staff mobile numbers, and a decision: SMS fallback when WhatsApp fails.

Env placeholders: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`

---

## 5. Email

Password reset, receipts, and login alerts currently **do not send mail**. Reset shows the link on screen because the notification provider is console.

Need:

- SMTP or Resend / SES / SendGrid
- From domain with SPF + DKIM (for example `noreply@taleem.pk`)
- Templates:
  - Reset password
  - Fee receipt
  - Invoice reminder
  - Welcome after signup

---

## 6. Social media

Composer, images, copy, and “Mark published” already work. **Publish does not post anywhere** — it only sets status to `PUBLISHED` (`src/app/api/social-posts/[id]/publish/route.ts`).

Platforms in the composer: Facebook, Instagram, WhatsApp, YouTube, TikTok, X.

| Platform | What you need |
| --- | --- |
| Facebook | Meta app, Page ID, Page access token, `pages_manage_posts` |
| Instagram | Professional account linked to that Page, Graph API media publish |
| WhatsApp | Status / Channel is separate from Cloud API chat; Channel APIs or keep copy-paste |
| YouTube | Google Cloud project, OAuth, YouTube Data API, channel |
| TikTok | TikTok developer app, Content Posting API, login |
| X | X developer app, OAuth, tweet + media upload |

Each needs app review, a per-school connected account (OAuth), and media upload. Until that exists, staff copy the caption and post by hand.

---

## 7. File storage

Logos, certificates, and social images sit on **local disk** (`uploads/`). `.env` already has S3 placeholders.

Need when leaving this machine:

- Bucket, region, access key, secret, endpoint (AWS / R2 / MinIO)
- Public URL or signed URLs
- Path stays `tenants/{schoolId}/…`

Env placeholders: `UPLOAD_DIR`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_ENDPOINT`

---

## 8. Cron and hosting

Already in code: `/api/cron/invoices`, `/api/cron/platform-billing`, `CRON_SECRET`.

Need:

- Daily job (Vercel Cron, GitHub Action, or server cron)
- Production `PLATFORM_DOMAIN` + wildcard DNS (`*.yourdomain.com`) and SSL
- Live `NEXTAUTH_URL` / `NEXTAUTH_SECRET`

Env placeholders: `CRON_SECRET`, `PLATFORM_DOMAIN`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
