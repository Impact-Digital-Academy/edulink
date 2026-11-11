# Authentication design

Status: draft for approval. Decided 4 November 2026. Requirement: F-01 (Developer Document).

## Decisions

| Decision | Choice | Reason |
| --- | --- | --- |
| Sign-in method | Email and a one-time 6-digit code | No passwords to leak or reset. SMS delivery on Nigerian networks is a known risk (R-06), so SMS comes later as an addition |
| Account model | One login per person; teacher and school profiles attach to it later | A person can be both a teacher and a school owner |
| Sign-up vs sign-in | The same step. New addresses create an account after accepting the terms | Fewer screens, no separate "register" flow |
| Email provider | Behind an interface. Brevo is the first implementation; a console sender is used in development | Switching provider later is one new class |

## How it works

1. `POST /v1/auth/request-code` with an email. The server stores a keyed hash of a random 6-digit code
   (valid 10 minutes) and emails the code. The answer is the same whether or not the address has an account.
2. `POST /v1/auth/verify-code` with email, code, and (first time only) `acceptTerms: true`.
   Success returns a 15-minute access token and a 60-day refresh token.
3. `POST /v1/auth/refresh` swaps the refresh token for a new pair. Each refresh token works once.
4. `POST /v1/auth/logout` closes the current session. `GET /v1/me` returns the signed-in person.

## Protections

- Codes: random from the OS, stored only as an HMAC bound to the email, compared in constant time,
  single use, burned after 5 wrong guesses, expire after 10 minutes.
- Sending limits per address: 60 seconds between codes, at most 3 per 15 minutes.
- Refresh tokens: random 256-bit, stored only as a hash, rotated on every use. Presenting an
  already-used token closes the whole session (theft signal).
- Every protected request checks the session row, so logging out or suspending someone takes effect immediately.
- Access tokens are signed HS256 with issuer, audience and expiry checked. Secrets must be 32+ characters and different from each other.
- Terms and privacy acceptance is stored with a version and a time (consent evidence).
- Error messages and logs never contain codes (except the development-only console sender), secrets or tokens.

## Known limits and follow-ups

- No per-IP rate limiting yet (planned in the security phase).
- If a phone loses the response to a refresh and retries with the old token, the session closes and the person signs in again with a new code. Accepted trade-off.
- Terms and privacy text are not written yet; the stored version is `draft-1`. Legal review (D-06) is required before beta.
- Account deletion and data export (F-13) are not built yet.
- Admin and staff accounts will use a separate mechanism.
