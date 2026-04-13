# Sikke & Feature Gating — Rethink from First Principles

## Core Job-To-Be-Done

**Primary:** Log expenses effortlessly (voice-first)  
**Secondary:** Understand spending, stay on budget, sync with partner

---

## Feature Classification

### 1. Core Essential (Must Be Free)

These are the product — gating them kills the app:

- Voice/text expense logging
- Basic categories (14 categories)
- Transaction viewing/editing/deleting
- Basic budget (monthly budget card)
- Basic analytics (monthly total, simple pie chart, trend line)
- Household pairing + real-time sync
- Day-1 push notifications
- Recurring templates library
- CSV export (already exists)

**Why free:** Day-1 experience must be complete. New user should survive without paying.

---

### 2. Nice-to-Have (Gatable)

| Feature | User Want | Marginal Cost to Me | Why Worth Paying |
|---------|-----------|---------------------|------------------|
| **Premium Apni Awaaz** | Deeper roasts/insights | API calls | Unique to us, differentiated |
| **Cloud Backup** | ✅ Yes | Google Drive with secret phrase | Real utility, real pain point |
| **Advanced Analytics** | Year-over-year, custom dates | None | More insights = more value |
| **Receipt Photo Storage** | Keep proof | Cloud storage | Real storage cost |

---

## Sikke vs Money Bifurcation

### Decision Framework

| Factor | Sikke Gate | Money Gate |
|--------|-----------|------------|
| Marginal cost to me | Zero | Non-zero |
| Target user | Loyal/engaged | Impatient/instant |
| Psychology | Reward engagement | Convenience purchase |

---

### Recommendation

| Feature | Gate With | Rationale |
|---------|-----------|------------|
| **Advanced Analytics** | Sikke (200) | Zero cost, nice-to-have |
| | **Currently built:** Trend chart, category pie, pacing strip, vs previous period, owner filter, basic filters |
| | **Not built (Advanced):** Year-over-year, multi-year trends, day-of-week analysis, category trends over 6-12 months, budget adherence over time, payment method trends, recurring vs one-time split, savings rate |
| **Premium Apni Awaaz** | Both (200 Sikke OR ₹10/mo) | Higher API cost, subscription option |
| **Receipt Photo Storage** | Sikke (150) | Same Google Drive approach as Cloud Backup, zero cost to me |
| **Cloud Backup** | Sikke (200) | Google Drive + secret phrase, zero cost to me |

---

## The Sikke Economy Flow

```
Earn Sikke (logging, games) → Spend on: PDF, Analytics, Goals, Apni Awaaz
                              → OR Stake in Kharcha Poker (can lose)
                              → OR Save for status (future: profile tiers)
```

This avoids CRED's problem because:
1. **Spend paths exist** — not just accumulation
2. **Loss possible** — Kharcha Poker creates stakes
3. **Exclusive access** — features gated behind Sikke have real value
4. **Dual option** — users can also pay real money if they want instant