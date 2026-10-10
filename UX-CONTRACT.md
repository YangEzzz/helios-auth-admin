# Helios interaction contract

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Form | `src/components/ui/input`, Textarea, Label | DESIGN.md | login / application configuration | browser and build |
| Toast | vue-sonner and shared Toaster | DESIGN.md | success / error | browser |
| Scrollbar | existing application stylesheet | DESIGN.md | natural document scroll | narrow browser |
| Select/Listbox | `src/components/ui/select` | DESIGN.md | authored | existing project role controls |
| Authentication | `src/utils/session.ts`, auth store | `docs/sso.md` | admin / application login | SSO end-to-end validation |
| Confirmation | `src/components/ui/alert-dialog` | DESIGN.md | secret rotation | browser |

## Authentication

- Helios owns a server-side, revocable login session in an HttpOnly Cookie. Session status is restored from the server on refresh.
- `/sso/login` is public for every account; project access is checked by the server before signing a code and during exchange.
- Login and continue disable duplicate submission and report failures inline. Existing sessions require an explicit Continue action and offer Switch account.
- Cancel returns a bound cancellation response to the registered callback; an invalid request does not redirect to an unverified destination.
- Administrator logout revokes the Helios session before clearing UI state. Business applications keep independent sessions.
- Application secrets are only stored in backend configuration; the admin UI shows a new secret masked and only until the page is left.
- Every popup message is advisory; the business backend owns the final authentication state.
