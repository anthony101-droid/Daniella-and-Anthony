# Google email protection setup

Implemented code is deployed to Supabase, but mailbox connections stay unavailable until the Google application and encrypted server secrets are configured. SMTP only sends account invitations. It does not grant access to employee inboxes.

## Connection and privacy

- Each verified, invited user connects the same Google address as their PhishAware account.
- Permission is `https://www.googleapis.com/auth/gmail.readonly` only. Drive, Calendar, contacts, send, delete, and administrative Workspace access are not requested.
- OAuth uses authorization code flow with PKCE, a hashed single-use state, a 10-minute expiry, and verified account and company bindings.
- Refresh tokens are encrypted using AES-256-GCM with user and company as authenticated context. Tokens never reach the frontend, source control, or application logs.
- Message bodies are processed transiently. Attachments are not downloaded. Sender, subject, timestamp, risk indicators, recommendations, and employee review decisions are saved for the mailbox owner.
- Company administrators receive a summary for every High risk finding and every email an employee explicitly reports. The summary includes the employee email, sender, subject, risk, reasons, and suggested action. All other mailbox findings remain private to their owner. No message bodies, attachments, or mailbox credentials are shared.
- Disconnect revokes the Google token and removes stored findings, shared alerts, and local credentials. Google revocation failures do not retain local tokens. Users can also revoke access from their Google Account permissions.
- Findings are removed after 30 days by the background maintenance job. Until the schedule is enabled, automatic retention cleanup is not running.

## Google Cloud configuration

1. Create a Google Cloud project for PhishAware and enable the Gmail API.
2. Configure Google Auth Platform branding, audience, and data access. Provide an accurate privacy policy describing processing and retention.
3. For a university demo, use External Testing and explicitly add authorized test users. Testing refresh tokens for restricted Gmail access expire after seven days, so users may need to reconnect.
4. Create a Web application OAuth client.
5. Set the exact authorized redirect URI to `https://daniella-and-anthony.terkperkanthony101.workers.dev/`.
6. Request only `https://www.googleapis.com/auth/gmail.readonly`.
7. Save `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` directly in Supabase Edge Function Secrets. Do not put them in GitHub or send them in chat.
8. Generate a random 32-byte encryption key and store its base64 representation in `MAILBOX_ENCRYPTION_KEY`. Keep a secure backup. Rotating this key without migrating ciphertext invalidates current connections.
9. Generate a separate random high-entropy worker credential and store it in `MAILBOX_WORKER_SECRET` and, for the scheduler, Supabase Vault as `phishaware_mailbox_worker_secret`.

Public distribution across companies requires Google's restricted-scope verification and applicable security assessment, plus the necessary verified domain/privacy-policy configuration. Do not market the unverified testing app as production approved.

## Background polling

The initial implementation polls Gmail rather than using Pub/Sub. It does not intercept an email before delivery or guarantee instant detection.

Enable `pg_cron` and `pg_net` in Supabase. After storing the worker secret in Vault, run the optional `docs/mailbox-schedule.sql`. Inspect Cron job runs and Edge Function responses before setting `MAILBOX_SCHEDULE_ENABLED=true` in Edge Function Secrets. This flag describes deployment configuration, not a heartbeat.

The worker processes one due mailbox per invocation, with a one-minute minimum interval and a bounded, resumable 50-message page. Initial connection checks the most recent 24 hours. Later scans use the previous cursor with a two-hour overlap. A lease prevents concurrent scans. Accounts with revoked invitations or inactive employees are denied. Scan failures are visible to the mailbox owner. Polling frequency decreases as the number of connected mailboxes grows. For larger companies or near-immediate delivery alerts, add authenticated Gmail Pub/Sub notifications, history synchronization, durable jobs, and daily watch renewal.

The worker endpoint has Supabase gateway JWT verification disabled because it accepts a dedicated worker secret. Every user action still validates the Supabase user token using `auth.getUser`. Every worker action requires the dedicated secret. There is no unauthenticated scan endpoint.

## Validate activation

1. Connect a designated test mailbox through Google consent.
2. Confirm another Google address is rejected and an expired/replayed callback is rejected.
3. Run Scan now and confirm findings correspond to that mailbox only.
4. Receive a test message containing a credential request and urgency, then confirm a subsequent scan produces a risk finding.
5. Confirm the scheduled worker runs successfully when the user is signed out.
6. Confirm Disconnect removes tokens and findings and stops later scans.
7. Confirm company administrators cannot load another company's workspace or an employee's findings.

The scanner is a transparent content-rule assessment. It does not verify sender authenticity or inspect attachment contents, visit links, or use a threat intelligence feed. Low risk is not proof of safety. Further analysis integrations should be tested before claiming malware detection or production email protection.

Official references:
- https://developers.google.com/identity/protocols/oauth2/web-server
- https://developers.google.com/workspace/gmail/api/auth/scopes
- https://developers.google.com/workspace/gmail/api/guides/push
- https://supabase.com/docs/guides/functions/schedule-functions

## Review workflow and interface

Overview begins with the signed-in person's welcome and awareness summary. Email protection is a dedicated navigation page directly after Overview and does not appear on Training, Simulation inbox, Notifications, or Settings. Opening it requests a mailbox check before showing results, reusing any scan completed within the last minute. Google authorization returns to this page. Settings lists name, email, company, and role, with a collapsed General options section to request a PhishAware password recovery email. Google connection and disconnect controls belong on Email protection. The sidebar footer contains the person's name and sign-out action.

The shared mailbox model refreshes results every 15 seconds while visible, and immediately on focus. This refreshes the dashboard without starting an extra Gmail scan. The worker continues to scan one due mailbox per minute.

Save as reviewed stores a review decision without declaring an email safe. Report suspicious requests confirmation before sharing a summary with company administrators. Administrators see automatic High risk findings and reports under Notifications and can mark an alert resolved. Repeated reports do not duplicate an alert. Only the owning employee can save a finding review, and only administrators of that company can resolve alerts.

Apply email-review-alerts.sql after the base company-mailbox-security.sql when bootstrapping a new project.
