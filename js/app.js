// app.js

// Load Chart.js date adapter to enable time axis
import 'https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Firebase config & init
const firebaseConfig = {
  apiKey: "AIzaSyBkLHhHTdLWe4ezlt2pnUdptSSdprObryI",
  authDomain: "parlay-vaycay.firebaseapp.com",
  projectId: "parlay-vaycay",
  storageBucket: "parlay-vaycay.appspot.com",
  messagingSenderId: "174327136085",
  appId: "1:174327136085:web:9bebcf73a587005256b9dc",
  measurementId: "G-6TK3RBP788"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM references
const currentBody = document.getElementById('current-ticket').querySelector('tbody');
const pastBody    = document.getElementById('past-weeks').querySelector('tbody');
const statsBody   = document.getElementById('player-stats').querySelector('tbody');

// Stats accumulator
const playerStats = {};

// Helpers
function clear(elem) {
  elem.innerHTML = '';
}

function processPicks(picks) {
  picks.forEach(({ player, status, odds }) => {
    const numericOdds = parseInt(odds, 10);
    if (!playerStats[player]) {
      playerStats[player] = { hits: 0, misses: 0, oddsSum: 0, count: 0 };
    }
    const stats = playerStats[player];
    stats.count++;
    stats.oddsSum += numericOdds;
    if (status === 'hit') stats.hits++;
    if (status === 'miss') stats.misses++;
  });
}

function renderStats() {
  clear(statsBody);
  Object.entries(playerStats).forEach(([player, data]) => {
    const avg = Math.round(data.oddsSum / data.count);
    const formattedOdds = (avg >= 0 ? '+' : '') + avg;
    const hitPct = ((data.hits / data.count) * 100).toFixed(2) + '%';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${player}</td>
      <td>${data.hits}</td>
      <td>${data.misses}</td>
      <td>${formattedOdds}</td>
      <td>${hitPct}</td>
    `;
    statsBody.appendChild(row);
  });
}

// Initialize Chart.js with empty datasets
const ctx = document.getElementById('progress-chart').getContext('2d');
const progressChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Goal ($15 per week)',
        data: [],
        borderColor: 'blue',
        fill: false,
        tension: 0
      },
      {
        label: 'Cumulative Winnings',
        data: [],
        borderColor: 'green',
        fill: false,
        tension: 0
      }
    ]
  },
  options: {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: { unit: 'day', tooltipFormat: 'MMM dd, yyyy' },
        title: { display: true, text: 'Date' }
      },
      y: {
        title: { display: true, text: 'Cumulative Payout ($)' }
      }
    }
  }
});

// Listener: Current Ticket
onValue(ref(db, 'currentTicket'), snapshot => {
  clear(currentBody);
  clear(statsBody);
  Object.keys(playerStats).forEach(k => delete playerStats[k]);

  const t = snapshot.val();
  if (!t) return;

  const dateStr = new Date(t.date).toLocaleDateString();
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${t.weekLabel}</td>
    <td>${t.league}</td>
    <td>${t.season}</td>
    <td>${dateStr}</td>
    ${t.picks.map(p => `<td class="${p.status}">${p.selection} (${p.odds})</td>`).join('')}
    <td>${t.totalOdds}</td>
    <td>$${t.payout}</td>
    <td>${t.notes || ''}</td>
  `;
  currentBody.appendChild(row);
  processPicks(t.picks);
  renderStats();
});

// Listener: Past Tickets & Chart Update
onValue(ref(db, 'pastTickets'), snapshot => {
  clear(pastBody);
  clear(statsBody);
  Object.keys(playerStats).forEach(k => delete playerStats[k]);

  const tickets = (snapshot.val() || []).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Table and Stats
  tickets.forEach(t => {
    const dateStr = new Date(t.date).toLocaleDateString();
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${t.weekLabel}</td>
      <td>${t.league}</td>
      <td>${t.season}</td>
      <td>${dateStr}</td>
      ${t.picks.map(p => `<td class="${p.status}">${p.selection} (${p.odds})</td>`).join('')}
      <td>${t.totalOdds}</td>
      <td>$${t.payout}</td>
      <td>${t.notes || ''}</td>
    `;
    pastBody.appendChild(row);
    processPicks(t.picks);
  });
  renderStats();

  // Update header progress bar
  const totalPaid = tickets.reduce((sum, t) => sum + t.payout, 0);
  const pctBar = Math.min((totalPaid / 5000) * 100, 100);
  document.getElementById('header-progress-bar').style.width = pctBar + '%';
  document.getElementById('header-progress-text').textContent = `$${totalPaid} / $5000`;

  // Chart data: cumulative payouts
  let runningTotal = 0;
  const dates = [];
  const cumulative = tickets.map(t => {
    dates.push(new Date(t.date));
    return runningTotal += t.payout;
  });
  const goalLine = tickets.map((_, i) => 15 * (i + 1));

  progressChart.data.labels           = dates;
  progressChart.data.datasets[0].data = goalLine;
  progressChart.data.datasets[1].data = cumulative;
  progressChart.update();
});