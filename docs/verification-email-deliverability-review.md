# Verification Email Deliverability Review

## Current app behavior
- Verification emails are sent through SendGrid via [`src/lib/email/mailer.ts`](/home/vicebas/Workspace/buymyhorse/buymyhorse/src/lib/email/mailer.ts).
- The sender is controlled by `SENDGRID_FROM_EMAIL` in [`src/lib/email/sendgrid.ts`](/home/vicebas/Workspace/buymyhorse/buymyhorse/src/lib/email/sendgrid.ts).
- Verification email copy is defined in [`src/lib/email/templates.ts`](/home/vicebas/Workspace/buymyhorse/buymyhorse/src/lib/email/templates.ts).

## Code changes in this scope
- Subject softened from `Verify your HorseRoster email address` to `Confirm your HorseRoster email`.
- Body copy now asks the user to confirm email to finish setup, which is less repetitive and less spam-like than repeating `verify email address`.

## Operational checklist
- Use a verified branded sender like `hello@yourdomain.com`, not a free mailbox domain.
- Configure a consistent from-name in SendGrid, for example `HorseRoster`.
- Complete SendGrid domain authentication before production sending.
- Publish SPF for the sending domain and ensure only your intended sender services are included.
- Publish DKIM through SendGrid and confirm both CNAME records validate.
- Publish a DMARC record at minimum with monitoring enabled, then tighten policy after observing traffic.
- Keep the verification link domain aligned with your production app domain.
- Avoid sending verification emails from multiple domains or aliases during rollout.
- Review bounce, block, and spam complaint events inside SendGrid after launch.

## Out of scope for app code alone
- Inbox placement is not guaranteed by template changes alone.
- Domain reputation, DNS auth, list hygiene, and sending volume ramp-up remain operational requirements.
