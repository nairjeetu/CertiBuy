# CertiBuy

**A custody-first marketplace for certified pre-owned premium devices in India.**
*Buy Smart. Sell Better. Trust Every Device.*

Every device passes through CertiBuy's hands before it is listed: a hub inspects it,
grades it against a fixed checklist, and CertiBuy takes custody and pays the seller — so a
buyer is never choosing between a seller's description and a gamble. Grades A to C are
listed as inspected and carry a warranty; grade D is refurbished first, then listed
without one. The seller chooses whether to be paid today (**Instant Cash**) or paid more
later (**Sell For More**), and CertiBuy prices that choice.

---

## Live application

**https://web-sooty-ten-87.vercel.app**

Sign in with any of the demo accounts below. All four use the password `Demo1234!`

| Email | Role | What you see |
| --- | --- | --- |
| `buyer@certibuy.demo` | Customer, buyer mode | Shop, listing detail, checkout, orders, returns |
| `seller@certibuy.demo` | Customer, seller mode | Device submission, grading, offer, hub booking, payouts |
| `tech@certibuy.demo` | Hub technician | Today's inspection queue, checklist, grading, handover |
| `admin@certibuy.demo` | Ops | Inventory, catalogue, exceptions, settings, demo clock |

Each customer account holds both marketplace sides — switch between buyer and seller
mode from the profile menu.

---

## Walk the core flow in six minutes

The shortest path that exercises the whole product. Full scripts for every role are in
[`docs/DEMO-WALKTHROUGH.md`](docs/DEMO-WALKTHROUGH.md).

1. **Sign in as `seller@certibuy.demo`** → *Sell a device*. Pick a model, enter the
   IMEI `490154203237518`, complete diagnostics and photos. The IMEI is checked against
   its Luhn digit as you type, so an invented number will not pass.
2. **See the offer.** Instant Cash and Sell For More side by side, each stating the
   amount, the timing and the guarantee. Every figure is computed, never hardcoded.
3. **Accept and book a hub slot.** Choose **CertiBuy Indiranagar** — it is the hub
   `tech@certibuy.demo` is assigned to, and a technician only sees their own hub's
   queue. Slots already past are not offered for today.
4. **Sign in as `tech@certibuy.demo`** → open the booking, verify the IMEI, work the
   checklist. The grade is computed from the checks — there is no field in which a
   grade can be typed. Complete handover; the seller is paid and the device is listed.
5. **Sign in as `buyer@certibuy.demo`** → the device is now in the shop with its real
   inspection photos, its certificate, its battery health and its warranty terms. Buy it;
   the money is held in escrow until you confirm receipt.
6. **Sign in as `admin@certibuy.demo`** → *Demo* → advance the business clock. Watch the
   price ladder step down on day 15 and day 30, and the day-45 review fire.

Step 6 is the one worth not skipping: it shows the automated money rules running on
their own rather than being described.

---

## Run it locally

```bash
pnpm install
supabase start                              # local Postgres + Auth + Storage (Docker)
pnpm --filter @certibuy/db db:seed          # catalogue, hubs, demo accounts, demo data
pnpm dev                                    # http://localhost:3000
```

```bash
pnpm build        # production build
pnpm lint
pnpm test         # domain + contract tests
```

Environment variables and hosted setup are documented in
[`docs/deployment.md`](docs/deployment.md).

---

## Where everything lives

Start with **[`CLAUDE.md`](CLAUDE.md)** — the entry point for anyone, human or agent,
working on this codebase. It carries the mental model, the non-negotiable invariants,
the repository map and a map of every document under `docs/`.

```
apps/web/          the only deployable (Next.js App Router, on Vercel)
packages/domain/   pure business rules: pricing, offers, grading, lifecycle, custody
packages/application/  commands, read models, scheduled jobs, policies
packages/contracts/    zod schemas, enums, status labels
packages/db/       Prisma schema, migrations, seed data
packages/integrations/ simulated adapters: payments, payouts, courier, IMEI, mail
docs/              the full documentation set
```

The build is independent: there is no Base44 code, SDK or runtime dependency anywhere
in this repository.

---

## Capstone submission

Product Management with AI — Prof. Saravana Jaikumar, IIM Calcutta.
Group 1, Batch 02. Submission 25 November 2026.

| Deliverable | Where it is |
| --- | --- |
| Functional product | This repository, deployed at the link above |
| Product definition, personas, user stories | *CertiBuy — Track A Deliverable: Product Definition* |
| Consumer & segment analysis | Final Deliverables → Market research Persona |
| Product marketing strategy & execution plan | Track D deliverable |
| Presentation | Track E deliverable |
