# Administrator email alerts

Employee reports, automatic High risk alerts, and support requests create deduplicated delivery jobs. Company administrators and platform owners receive company alerts. Requests addressed to platform owners are emailed only to platform owners. Email contains a brief notice and the sign-in link; mailbox bodies, attachments, and complaint text are excluded.

## Sender setup

In the PhishAware Supabase project, open Edge Functions → Secrets. Save `ALERT_SMTP_PASSWORD` with the Gmail App Password for `terkperkanthony101@gmail.com`. Enter the value directly in Supabase, without spaces. Keep passwords out of chat and source control. The Auth SMTP password is separate and is not available to Edge Functions.

For a different Gmail sender, also save `ALERT_SMTP_USER` with that account email and use its matching App Password. The service uses Gmail SMTP on port 465 with TLS. The existing mailbox worker retries queued jobs every minute, up to eight attempts. Alerts are saved in the platform even when email delivery is unavailable. Recipient access is checked again before each send.

Delivery is at least once: provider acknowledgement or database failures can cause a retry. The stable message ID helps identify duplicates. A sent status confirms SMTP acceptance, not arrival in the recipient inbox.

## Notification history

Mark as read moves employee risk notifications into searchable History. It does not delete them or resolve a company incident. Medium and High risk notification summaries survive the 30-day findings cleanup. Disconnecting Google deletes the employee mailbox history along with findings and shared alerts.
