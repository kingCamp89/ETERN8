# ETERN8 — Manual steps on Base44

Code changes in this repo **do not go live automatically**. After backend or schema work, you (or an agent reminding you) must deploy to Base44 and configure secrets/cron in the dashboard or CLI.

**App ID:** `6a2b2ffd9f4e986100520d9a` (from `base44/.app.jsonc`)  
**Working directory for CLI:** `ETERN8/` (the folder that contains `base44/`)

---

## One-time setup

- [ ] **Install Base44 CLI** (Node.js 20.19+ required)

  ```bash
  npm install -g base44@latest
  ```

  Or use without installing: `npx base44@latest <command>`

- [ ] **Log in and link this project**

  ```bash
  cd ETERN8
  base44 login
  base44 link
  ```

  If `link` is not set up yet, use `--app-id 6a2b2ffd9f4e986100520d9a` on commands, or set `BASE44_APP_ID=6a2b2ffd9f4e986100520d9a`.

Docs: [CLI overview](https://docs.base44.com/developers/references/cli/get-started/overview.md)

---

## Pending after recent remediation (Phase 1–2)

These match completed **code** work that still needs your action on Base44.

### Deploy backend + schema

- [ ] **Push entity RLS changes** (all entities — server-only `create: false` + owner-scoped create rules)

  ```bash
  cd ETERN8
  base44 entities push
  ```

- [ ] **Deploy backend functions** (includes `deleteAccount`, `sendFriendRequest`, `addExecutor`, `addTrustedContact`, `createMemoryInteraction`, locked cron/validation functions)

  ```bash
  cd ETERN8
  base44 functions deploy deleteAccount
  ```

  Or deploy all local functions at once:

  ```bash
  base44 functions deploy
  ```

  Verify:

  ```bash
  base44 functions list
  ```

  Confirm `deleteAccount`, `shareMemory`, `checkLegacyStatus`, and `scheduledDeliveryProcessor` appear.

- [ ] **Deploy frontend** (Settings delete button, `syncMemoryShares` changes, etc.)

  ```bash
  cd ETERN8
  npm run build
  base44 site deploy
  ```

  Or full project deploy:

  ```bash
  base44 deploy
  ```

  `deploy` pushes entities, functions, connectors, auth config, and site build in one step (with confirmation prompt).

### Secrets (Phase 1 #1)

- [ ] **Set internal function secret** — required for cron jobs and chained legacy validation calls.

  Generate a long random string (e.g. 32+ chars). Set **one** of these env names on Base44:

  - `INTERNAL_FUNCTION_SECRET` (preferred), or
  - `CRON_SECRET`

  **CLI:**

  ```bash
  base44 secrets set INTERNAL_FUNCTION_SECRET="your-long-random-secret-here"
  ```

  **Or:** Base44 dashboard → your app → Secrets / Environment variables (exact UI label may vary).

  After setting, **redeploy functions** so they pick up the secret:

  ```bash
  base44 functions deploy checkLegacyStatus scheduledDeliveryProcessor
  ```

### Cron / automations (Phase 1 #1)

- [ ] **Configure scheduled calls** for legacy check-in and memory delivery.

  In the Base44 dashboard, set up automations (or external cron hitting your function URLs) for:

  | Function | Purpose | Suggested schedule |
  |----------|---------|-------------------|
  | `checkLegacyStatus` | Legacy inactivity protocol | Daily (e.g. once per day) |
  | `scheduledDeliveryProcessor` | Send due scheduled memories | Every 15–60 minutes |

  Each request **must** include the secret:

  - Header: `Authorization: Bearer <your-secret>`, **or**
  - Header: `X-Internal-Secret: <your-secret>`

  Without this, those functions return **401 Unauthorized** (by design).

### Smoke-test after deploy

- [ ] **Memory sharing** — create/edit a memory with friends selected; confirm shares appear (requires `shareMemory` deployed; client fallback was removed).
- [ ] **Delete account** — use a test account only; confirm logout and that the user cannot sign back in with the same data.
- [ ] **Legacy cron** — check function logs after the first scheduled run; expect 200, not 401/503.

  ```bash
  base44 logs
  ```

---

## You do NOT need to

- Paste function code manually into the Base44 web editor (CLI deploy is enough).
- Redeploy the frontend for **function-only** changes (but you **do** need `site deploy` for React changes like Settings).

---

## Payments & Stripe (do this last)

**Operator decision:** Wire up billing after everything else is deployed and stable. Code for checkout may land earlier; these dashboard/secret steps stay on you until you're ready to monetize.

- [ ] **Stripe account & products** — create products/prices in the [Stripe dashboard](https://dashboard.stripe.com) (test mode first).
- [ ] **API keys on Base44** — set secrets (exact names depend on checkout code when shipped), typically:
  - `STRIPE_SECRET_KEY` (server)
  - Publishable key in frontend env / Base44 site config if required
- [ ] **Webhook** — add Stripe webhook URL pointing at the deployed checkout/webhook function; subscribe to events the handler expects (e.g. `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`).
- [ ] **Redeploy** — after secrets change: `base44 functions deploy` (webhook + checkout functions) and `base44 site deploy` if frontend reads new env.
- [ ] **Test checkout** — full flow in Stripe test mode (subscribe, cancel, confirm `User` plan fields update).
- [ ] **Go live** — swap to live Stripe keys and re-test once before pointing real users at paid plans.

---

## Future manual steps (when code is added later)

| When we ship… | You will need to… |
|---------------|-------------------|
| New backend function | `base44 functions deploy <name>` |
| Entity schema / RLS change | `base44 entities push` |
| Auth config change | `base44 auth push` or `base44 deploy` |
| Stripe checkout (Phase 2) | See **Payments & Stripe (do this last)** above |
| GDPR export (Phase 2) | Deploy new function + test export download |
| CI/CD | GitHub Action with `base44 deploy` + stored secrets (not set up yet) |

---

## Quick reference

| Goal | Command |
|------|---------|
| Deploy one function | `base44 functions deploy deleteAccount` |
| Deploy all functions | `base44 functions deploy` |
| Push entity schemas | `base44 entities push` |
| Full deploy | `base44 deploy` |
| List deployed functions | `base44 functions list` |
| Set secret | `base44 secrets set NAME="value"` |
| Tail logs | `base44 logs` |
| Open live site | `base44 site open` |

---

*Last updated: June 2026 — sync with `.cursor/rules/etern8-audit-remediation.mdc` when remediation items change.*
