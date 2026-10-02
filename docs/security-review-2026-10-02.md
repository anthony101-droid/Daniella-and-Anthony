# PhishAware security review, 2 October 2026

## Completed verification

- Dependency audit before fixes: 53 reported advisories, including one critical Next.js advisory. Upgraded Next.js to 16.3.6 and patched affected dependency resolutions. Removed unused starter development/database tooling. The final `pnpm audit` reported zero known vulnerabilities across 695 resolved dependencies.
- Production static build, TypeScript checks, new mailbox component lint, and Cloudflare deployment dry run pass.
- Access, tenant separation, OAuth, encryption, bounded input, and content-rule tests pass. Tests use mocked service boundaries and do not substitute for a live Google OAuth/email test.
- Supabase security advisors report no exposed-table or function permission findings. All seven PhishAware tables have RLS enabled and deny direct anonymous/authenticated reads and writes. Only server code uses service-role access.
- User JWTs are validated against Supabase Auth. Authorization uses server-owned records, not user-editable metadata.
- Company selection is checked on the server. Company administrators and employees cannot select another company's workspace. Only the two platform-owner records manage onboarding. Accounts belong to one company in this release.
- Invitation writes have an atomic company check so concurrent invitations cannot overwrite another company's membership. Employee results are projected to their assigned records only. Updates use revision checks.
- Server rate limiting, bounded request bodies, encrypted OAuth state and tokens, PKCE, expiry and replay checks, a same-address Google profile check, and owner-only findings are implemented.
- No raw email HTML is rendered. Sender and subject appear as React text. Links are analyzed as strings and are never fetched, preventing email-driven server request forgery. Attachments are not downloaded or executed.
- Response cache controls, clickjacking protection, HSTS, a Content Security Policy, referrer suppression, and restricted browser permissions are included in Cloudflare static asset headers. Header deployment must be verified after Cloudflare publishes this commit. Inline scripts/styles remain allowed for the static Next.js export, so this is not a nonce-based CSP.
- The deployed mailbox endpoint was called without authorization and returned HTTP 401 `Sign in required`.

## Remaining limits and activation work

- Supabase reports leaked-password protection disabled. This feature requires Supabase Pro or above. No paid upgrade was made. The password setup form requires 12 characters, but the server-side Supabase password policy still needs review. This form is not a replacement for a server-enforced policy.
- Google OAuth client credentials, encrypted key material, and a background schedule have not been configured. The connection UI stays unavailable until those secrets are present.
- Google restricted-scope verification/security assessment and published privacy/retention information are required before appropriate public production use.
- Real OAuth consent, token refresh, Gmail message processing, disconnect/revocation, and scheduled scanning have not yet been tested against a mailbox. Gmail API and SMTP integration are separate.
- Content rules do not certify safety, verify sender authentication, scan malware, or inspect destination reputation. The initial system polls after delivery. It does not block emails or provide instant inline warnings in Gmail.
- Audit log entries inside aggregate workspace JSON are administrator-editable and are not a tamper-resistant forensic log. A dedicated append-only audit store, administrator MFA, independent penetration testing, backup/recovery testing, and operational monitoring are recommended before production company onboarding.

This review records the tests performed and known limits. It is not a security certification or a claim of exhaustive penetration testing.
