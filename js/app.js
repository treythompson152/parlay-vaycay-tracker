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
const pastBody = document.getElementById('past-weeks').querySelector('tbody');
const statsBody = document.getElementById('player-stats').querySelector('tbody');

// Stats accumulator
const playerStats = {};

// Helpers
function clear(elem) { elem.innerHTML = ''; }

function processPicks(picks) {
  picks.forEach(pick => {
    const { player, status, odds } = pick;
    const numericOdds = parseInt(odds, 10);
    if (!playerStats[player]) {
      playerStats[player] = { hits: 0, misses: 0, oddsSum: 0, count: 0 };
    }
    playerStats[player].count++;
    playerStats[player].oddsSum += numericOdds;
    if (status === 'hit') playerStats[player].hits++;
    if (status === 'miss') playerStats[player].misses++;
  });
}

function renderStats() {
  clear(statsBody);
  Object.entries(playerStats).forEach(([player, data]) => {
    const avgOdds = Math.round(data.oddsSum / data.count);
    const formattedOdds = (avgOdds >= 0 ? '+' : '') + avgOdds;
    const pct = ((data.hits / data.count) * 100).toFixed(2) + '%';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${player}</td>
      <td>${data.hits}</td>
      <td>${data.misses}</td>
      <td>${formattedOdds}</td>
      <td>${pct}</td>
    `;
    statsBody.appendChild(row);
  });
}

// Listeners
onValue(ref(db, 'currentTicket'), snapshot => {
  clear(currentBody);
  clear(statsBody);
  Object.keys(playerStats).forEach(k => delete playerStats[k]);

  const t = snapshot.val();
  if (!t) return;

  const row = document.createElement('tr');
  const date = new Date(t.date).toLocaleDateString();
  row.innerHTML = `
    <td>${t.weekLabel}</td>
    <td>${t.league}</td>
    <td>${t.season}</td>
    <td>${date}</td>
    ${t.picks.map(p => `<td class="${p.status}">${p.selection} (${p.odds})</td>`).join('')}
    <td>${t.totalOdds}</td>
    <td>$${t.payout}</td>
    <td>${t.notes || ''}</td>
  `;
  currentBody.appendChild(row);
  processPicks(t.picks);
  renderStats();
});

onValue(ref(db, 'pastTickets'), snapshot => {
  clear(pastBody);
  clear(statsBody);
  Object.keys(playerStats).forEach(k => delete playerStats[k]);

  const tickets = snapshot.val() || [];
  tickets.forEach(t => {
    const row = document.createElement('tr');
    const date = new Date(t.date).toLocaleDateString();
    row.innerHTML = `
      <td>${t.weekLabel}</td>
      <td>${t.league}</td>
      <td>${t.season}</td>
      <td>${date}</td>
      ${t.picks.map(p => `<td class="${p.status}">${p.selection} (${p.odds})</td>`).join('')}
      <td>${t.totalOdds}</td>
      <td>$${t.payout}</td>
      <td>${t.notes || ''}</td>
    `;
    pastBody.appendChild(row);
    processPicks(t.picks);
  });
  renderStats();
  
// Progress bar code
// Sum all past payouts
const totalPayout = tickets.reduce((sum, t) => sum + t.payout, 0);

// Update bar width (capped at 100%)
const pct = Math.min((totalPayout / 5000) * 100, 100);
document.getElementById('header-progress-bar').style.width = pct + '%';

// Update the text
document.getElementById('header-progress-text').textContent = 
  `$${totalPayout} / $5000`;
});

// Chart.js setup
const ctx = document.getElementById('progress-chart').getContext('2d');
const weeks = [1, 2, 3, 4, 5];
const outcomes = [100, 250, 300, 450, 500];
const goalLine = weeks.map(w => 15 * w);

new Chart(ctx, {
  type: 'line',
  data: {
    labels: weeks,
    datasets: [
      { label: 'Goal ($15 per week)', data: goalLine, borderColor: 'blue', fill: false },
      { label: 'Total Outcomes', data: outcomes, borderColor: 'green', fill: false }
    ]
  },
  options: { responsive: true }
});