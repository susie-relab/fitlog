# Contact / request-access emails — one-time setup

The feedback form (Profile → Support) and the "Request a login" form on
the login page both POST to `/api/contact`, which emails you. The
destination address lives only in a server env var, so users never see it.

## 1. Create a Resend account (free)

1. Sign up at https://resend.com (free tier: 3,000 emails/month).
2. **API Keys** → create one → copy it (starts with `re_…`).
3. You can send immediately using the built-in `onboarding@resend.dev`
   sender — no domain verification needed to email your own inbox.
   (Later, verify a domain if you want a custom "from" address.)

## 2. Add env vars in Vercel

Vercel → your project → **Settings → Environment Variables**, add:

| Name | Value |
|------|-------|
| `RESEND_API_KEY` | your `re_…` key |
| `CONTACT_EMAIL`  | susie22mac@gmail.com |
| `RESEND_FROM`    | `SportLog <onboarding@resend.dev>` *(optional; this is the default)* |

Redeploy. That's it — submissions now arrive in your inbox, with the
sender's email set as reply-to so you can reply directly.

Until these are set, the forms show a friendly "email not configured yet"
error instead of sending.
