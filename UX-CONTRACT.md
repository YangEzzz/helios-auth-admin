# Helios interaction contract

## Canonical UI Map

| Capability     | Canonical owner                            | Source of truth | Allowed variants                  | Verification                  |
| -------------- | ------------------------------------------ | --------------- | --------------------------------- | ----------------------------- |
| Form           | `src/components/ui/input`, Textarea, Label | DESIGN.md       | login / application configuration | browser and build             |
| Toast          | vue-sonner and shared Toaster              | DESIGN.md       | success / error                   | browser                       |
| Scrollbar      | existing application stylesheet            | DESIGN.md       | natural document scroll           | narrow browser                |
| Select/Listbox | `src/components/ui/select`                 | DESIGN.md       | authored; trigger-width popper    | keyboard + narrow popup       |
| Search         | `src/components/search-input.vue`          | UX-CONTRACT.md  | local account / project filtering | clear + keyboard browser      |
| Navigation     | `src/layouts`, app-sidebar, BasicPage      | DESIGN.md       | desktop rail / mobile sheet       | browser + narrow viewport     |
| Summary        | `src/components/summary-metrics.vue`       | DESIGN.md       | loaded / loading / unavailable    | browser + build               |
| Auth layout    | `src/components/auth-shell.vue`            | DESIGN.md       | administrative login / register   | desktop + mobile              |
| Project tabs   | `src/components/ui/tabs`                   | UX-CONTRACT.md  | members / integration / metadata  | keyboard + draft preservation |
| Authentication | `src/utils/session.ts`, auth store         | `docs/sso.md`   | admin / application login         | SSO end-to-end validation     |
| Confirmation   | `src/components/ui/alert-dialog`           | DESIGN.md       | secret rotation                   | browser                       |

## Authentication

- Project login settings label the destination “SSO 登录回调地址” and explain that it is the business backend endpoint receiving an authorization code. SSOIntegrationGuide uses the canonical Dialog, with a scrollable body, persistent close/copy actions, and current project identity. The guide starts with the two backend endpoints to implement, then explains the purpose and source of four settings. Annotated code is collapsed by default; every temporary login variable has a plain-language definition and explicit API-field mapping. Copy includes these explanations, authorize/exchange fragments, local session ownership and cancellation; real project secrets are never passed into the guide.

- Helios owns a server-side, revocable login session in an HttpOnly Cookie. Session status is restored from the server on refresh.
- `/sso/login` is public for every account; project access is checked by the server before signing a code and during exchange.
- Login and continue disable duplicate submission and report failures inline. Existing sessions require an explicit Continue action and offer Switch account.
- Cancel returns a bound cancellation response to the registered callback; an invalid request does not redirect to an unverified destination.
- Administrator logout revokes the Helios session before clearing UI state. Business applications keep independent sessions.
- Application secrets are only stored in backend configuration; the admin UI shows a new secret masked and only until the page is left.
- Every popup message is advisory; the business backend owns the final authentication state.

## Administrative data and mutations

- Chinese is the production administrative UI language; shared pagination and dismissal labels follow it. Demo routes remain development-only.
- `use-latest-query` owns list request order and retryable errors. `use-project-resources` owns project reads; `use-request-scope` binds asynchronous work to the current route and component lifetime.
- `confirm-dialog` retains context while busy or after failure; its business caller closes it after success. `use-discard-confirmation` owns unsaved project setting dismissal.
- `lib/accounts` owns administrative role labels and allowed account status affordances. Every mutation rechecks capability and busy state before sending.
- `generateVueTable` owns table state, pagination callbacks and stable row identity. Narrow screens scroll inside the table container.
- `query-error` owns recoverable load failures; failed initial loads are not labeled empty. SSO configuration cannot be edited before its directory is successfully read.
- Browser regression fixture lives in `tests/regression.html`; it intercepts business requests and does not access real account data.

## Workspace presentation

- SidebarProvider owns persisted desktop width (220–360px, default 264px); SidebarRail owns the accessible resize separator. Pointer capture ends on release, cancellation, collapse, mobile transition or disposal. Keyboard arrows and Home/End adjust width; Enter/double-click restore default. Width never overrides collapsed/mobile sizes.

- BasicPage / BasicHeader own page heading hierarchy; SidebarInset owns the sole main landmark. The layout owns localized page titles, a skip link, a mobile-only drawer trigger and natural document scrolling; navigation and appearance controls live in the sidebar.
- Desktop navigation retains collapse preference; mobile selection closes the canonical Sheet. Project detail keeps Project management selected.
- Local account/project filters use SearchInput with immediate clear and input focus restoration. These filters remain transient and in-memory under the existing architecture; they do not initiate remote search.
- Dashboard reads use use-latest-query, preserve loaded content during refresh and expose QueryError with retry. Initial loading uses a stable spinner region.
- Administrative login uses a semantic form, IME-safe submission, inline validation, password visibility and duplicate prevention. Failed login preserves values; credentials are never persisted.

## Redesigned workspace composition

- AuthShell owns the administrative login/register split layout; shared SSO remains focused on authentication and destination consent.
- SummaryMetrics displays only loaded API-backed counts; initial loading has an honest placeholder.
- Project detail uses canonical Tabs for members/roles, application integration, and metadata. Each panel retains natural document height; configuration requests/secrets remain scoped to the selected project.
- Permission dialogs and all API mutations retain their established capability checks, pending/error/retry and unsaved-change guards. New presentation does not broaden account access.
- The design migration updates the former default zinc theme once; subsequent explicit user theme selection is preserved.

- Application integration panels remain mounted when hidden so changing tabs preserves unsaved fields, in-flight requests and once-only secret display; project change or route disposal still invalidates them.
- Each project exposes one sign-in configuration through `/api/v1/sso/projects/:project_id`. Project name/identifier come from the project; only callback URLs and enablement are editable. Saving atomically updates the project configuration and legacy credential aliases, preserving their hashes. The project identifier becomes the canonical login client ID; its new secret is returned once when first created. Rotation explicitly invalidates every credential for the project. Existing login credentials remain usable until rotation. No application list or creation flow is exposed.

- The workspace has no global top header. AppSidebar owns appearance and desktop collapse controls in its footer; layouts/index.vue owns a mobile-only navigation trigger, the content skip link, and localized document titles.
