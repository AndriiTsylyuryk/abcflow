# ABCflow — AI Video Generation SaaS

A production-minded subscription SaaS for AI video generation, built on Next.js 14, Firebase, and Stripe.

---

## Table of Contents

1. [Architecture overview](#architecture-overview)
2. [Project structure](#project-structure)
3. [Local setup](#local-setup)
4. [Firebase setup](#firebase-setup)
5. [Stripe setup](#stripe-setup)
6. [KLIFGEN integration](#klifgen-integration)
7. [How subscriptions work](#how-subscriptions-work)
8. [How usage credits work](#how-usage-credits-work)
9. [Environment variables reference](#environment-variables-reference)
10. [Vercel deployment](#vercel-deployment)
11. [Security notes](#security-notes)

---

## Architecture overview

```
Browser
  └─ Firebase Auth (client SDK)          → manages ID tokens
  └─ Next.js App Router pages            → React UI
  └─ fetch() with Bearer token           → API routes

Next.js API Routes (server-side only)
  └─ verifyAuthToken()                   → Firebase Admin validates token
  └─ Services layer                      → business logic
  └─ Firestore (Admin SDK)               → database
  └─ Stripe SDK                          → billing
  └─ KLIFGEN provider                    → video generation

Stripe webhooks → /api/webhooks/stripe   → billing events
```

**Key architectural decisions:**

| Decision | Reason |
|---|---|
| No client→KLIFGEN calls | Provider secrets must never leave the server |
| Credit deduction before provider call | Prevents double-spending on retries |
| Firestore transactions for credit mutations | Atomic balance updates without races |
| Webhook idempotency via `webhookEvents` collection | Safe to receive duplicate events |
| Config-driven plans and model costs | Easy to adjust pricing without code changes |

---

## Project structure

```
src/
├── app/                        # Next.js App Router
│   ├── api/
│   │   ├── auth/register/      # POST: create Firebase user + Firestore doc
│   │   ├── billing/checkout/   # POST: create Stripe Checkout session
│   │   ├── billing/portal/     # POST: create Stripe Customer Portal session
│   │   ├── dashboard/          # GET: combined dashboard data
│   │   ├── generate/           # POST: start generation job
│   │   ├── jobs/[jobId]/       # GET: poll job status + update from provider
│   │   └── webhooks/stripe/    # POST: Stripe webhook handler
│   ├── billing/                # Billing & account page
│   ├── dashboard/              # Main dashboard
│   ├── forgot-password/        # Password reset
│   ├── generate/               # Generation form
│   ├── login/                  # Sign in
│   ├── pricing/                # Pricing page
│   └── register/               # Sign up
│
├── components/
│   ├── auth/                   # AuthForm (login/register/forgot)
│   ├── dashboard/              # Navbar, UsageBar, JobStatusBadge
│   ├── generate/               # GenerationForm
│   └── ui/                     # Button, Input, Card, Badge, Alert
│
├── config/
│   ├── constants.ts            # Collection names, status enums, error codes
│   ├── models.ts               # Model configs + credit costs (single source)
│   └── plans.ts                # Plan configs + entitlements (single source)
│
├── contexts/
│   └── auth.context.tsx        # Firebase auth state + session cookie
│
├── errors/
│   └── index.ts                # Typed error hierarchy + serializer
│
├── lib/
│   ├── firebase/
│   │   ├── admin.ts            # Firebase Admin SDK (server-only)
│   │   └── client.ts           # Firebase Client SDK (browser-only)
│   ├── stripe/
│   │   └── client.ts           # Stripe SDK (server-only)
│   └── klifgen/
│       └── client.ts           # KLIFGEN provider implementation
│
├── services/
│   ├── billing.service.ts      # Checkout, portal, webhook handlers
│   ├── generation.service.ts   # Full generation flow + polling
│   ├── usage.service.ts        # Credit deduction/refund (transactional)
│   ├── user.service.ts         # Firestore user document management
│   └── webhook.service.ts      # Webhook idempotency
│
├── types/
│   ├── api.ts                  # Request/response shapes
│   ├── database.ts             # Firestore document types
│   └── provider.ts             # Video provider interface
│
├── utils/
│   ├── api.ts                  # successResponse / errorResponse / verifyAuthToken
│   ├── cn.ts                   # Tailwind class merger
│   └── validation.ts           # Zod schemas + parseSchema helper
│
└── middleware.ts               # Route protection (cookie-based, edge)
```

---

## Local setup

### Prerequisites

- Node.js 18+
- A Firebase project
- A Stripe account (test mode is fine)
- KLIFGEN API credentials

### Steps

```bash
# 1. Clone the repo
git clone <repo-url>
cd abcflow

# 2. Install dependencies
npm install

# 3. Copy env file
cp .env.example .env.local
# Fill in all values — see "Environment variables" section below

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Firebase setup

### 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication → Email/Password**
4. Enable **Firestore Database** (start in production mode)

### 2. Get client config

In Firebase Console → Project settings → Your apps → Web app:

Copy the config values into your `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### 3. Create a service account (Admin SDK)

1. Firebase Console → Project settings → Service accounts
2. Click **Generate new private key**
3. Open the downloaded JSON file
4. Copy values into `.env.local`:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> **Important:** Wrap `FIREBASE_PRIVATE_KEY` in double quotes and keep the `\n` escape sequences. Do not convert them to real newlines.

### 4. Deploy Firestore rules

```bash
npm install -g firebase-tools
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

---

## Stripe setup

### 1. Create products and prices

In Stripe Dashboard (test mode):

1. Go to **Products** → **Add product**
2. Create **ABCflow Creator** — €49/month recurring
3. Create **ABCflow Growth** — €89/month recurring
4. Copy each price ID into `.env.local`:

```
STRIPE_CREATOR_PRICE_ID=price_xxx
STRIPE_GROWTH_PRICE_ID=price_xxx
```

### 2. Get API keys

Stripe Dashboard → Developers → API keys:

```
STRIPE_SECRET_KEY=sk_test_xxx
```

### 3. Set up webhooks for local development

Install the Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
stripe login
```

Forward webhooks to your local server:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This outputs your webhook signing secret:
```
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**Required events to forward:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 4. Set up webhook for production

In Stripe Dashboard → Developers → Webhooks:
1. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
2. Select all 6 events above
3. Copy the signing secret into your production env vars

---

## KLIFGEN integration

ABCflow uses KLIFGEN as the video generation provider via a clean provider abstraction.

**How it works:**
1. `src/lib/klifgen/client.ts` implements the `VideoProvider` interface
2. Credentials (`KLIFGEN_USERNAME`, `KLIFGEN_SECRET_KEY`) are server-only
3. The provider is called only from server-side API routes
4. Model → endpoint mapping is in `src/config/models.ts`

**To swap providers:** implement a new class satisfying the `VideoProvider` interface in `src/types/provider.ts` and update `getVideoProvider()` in `src/lib/klifgen/client.ts`.

**Polling flow:**
1. `POST /api/generate` → creates job, deducts credits, calls KLIFGEN, returns `jobId`
2. Client polls `GET /api/jobs/[jobId]` every 5 seconds
3. Route handler fetches status from KLIFGEN and updates Firestore
4. When completed/failed, returns final state

---

## How subscriptions work

```
User clicks "Subscribe" on /billing
  → POST /api/billing/checkout { planId: "creator" }
  → Creates Stripe Checkout session
  → Redirects to Stripe hosted page

User completes payment
  → Stripe fires checkout.session.completed webhook
  → /api/webhooks/stripe validates signature
  → Checks idempotency (webhookEvents collection)
  → Calls handleCheckoutCompleted()
  → Creates subscriptions/{id} document
  → Updates users/{uid}:
      subscriptionStatus = "active"
      currentPlan = "creator"
      usageCreditsRemaining = 1500
      usageCreditsMonthlyLimit = 1500
  → Marks webhook event processed

Monthly renewal:
  → Stripe fires invoice.payment_succeeded with billing_reason = "subscription_cycle"
  → Resets usageCreditsRemaining to plan default
  → Creates usageTransactions record for audit

Cancellation / payment failure:
  → Stripe fires customer.subscription.deleted or invoice.payment_failed
  → subscriptionStatus updated to "canceled" / "past_due"
  → Future generations blocked
```

---

## How usage credits work

Usage credits are **internal** — they do not map 1:1 to KLIFGEN credits.

**Why internal credits?**
- Lets us adjust pricing without touching provider contracts
- Decouples the user-facing product model from provider implementation
- Enables future multi-provider support

**Credit costs** are defined in `src/config/models.ts` under `creditCosts` per model:
```ts
sora2: {
  creditCosts: {
    "5s_720p":  180,
    "10s_720p": 300,
    ...
  }
}
```

**Generation flow:**
1. Check subscription is active
2. Check plan includes requested model
3. Check resolution allowed for plan tier
4. Calculate credit cost for model+length+resolution
5. Check user has enough credits
6. Check rate limits (per-minute + concurrent)
7. Create pending job in Firestore
8. **Atomically deduct credits** via Firestore transaction
9. Call KLIFGEN
10. Save provider task ID
11. Return job ID to client

**Refund policy:**
- If KLIFGEN call fails before task is created → immediate full refund
- If KLIFGEN job later fails (detected during polling) → full refund
- Refunds are capped at monthly limit (no free credits exploit)

**Monthly reset:**
- Triggered by `invoice.payment_succeeded` webhook with `billing_reason = "subscription_cycle"`
- Resets `usageCreditsRemaining` to plan's `monthlyUsageCredits`
- Records a `MONTHLY_RESET` transaction for audit trail
- No rollover — unused credits expire

---

## Environment variables reference

| Variable | Where used | Notes |
|---|---|---|
| `APP_URL` | Server | Full URL (no trailing slash). Used for Stripe redirect URLs. |
| `NODE_ENV` | Server | `development` or `production` |
| `NEXT_PUBLIC_FIREBASE_*` | Client | Safe to expose — Firebase client config |
| `FIREBASE_PROJECT_ID` | Server | From service account JSON |
| `FIREBASE_CLIENT_EMAIL` | Server | From service account JSON |
| `FIREBASE_PRIVATE_KEY` | Server | From service account JSON — wrap in quotes |
| `STRIPE_SECRET_KEY` | Server | `sk_test_` or `sk_live_` |
| `STRIPE_WEBHOOK_SECRET` | Server | From webhook endpoint config |
| `STRIPE_CREATOR_PRICE_ID` | Server | Recurring price for Creator plan |
| `STRIPE_GROWTH_PRICE_ID` | Server | Recurring price for Growth plan |
| `KLIFGEN_API_BASE_URL` | Server | Base URL for KLIFGEN API |
| `KLIFGEN_USERNAME` | Server | Never expose to client |
| `KLIFGEN_SECRET_KEY` | Server | Never expose to client |

---

## Vercel deployment

### 1. Connect repository

1. Push to GitHub
2. Import project in Vercel
3. Set **Framework Preset** to Next.js

### 2. Set environment variables

In Vercel project → Settings → Environment Variables, add all variables from `.env.example`.

> For `FIREBASE_PRIVATE_KEY`: paste the raw value including `-----BEGIN PRIVATE KEY-----` and real newlines. Vercel handles multi-line values correctly in its UI.

### 3. Set APP_URL

```
APP_URL=https://your-domain.vercel.app
```

### 4. Update Stripe webhook

Add a new Stripe webhook endpoint pointing to your production URL:
```
https://your-domain.vercel.app/api/webhooks/stripe
```

Copy the new signing secret to `STRIPE_WEBHOOK_SECRET` in Vercel.

### 5. Update Firebase

In Firebase Console → Authentication → Settings → Authorized domains:
Add your Vercel domain.

### Vercel compatibility notes

- All API routes use `runtime = "nodejs"` where Firebase Admin is needed
- Webhook route reads raw body via `request.arrayBuffer()` — compatible with Vercel
- No long-running processes — polling is client-driven
- No filesystem usage — pure serverless compatible

---

## Security notes

1. **KLIFGEN credentials** — only in server env vars; never imported in client components
2. **Firebase Admin** — only in `src/lib/firebase/admin.ts`; only imported in API routes
3. **Stripe secret key** — only in `src/lib/stripe/client.ts`; only used server-side
4. **Webhook verification** — every Stripe webhook verifies the `stripe-signature` header
5. **Auth on every API route** — all protected routes call `verifyAuthToken()` first
6. **Job ownership check** — polling route verifies `job.uid === uid`
7. **Input validation** — all API inputs parsed through Zod schemas before use
8. **No stack traces in production** — `serializeError()` sanitizes errors before client response
9. **Firestore rules** — clients can only read their own documents; all writes are server-side
10. **Session cookie** — used only for middleware route protection; actual auth validation uses Firebase ID tokens server-side
