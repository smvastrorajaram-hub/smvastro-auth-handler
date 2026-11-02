# SMV ASTRO Verification Handler

Dedicated static handler for Firebase user-management emails on:

- `https://verify.smvastroservices.in/auth/action.html`

The handler uses Production Firebase project `smv-astro` and intentionally keeps the app's existing Firebase Auth domain:

- `auth.smvastroservices.in`

Supported Firebase email actions: `verifyEmail`, `resetPassword`, and `recoverEmail`.

## Deployment

GitHub Actions deploys the `site/` directory to GitHub Pages after the handler tests pass.

GitHub Pages custom domain must be set to `verify.smvastroservices.in`. Its DNS CNAME must point directly to `smvastrorajaram-hub.github.io`.

Do not point this host at the main website's root domain, and do not change the main repository's `smvastroservices.in` custom domain.

## Firebase rollout

After the custom hostname is live over HTTPS, set Firebase Authentication > Templates > Email address verification > Customize action URL to:

`https://verify.smvastroservices.in/auth/action.html`

Firebase applies this custom action handler URL to all user-management email templates, so password reset and email-recovery are handled on this page too.
