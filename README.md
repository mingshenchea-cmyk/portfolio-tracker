# Portfolio Tracker

A Google Sheets–based portfolio tracker for a mixed MYR/USD account. Positions, cost basis,
fees, FX conversion, wallet cash and drawdown alerts are all derived from a single
transaction log — enter a trade once and every other tab updates itself.

## Dashboard

**Total net worth**

![Total Net Worth](Dashboard/Total%20Net%20Worth.jpg)

**Invested portfolio**

![Invested Portfolio](Dashboard/Invested%20Portfolio.jpg)

**Free portfolio**

![Free Portfolio](Dashboard/Free%20Portfolio.jpg)

**Total invested portfolio**

![Total Invested Portfolio](Dashboard/Total%20Invested%20Portfolio.jpg)

**Live template:** _https://docs.google.com/spreadsheets/d/1sdtHpAkVDW4RcZLudvA0g5mx7_t6h7nIyMtlKgXvKDk/edit?usp=sharing_

> All figures in this repo are **sample data**. Tickers are real so the live price lookups
> still work, but the holdings, quantities and amounts are not a real portfolio.

---

## How it works

```
Transactions  ──▶  Holdings  ──▶  Dashboard
      │                │
      └──────────▶  Wallet  ──▶  Dashboard
                       │
                       └─────▶  Alerts
```

`Transactions` is the only tab you type into. Everything else is `SUMIFS`/`FILTER`/`UNIQUE`
over that log, so there is exactly one place for a mistake to live.

Cost basis is tracked in USD with the MYR conversion stored per transaction, which keeps
historical FX rates intact instead of re-valuing old buys at today's rate. Fees are captured
both in USD and MYR.

---

## Files

| File | What it is |
|---|---|
| `Portfolio.xlsx` | Full workbook with formulas, charts and formatting |
| `Portfolio/Dashboard.csv` | Summary tab, exported values |
| `Portfolio/Holdings.csv` | Per-ticker position and P/L |
| `Portfolio/Transactions.csv` | The source log |
| `Portfolio/Alerts.csv` | Drawdown monitor |
| `Portfolio/Wallet.csv` | Cash per broker |

The CSVs are exports, so they contain **values, not formulas**. Open the `.xlsx` or the live
sheet if you want to see how a number is calculated.

---

## `Transactions.csv`

The input log. One row per trade.

| Column | Meaning |
|---|---|
| `Date` | Trade date, `DD/MM/YYYY` |
| `Type` | `Buy`, `Sell`, `Drip` or `Free` (free shares — no cost basis) |
| `Wallet` | Broker the trade went through |
| `Ticker` | Symbol |
| `Amount` | Cash paid, in MYR |
| `FX Rate (USD/MYR)` | Rate used for this specific trade |
| `Converted Amount` | `Amount ÷ FX Rate` — USD paid |
| `Refunded` | Leftover cash returned to the wallet (rounding / partial fills) |
| `Quantity` | Shares |
| `Price/Share` | Execution price, USD |
| `Gross Amount` | `Quantity × Price/Share` |
| `Fees` (col 12) | Broker fee, USD |
| `Fees` (col 13) | Same fee, MYR |
| `Total Cost` (col 14) | `Gross + Fees`, USD |
| `Total Cost` (col 15) | `Quantity × Price × FX + Fees`, MYR |

`Free` rows carry a quantity and a gross value but zero cost, so they land in the
free-portfolio bucket instead of the invested one.

---

## `Holdings.csv`

One row per ticker, derived from `Transactions`. Duplicate column names are USD/MYR pairs.

| Column | Meaning |
|---|---|
| `Ticker` | Symbol, from `UNIQUE(Transactions!Ticker)` |
| `Quantity` | Net shares: buys + drips + free − sells |
| `Avg Cost` | Average purchase price, USD, fee-inclusive |
| `Avg Invested Cost` | Same, using total cost across all buys |
| `Weighted Avg Cost` | Cost basis per share including fees |
| `Fees Paid` (6) / (7) | Cumulative fees, USD / MYR |
| `Total Invested` (8) / (9) | Cost basis, USD / MYR |
| `Live Price` | `GOOGLEFINANCE(Ticker, "price")` |
| `Current Value` (11) | `Quantity × Live Price`, USD |
| `Current FX Rate` | `GOOGLEFINANCE("CURRENCY:USDMYR")` |
| `Current Value` (13) | Position value, MYR |
| `Gain/Loss` (14) | `Current Value − Total Invested`, MYR |
| `Gain/Loss` (15) | Same, as a percentage |

Tickers with `Total Invested = 0` are free shares; the Dashboard splits on that test.

---

## `Dashboard.csv`

Not a flat table — it is the layout of the tab, so most rows are labels with the value
beside or below them.

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

Net worth is the sum of four rows, not a single formula: current holdings (invested),
free holdings, and one row per wallet.

---

## `Alerts.csv`

Drawdown monitor. Watches how far each ticker sits below its 52-week high.

| Column | Meaning |
|---|---|
| `Ticker` | Symbol, same list as Holdings |
| `Current Price` | Live price, USD |
| `52-Week High` | `GOOGLEFINANCE(Ticker, "high52")` |
| `Drop from High` | `(Current − High) ÷ High` |
| `Status` | Banded label in 5% steps: `Normal`, notice from −5% to −20%, warning from −25% to −45%, alert from −50% down |
| `Alert` | `On` / `Off` — whether this ticker is being watched |

---

## `Wallet.csv`

Cash sitting in each broker, in USD and MYR.

| Column | Meaning |
|---|---|
| `Wallet` | Broker name, from `UNIQUE(Transactions!Wallet)` |
| `Refunded` | Sum of `Refunded` for that wallet, USD |
| `Other Cash` | Manual adjustment, USD |
| `Balance` | `Refunded + Other Cash`, USD |
| `Current FX Rate` | Live USD/MYR |
| `Balance` | Balance in MYR — feeds the Dashboard breakdown |

---

## Repo layout

```
README.md
Portfolio.xlsx
Dashboard/
  Total Net Worth.jpg
  Invested Portfolio.jpg
  Free Portfolio.jpg
  Total Invested Portfolio.jpg
Portfolio/
  Portfolio - Dashboard.csv
  Portfolio - Holdings.csv
  Portfolio - Transactions.csv
  Portfolio - Alerts.csv
  Portfolio - Wallet.csv
```

## Notes

- Data is a snapshot. Prices in the CSVs are frozen at export time; the live sheet keeps moving.
- CSV export drops formulas, charts and formatting. `.xlsx` preserves them.
- Currency is MYR; USD positions are converted at the live rate, historical buys at their own rate.
