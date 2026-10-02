# Interface and email review update

## Delivered

- The welcome heading is first on Overview. Email protection follows the awareness summary and appears only on Overview.
- Training, Simulation inbox, Notifications, and Settings open directly to their own content. Navigation resets scroll position.
- The top account email and role strip are removed. The sidebar footer displays the account name and Sign out beneath it.
- Technical connection labels are removed from the header and footer. The notification bell remains visible on mobile.
- Employee Settings includes profile information, password changes requiring current-password verification, and Google mailbox disconnect controls.
- Results refresh every 15 seconds while the tab is visible, and on returning to the tab. Only the scheduled worker performs automatic Gmail scans.
- Email checks have risk filters, compact recent results, saved reviews, and confirmed sharing of suspicious-email summaries.
- High risk findings create automatic company alerts. Employee reports create the same company alert. Administrators resolve alerts in Notifications. Duplicate reports keep one alert.

## Sharing boundaries

All normal findings remain owner-only. Administrators receive the reporting employee email, message subject, sender, risk reasons, and next action for High risk findings or explicit reports. They do not receive email bodies, attachment contents, OAuth credentials, or access to the employee mailbox. Alerts are company scoped, denied to employee accounts, deleted with their parent findings, and removed by the 30-day finding retention job.

## Validation

- TypeScript and production static export passed.
- 35 invitation, mailbox, and alert authorization tests passed.
- Transactional database checks passed for wrong-owner and wrong-company rejection, automatic High risk alerts, duplicate suppression, review decisions not resolving alerts, and cascading cleanup. Test rows were rolled back.
- RLS and grants checked: anonymous and authenticated clients cannot read the alert table or execute the review RPC directly.
- Browser screenshot verification was unavailable because browser downloads failed in the execution environment. The final deployed screens and employee-to-administrator report flow still require a signed-in UI check after Cloudflare deployment.
