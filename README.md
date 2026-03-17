# BudgetIO

A personal budget tracker I built to stop losing track of where my money goes. No accounts, no subscriptions — just open it and start logging.

## What it does

You add income and expenses, pick a category, and the dashboard updates in real time. There's a monthly budget goal you can set yourself, a breakdown of spending by category, and a chart comparing income vs expenses over time. Everything saves automatically so your data is still there when you come back.

The transaction list has filters for income/expense and by month, so finding a specific entry doesn't require scrolling through everything. Each transaction has a delete button. Adding one takes maybe five seconds with the quick-amount chips.

## Stack

- TypeScript + React
- Vite
- Recharts for the graphs
- localStorage for persistence

## Run it locally
```bash
npm install
npm run dev
```

No API keys needed. No backend. Works offline.

## What's missing (for now)

- Editing a transaction after saving it
- Recurring transactions
- Export to CSV
- Multi-currency support

These are on the list for v2.

## Screenshots

*Dashboard with spending breakdown and income vs expenses chart.*

## Live demo

[budget-io-three.vercel.app](https://budget-io-three.vercel.app)
