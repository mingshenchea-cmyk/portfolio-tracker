# 📊 Portfolio Tracker

![Google Sheets](https://img.shields.io/badge/Google%20Sheets-34A853?logo=googlesheets&logoColor=white)
![Multi-currency](https://img.shields.io/badge/multi--currency-MYR%20%2B%20USD-blue)
![Live prices](https://img.shields.io/badge/prices-GOOGLEFINANCE-brightgreen)
![Alerts](https://img.shields.io/badge/alerts-Apps%20Script-f4b400)

A multi-currency portfolio tracker built in Google Sheets. Enter each trade once — every
position, cost basis, fee, FX conversion, wallet balance and drawdown alert is derived from
that single log.

![Total Net Worth](Dashboard/Total%20Net%20Worth.jpg)

> **Sample data.** Tickers are real so the live price lookups work, but the holdings,
> quantities and amounts are not a real portfolio.

**Live template:** [Open in Google Sheets](https://docs.google.com/spreadsheets/d/1sdtHpAkVDW4RcZLudvA0g5mx7_t6h7nIyMtlKgXvKDk/edit?usp=sharing)

---

## 💡 Why this exists

If you invest across borders, most trackers fail in one of three ways:

- **No currency handling.** They force you to value a USD position in USD, so your actual
  return in your own currency — the money you can actually spend — is invisible.
- **One global exchange rate.** Some do convert, but apply a single rate to the whole
  portfolio. That silently rewrites history: a buy made at 4.09 gets re-valued at today's
  4.12, and your cost basis drifts every day.
- **No rate override.** When the broker's rate differs from the market rate, the number
  can't be corrected, so the profit figure is wrong by exactly the spread.

This tracker stores **the FX rate per transaction**. Cost basis is frozen at the rate you
actually paid; current value uses today's rate. The gap between the two is the real return.

---

## 📸 Screenshots

### 🏦 Total net worth

![Total Net Worth](Dashboard/Total%20Net%20Worth.jpg)

The headline. Net worth split into its four parts — invested holdings, free holdings, and
cash sitting in each broker — with capital deployed shown alongside. The bar chart compares
each bucket against total capital so you can see at a glance how much of your net worth is
actually working.

### 📈 Invested portfolio

![Invested Portfolio](Dashboard/Invested%20Portfolio.jpg)

Positions bought with your own cash: current value, gain/loss in both money and percent,
and an allocation pie. This is the part of the portfolio where cost basis is tracked, so
these are the only positions that can show a real profit or loss.

### 🎁 Free portfolio

![Free Portfolio](Dashboard/Free%20Portfolio.jpg)

Holdings acquired at zero cost — free shares, sign-up rewards, referral bonuses. They carry
no cost basis, so they can't show a percentage gain; they simply add their full market value
to net worth. Kept separate so they don't distort the return on money you actually put in.

### 💰 Total invested portfolio

![Total Invested Portfolio](Dashboard/Total%20Invested%20Portfolio.jpg)

Capital deployed: what you paid per ticker, fees included, and how that capital is spread
across positions. This is the denominator for every return figure above — it does not move
with the market, only when you buy or sell.

---

## ⚙️ How it works

```
Transactions  ──▶  Holdings  ──▶  Dashboard
      │                │
      └──────────▶  Wallet  ──▶  Dashboard
                       │
                       └─────▶  Alerts
```

`Transactions` is the only tab you type into. Everything else is `SUMIFS` / `FILTER` /
`UNIQUE` over that log, so there is exactly one place for a mistake to live.

Each transaction records:

| | |
|---|---|
| `Amount` | cash paid, in your base currency |
| `FX Rate` | the rate on that specific day |
| `Converted Amount` | `Amount ÷ FX Rate` — the USD actually spent |

Cost basis stays in USD per share, with the MYR conversion stored per row. Historical buys
never get re-valued at a later rate.

---

## 🚨 Automated alerts

`code.gs` is a Google Apps Script that emails you when a watched position drops past a new
threshold — so you don't have to sit on the sheet watching red numbers.

**Setup**

1. In the sheet: **Extensions → Apps Script**, paste `code.gs`, **Save**.
2. On the `Alerts` tab, set the `Alert` column to `On` for the tickers you want watched.
3. **Triggers** (clock icon) → **Add trigger** → function `checkPortfolioAlerts` →
   *Time-driven* → *Hour timer* → **Save**.

**What it does**

- 🔍 Only tickers with `Alert = On` are checked.
- 🔁 It emails once per **new** threshold, not every hour — a position parked at −12% won't
  spam you.
- 🧠 Last-alerted state is remembered per ticker in `ScriptProperties`.
- ✅ When a ticker recovers to `Normal`, its memory resets and the next drop alerts again.
- 🛡️ Rows showing `#N/A` (a `GOOGLEFINANCE` hiccup) are skipped instead of firing a false alarm.

---

## 📚 Reference

<details>
<summary><b>Transactions</b> — the input log, one row per trade</summary>

| Column | Meaning |
|---|---|
| `Date` | Trade date, `DD/MM/YYYY` |
| `Type` | `Buy`, `Sell`, `Drip` or `Free` (free shares — no cost basis) |
| `Wallet` | Broker the trade went through |
| `Ticker` | Symbol |
| `Amount` | Cash paid, in base currency |
| `FX Rate` | Rate used for this specific trade |
| `Converted Amount` | `Amount ÷ FX Rate` — USD paid |
| `Refunded` | Leftover cash returned to the wallet (rounding / partial fills) |
| `Quantity` | Shares |
| `Price/Share` | Execution price, USD |
| `Gross Amount` | `Quantity × Price/Share` |
| `Fees` (12) | Broker fee, USD |
| `Fees` (13) | Same fee, in base currency |
| `Total Cost` (14) | `Gross + Fees`, USD |
| `Total Cost` (15) | `Quantity × Price × FX + Fees`, base currency |

`Free` rows carry a quantity and a gross value but zero cost, so they land in the free
bucket instead of the invested one.

</details>

<details>
<summary><b>Holdings</b> — one row per ticker, derived from Transactions</summary>

Duplicate column names are USD / base-currency pairs.

| Column | Meaning |
|---|---|
| `Ticker` | Symbol, from `UNIQUE(Transactions!Ticker)` |
| `Quantity` | Net shares: buys + drips + free − sells |
| `Avg Cost` | Average purchase price, USD, fee-inclusive |
| `Avg Invested Cost` | Same, using total cost across all buys |
| `Weighted Avg Cost` | Cost basis per share including fees |
| `Fees Paid` (6) / (7) | Cumulative fees, USD / base |
| `Total Invested` (8) / (9) | Cost basis, USD / base |
| `Live Price` | `GOOGLEFINANCE(Ticker, "price")` |
| `Current Value` (11) | `Quantity × Live Price`, USD |
| `Current FX Rate` | `GOOGLEFINANCE("CURRENCY:USDMYR")` |
| `Current Value` (13) | Position value, base currency |
| `Gain/Loss` (14) | `Current Value − Total Invested`, base currency |
| `Gain/Loss` (15) | Same, as a percentage |

Tickers with `Total Invested = 0` are free shares; the Dashboard splits on that test.

</details>

<details>
<summary><b>Dashboard</b> — summary tab, not a flat table</summary>

The CSV is the tab's layout, so most rows are labels with the value beside or below them.

| Block | Contents |
|---|---|
| Invested Portfolio | Total current value, total gain/loss, and the % |
| Per-ticker table | `Ticker`, `Current Value`, `Gain/Loss`, `%` — invested positions only |
| Total Invested Portfolio | Sum of cost basis for invested positions |
| Ticker / Invested | Cost basis per ticker |
| Free Portfolio | Current value of the zero-cost holdings |
| Ticker / Current Value | Value per free holding |
| Total Net Worth | Sum of the breakdown below |
| Capital & Cost | Total capital deployed |
| Net Worth Breakdown | Invested + Free + each wallet's cash → `Total` |

</details>

<details>
<summary><b>Alerts</b> — drawdown monitor</summary>

| Column | Meaning |
|---|---|
| `Ticker` | Symbol, same list as Holdings |
| `Current Price` | Live price, USD |
| `52-Week High` | `GOOGLEFINANCE(Ticker, "high52")` |
| `Drop from High` | `(Current − High) ÷ High` |
| `Status` | Banded label in 5% steps: `Normal`, notice from −5% to −20%, warning from −25% to −45%, alert from −50% down |
| `Alert` | `On` / `Off` — whether this ticker is watched by the script |

</details>

<details>
<summary><b>Wallet</b> — cash per broker</summary>

| Column | Meaning |
|---|---|
| `Wallet` | Broker name, from `UNIQUE(Transactions!Wallet)` |
| `Refunded` | Sum of `Refunded` for that wallet, USD |
| `Other Cash` | Manual adjustment, USD |
| `Balance` | `Refunded + Other Cash`, USD |
| `Current FX Rate` | Live USD/base rate |
| `Balance` | Balance in base currency — feeds the Dashboard breakdown |

</details>

---

## 💱 Using a different base currency

MYR is the base currency here. To switch, three things change:

1. Replace `RM` with your symbol in the number formats.
2. Change every `GOOGLEFINANCE("CURRENCY:USDMYR")` to your pair — `USDEUR`, `USDGBP`,
   `USDSGD`, `USDJPY`, and so on.
3. Re-export or re-enter `FX Rate` values in `Transactions` — those are the rates you were
   actually charged, so they can't be derived.

Everything else is currency-agnostic: the formulas only ever divide or multiply by the rate
stored on each row.

---

## 🗺️ Roadmap

- 📱 **A real app** — move off Sheets so the tracker works on mobile without the
  spreadsheet's formula limits and recalc lag.
- 📸 **Screenshot import** — upload a broker confirmation, OCR it, and write the
  transaction row automatically. That removes the last manual step.
- 🎯 **Per-position thresholds** — today every ticker shares the same 5% bands. Next: a
  custom drop threshold per ticker, plus a rebalancing alert when a position drifts from its
  target weight. A 3% move on a volatile name shouldn't page you; a 3% move on a bond ETF
  should.

---

## 📁 Repo layout

```
README.md
code.gs
Portfolio.xlsx
Dashboard/
  Total Net Worth.jpg
  Invested Portfolio.jpg
  Free Portfolio.jpg
  Total Invested Portfolio.jpg
Portfolio/
  Dashboard.csv
  Holdings.csv
  Transactions.csv
  Alerts.csv
  Wallet.csv
```

## 📝 Notes

- Data is a snapshot. Prices in the CSVs are frozen at export time; the live sheet keeps moving.
- CSV export drops formulas, charts and formatting — open the `.xlsx` or the live sheet to
  see how a number is calculated.
- USD positions are converted at the live rate; historical buys stay at the rate they were
  bought at.
- Emoji in the `Status` column may not survive a CSV export depending on your download
  path — the script matches on the `NN%` text, so alerts still work either way.
