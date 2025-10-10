# Weekly Parlay Tracker

## Description

The **Weekly Parlay Tracker** is a web-based application designed to help users track their weekly sports betting parlays. It allows users to record the current week's betting ticket, review past tickets, monitor player pick accuracy, and visualize cumulative payouts over time. A dynamic "thermometer" progress bar in the header tracks progress toward a $5,000 goal.

## Features

- **Current Ticket Table**: Display the current week's betting ticket details, including Week, League, Season, Date, Picks (with hit/miss/pending status), Total Odds, Payout, and Notes.
- **Past Tickets Table**: List previous weeks' tickets in the same format, making it easy to compare results week by week.
- **Player Statistics**: Calculate and display each player's number of hits, misses, average odds, and hit percentage across all picks.
- **Progress Chart**: Plot a running total of cumulative payouts on a time-based line chart, alongside a goal line of $15 per week, using Chart.js with date-fns adapter.
- **Goal Tracker**: A thermometer-style progress bar below the header title shows the aggregate payout toward the $5,000 target, updating live as new data arrives.

## Technologies Used

- **HTML5**: Semantic page structure.
- **CSS3**: Modern styling, responsive layout, fixed header, tables with fixed-layout for consistent columns.
- **JavaScript (ES Modules)**: Dynamic DOM manipulation, Chart.js for data visualization.
- **Chart.js**: Interactive line chart with time-scale x-axis (dates) and cumulative payout tracking.
- **chartjs-adapter-date-fns**: Date adapter for Chart.js to parse and format JavaScript `Date` objects.

Each ticket object includes:

- `ticketId`, `weekNumber`, `weekLabel`, `league`, `season`, `date` (ISO string)
- `payout`, `totalOdds`, `notes`
- `picks`: array of `{ player, selection, status: "hit"|"miss"|"pending", odds: "+200"|-150" }`

## Setup & Usage

GitHub Pages Deployment

## License

MIT © Trey Thompson
