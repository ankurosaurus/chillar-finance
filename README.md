# Chillar — Personal Finance for College Hostel Life

> *"Every rupee, accounted for."*

**Chillar** is a mobile-first personal finance progressive web application designed specifically for college students living in hostels with prepaid mess facilities. It treats spending with the calm, spacious elegance of a private banking application—replacing anxiety and guilt with quiet confidence, automated goal accumulation, and spending visibility.

---

## The Core Problem

In college hostels, mess food is already prepaid at the start of the semester, yet students constantly bleed funds on outside food, evening chai tapris, and late-night delivery runs. This unmonitored leak drains money that could otherwise fund semester trips, movies, tech gear, and fun.

**Chillar solves this by:**
1. **Excluding prepaid mess** from daily deductions so students always have an accurate net spendable number.
2. **"Safe to spend today" Hero metric** calculated as `remaining weekly budget ÷ days left in the week`.
3. **Dedicated Outside Food envelope** with soft-cap warnings (at 80%) reminding students that the mess is already paid for.
4. **Consecutive Days Streak** without outside food.
5. **Micro-Savings Round-Ups** that round daily expenses up to the nearest ₹10 into active goals.
6. **"Can I afford this?" Simulator** that computes instant weekly headroom and goal milestone delays for prospective spends.
7. **Leak Reports** that expose repetitive micro-spends (chai, rolls, late-night Maggi) and what they could fund instead.

---

## Design Language

- **Aesthetic**: Private Swiss banking feel—quiet, spacious, confident, hairline borders, no loud saturated colors or emoji chrome.
- **Palette**:
  - **Dark Default**: Background `#08090C`, Surface `#10121A`, Elevated `#181B26`, Hairline Border `rgba(255,255,255,0.08)`, Text `#F8FAFC`, Muted Text `#94A3B8`.
  - **Light Theme**: Background `#F8FAFC`, Surface `#FFFFFF`, Elevated `#F1F5F9`, Hairline Border `rgba(15,23,42,0.08)`, Text `#0F172A`, Muted Text `#64748B`.
  - **Single Accent**: Metallic Gold (`#D4AF37`) & Champagne Amber.
  - **Semantics**: Soft Sage/Emerald (`#10B981`) for income & positive savings; Crimson Terracotta (`#F43F5E`) for overspend alerts.
- **Typography**:
  - Display & Numbers: **Fraunces** serif (light weights 300–400) for large numbers & headings.
  - UI Text: **Inter** (400/500).
  - All currency formatted in **Indian Numbering System (en-IN)** with `font-feature-settings: 'tnum'` (`₹12,500`, `₹1,25,000`).
- **Cards & Layout**: Fully responsive: fluid adaptive canvas for PC / Desktop monitors up to 6xl container, plus 480px max centered mobile layout.

---

## Tech Stack & Architecture

- **React 19 & TypeScript**: Strict types, no `any`.
- **Vite**: Ultra-fast build & development bundling.
- **Tailwind CSS v4**: Modern CSS theme variables and hardware-accelerated animations.
- **Zustand**: Reactive state management with `chillar:store` persistence in `localStorage`.
- **Recharts**: Spending velocity area charts and category distribution donuts.
- **Framer Motion**: Subtle, physics-based modal and keypad micro-interactions.
- **Date-fns**: Pure date calculations and calendar intervals.
- **Deployment**: Live on Vercel at [https://chillar-blush.vercel.app](https://chillar-blush.vercel.app) and GitHub at [https://github.com/ankurosaurus/chillar-finance](https://github.com/ankurosaurus/chillar-finance).

---

## Project Structure

```
chillar/
├── public/
│   ├── favicon.svg          # Minimal gold coin/dot favicon
│   ├── manifest.json        # PWA manifest
│   └── sw.js                # Service Worker for offline support
├── src/
│   ├── components/
│   │   ├── Card.tsx         # Hairline border card
│   │   ├── Stat.tsx         # Fraunces typography stat block
│   │   ├── ProgressBar.tsx  # Minimal progress bar with pace marker
│   │   ├── Chip.tsx         # Tactile category & filter pill
│   │   ├── Keypad.tsx       # Big numeric keypad (<5s entry)
│   │   ├── Sheet.tsx        # Spring-animated bottom sheet
│   │   ├── Header.tsx       # Wordmark, desktop nav & controls
│   │   ├── Navbar.tsx       # Bottom mobile tab bar + center "+" FAB
│   │   ├── AlertBanner.tsx  # In-app soft cap & milestone toasts
│   │   ├── LockScreen.tsx   # 4-Digit passcode screen
│   │   ├── AffordabilityModal.tsx # "Can I afford this?" simulator
│   │   ├── QuickAddModal.tsx      # Fast expense/income bottom sheet
│   │   └── EmptyState.tsx   # Calm, instructive empty states
│   ├── pages/
│   │   ├── Home.tsx         # Dashboard hero, pace bar & goals strip
│   │   ├── Ledger.tsx       # Daily grouped transactions & filters
│   │   ├── DayPlanner.tsx   # Financial day prior planner & today date
│   │   ├── Goals.tsx        # Savings targets, round-ups & challenges
│   │   ├── Insights.tsx     # Recharts velocity, heatmap & leak report
│   │   ├── Settings.tsx     # Inflow, fixed costs, PIN, export CSV/JSON
│   │   └── Onboarding.tsx   # 3-Step setup with real user inputs
│   ├── store/
│   │   └── useFinanceStore.ts # Zustand persistent store with Day Planner
│   ├── lib/
│   │   ├── budgetMath.ts    # Pure mathematical budget utilities
│   │   ├── budgetMath.test.ts # Unit tests for budget math
│   │   ├── formatters.ts    # Indian currency (₹) & date formatters
│   │   ├── insights.ts      # Heatmap, leak reports & rule-based insights
│   │   └── seedData.ts      # Zero-mock initial state
│   ├── types/
│   │   ├── finance.ts       # Domain data models & types (DayPlan, PlannedItem)
│   │   └── index.ts
│   ├── hooks/
│   │   └── useTheme.ts      # Light/dark mode manager
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
└── vite.config.ts
```

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Run the development server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser or phone.

### 3. Build for production
```bash
npm run build
```

### 4. Run pure math verification tests
```bash
npx tsx src/lib/budgetMath.test.ts
```

---

## Features Walkthrough

1. **Onboarding & Sample Data**:
   - 3 calm steps: Inflows & Allowance → Fixed costs (Prepaid mess marked) → Savings target & first goal.
   - Tap **"Explore with sample hostel data"** at any time to immediately load 20+ realistic college transactions, active goals (Goa Trip, Sony ANC Headphones), and active challenges.

2. **Safe to Spend Today**:
   - Computes daily headroom based on weekly budget divided by days remaining in the week.
   - Month pace indicator bar shows whether you are ahead or behind your expected spend.

3. **Quick Add (< 5 Seconds)**:
   - Big keypad opens immediately from the floating gold `+` button.
   - Enter amount with one tap on category chips (Outside Food, Snacks & Chai, Transport, etc.).
   - Gentle, guilt-free nudge displays remaining monthly outside food balance upon logging.

4. **"Can I Afford This?" Tool**:
   - Accessible via the top header badge.
   - Shows before vs. after daily safe-to-spend, whether the week budget is exceeded, and the estimated delay on active goals.

5. **Security & Privacy**:
   - Optional 4-digit PIN lock stored locally.
   - Data exportable to CSV and JSON at any time from Settings.
