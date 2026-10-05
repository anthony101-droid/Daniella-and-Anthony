# Optional integrations

## PostHog trial

Create a free PostHog project and select its region. In project settings copy the public project token. Do not use a personal API key.

Set Cloudflare Workers Build variables:

- NEXT_PUBLIC_POSTHOG_KEY: public project token
- NEXT_PUBLIC_POSTHOG_HOST: https://eu.i.posthog.com or https://us.i.posthog.com, matching the project region
- NEXT_PUBLIC_USAGE_ANALYTICS_ENABLED: true

Rebuild the site. These are build-time variables because the application is a static export. Adding a Worker runtime secret alone will not activate analytics.

In PostHog Live events, check workspace_opened, workspace_page_opened, scan_requested, email_review_requested, email_reported, admin_review_completed, training_submitted and support_request_submitted. These record successful requests, not proof of a completed mailbox scan or a passing quiz. Company security reports stay in the existing backend.

Only allowlisted event names and page names are sent. No email addresses, user IDs, company names, message bodies, subjects, attachment names, credentials, URLs, or form values. No autocapture, session recordings, cookies or persistent browser identifiers. Each loaded tab gets a random identifier, rotated on sign-out. Do Not Track disables capture. Disclose product analytics in the site's privacy policy before enabling. Third-party transport still exposes normal network metadata to the recipient.

To stop capture, set NEXT_PUBLIC_USAGE_ANALYTICS_ENABLED=false and rebuild. Analytics failures never block platform actions.

## Chatwoot next

Free Community Edition needs an available server and maintenance. It does not run as part of this static Cloudflare site. Once hosted, provide the HTTPS installation URL and website inbox token. Implement a user-opened support panel without automatically sending mailbox content or trusting client-supplied user identity. Keep existing support forms available.

## Automation next

Keep Google OAuth tokens in the existing mailbox backend. Confirm n8n licensing for external customer integrations before enabling workflows. Start with internal notification delivery and reminders. Mailbox arrival scans should use authenticated Gmail Pub/Sub notifications with scheduled recovery checks. Connecting a device to the internet while the site is closed is not a browser trigger.
