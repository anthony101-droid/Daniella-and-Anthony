# PhishAware

Employee Phishing Awareness and Simulation Platform. The active implementation is a React application, prepared for Supabase as the future backend. The previous Django archive is superseded by this working-interface stage.

## Review the platform immediately

The self-contained `PhishAware.html` review copy was provided separately. Open that file in Chrome or Edge. This standalone working application includes its scripts and styling. It requires no dependency installation or server. It starts with clearly marked sample records. The administrator/employee selector changes preview roles. This selector is a demonstration feature, not authentication.

Data is saved in browser local storage for this local review stage. If your browser blocks file-based storage, the application shows a session-only message. Do not use real confidential employee records in this disconnected version. Supabase has not been connected and no external email is sent.

## Implemented flows

- Administrator overview calculated from workspace records.
- Add, edit, activate, deactivate, search and filter employees.
- Import employees through validated comma-separated rows, with duplicate-email checks.
- Four simulation templates with learning indicators.
- Create and edit drafts, select department targets and review dates.
- Explicit launch confirmation and delivery to active matching employees.
- Campaign detail panels, recipient results and campaign completion.
- Employee inbox, personalized training messages, link responses and reporting.
- Immediate educational feedback after simulation responses.
- Four lessons, three questions per lesson, server-independent scoring and best-score preservation.
- Employee and department reports, downloadable CSV with formula escaping.
- In-app training reminders, unread notifications and read actions.
- Recorded audit actions and CSV export.
- Organization name configuration and a clearly displayed connection checklist.
- Responsive navigation, accessible dialogs, radio groups, keyboard focus and mobile layouts.

## Review sequence

1. Add a sample employee or use an existing sample employee.
2. Create a simulation draft and launch to selected employees.
3. Use the top-right role selector to open an employee preview.
4. Open the assigned message, report phishing or follow the simulated link.
5. Complete a training quiz.
6. Return to the administrator preview. Review reports and audit records.
7. Export CSV reports. Send reminders and inspect the employee notifications.

## Development

Install Node.js 22.13 or later and pnpm. Run `pnpm install --frozen-lockfile`, then `pnpm dev`. Use `pnpm typecheck` and `pnpm build` to validate the application.
The application entry is `app/page.tsx`, the interface is `components/platform.tsx`, business records/actions are in `lib/platform.ts`, and styling is in `app/globals.css`. `standalone/main.tsx` preserves the separate local-review entry point. This repository uses standard Next.js development and build commands.

## Remaining connections and live-service work

In the user’s requested order: review this platform, attach the newly created GitHub repository, choose and configure hosting, and connect the correct Supabase project. The application source is attached to anthony101-droid/Daniella-and-Anthony. Supabase and hosting have not been connected.

Supabase Auth must replace the preview-role selector, with secure administrator and employee authorization enforced through database policies and trusted server operations. Supabase will own durable shared employee, campaign, delivery, completion, notification and audit records. Live code must not trust roles stored in browser state. Implement tenant isolation and restricted administrators as part of this integration.

External email delivery requires an approved mail provider, verified sending domain, controlled recipient scope, signed per-recipient tracking links, delivery events, and campaign scheduling. This offline version does not claim to provide external email delivery, real authentication, shared storage, automated scheduling, or tamper-resistant audit logs.

## Validation completed

TypeScript and the application build pass. Browser verification created and launched a campaign for eight sample employees, opened the employee inbox, reported the new message, passed a three-question quiz, and confirmed the changed training and reporting metrics in the administrator view. The standalone application rendered from its self-contained HTML. A CSV export downloaded and contained eight employee rows. Business-engine checks covered department targeting, duplicate-launch rejection, response ownership, result calculations and CSV formula escaping. WebMCP tools are feature-detected, but the testing browser did not support the registry, so that optional integration was not verified.
