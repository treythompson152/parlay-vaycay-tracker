// CSV-driven Parlay Tracker (no Firebase)

// ====== DOM ======
const currentBody = document.getElementById('current-ticket').querySelector('tbody');
const pastBody    = document.getElementById('past-weeks').querySelector('tbody');
const statsBody   = document.getElementById('player-stats').querySelector('tbody');

const progressBar  = document.getElementById('header-progress-bar');
const progressText = document.getElementById('header-progress-text');

// ====== Chart ======
const ctx = document.getElementById('progress-chart').getContext('2d');
const progressChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label: 'Goal ($15/week)', data: [], borderColor: 'blue', fill: false, tension: 0 },
      { label: 'Cumulative Winnings', data: [], borderColor: 'green', fill: false, tension: 0 }
    ]
  },
  options: {
    responsive: true,
    scales: {
      x: { type: 'time', time: { unit: 'day', tooltipFormat: 'MMM dd, yyyy' }, title: { display: true, text: 'Date' } },
      y: { title: { display: true, text: 'Cumulative Payout ($)' } }
    }
  }
});

// ====== Player Stats Accumulator ======
const playerStats = {};
function resetStats() { for (const k of Object.keys(playerStats)) delete playerStats[k]; }

function parseAmericanOddsToInt(str) {
  if (str == null) return null;
  const s = String(str).trim();
  if (!s) return null;
  let n = s.replace('+','');
  if (!/^-?\d+$/.test(n)) return null;
  return parseInt(n, 10);
}

function processPicks(picks) {
  picks.forEach(({ player, status, odds }) => {
    const playerName = player || 'Unknown';
    if (!playerStats[playerName]) playerStats[playerName] = { hits: 0, misses: 0, oddsSum: 0, count: 0 };
    const st = playerStats[playerName];
    st.count++;
    const oddInt = parseAmericanOddsToInt(odds);
    if (oddInt !== null) st.oddsSum += oddInt;
    if (status === 'hit') st.hits++;
    if (status === 'miss') st.misses++;
  });
}

function renderStats() {
  statsBody.innerHTML = '';
  Object.entries(playerStats).forEach(([player, data]) => {
    const avg = data.count ? Math.round(data.oddsSum / data.count) : 0;
    const avgFmt = (avg >= 0 ? '+' : '') + avg;
    const pct = data.count ? ((data.hits / data.count) * 100).toFixed(2) + '%' : '0.00%';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${player}</td>
      <td>${data.hits}</td>
      <td>${data.misses}</td>
      <td>${avgFmt}</td>
      <td>${pct}</td>
    `;
    statsBody.appendChild(tr);
  });
}

// ====== Ticket helpers ======
function tdForPick(p) {
  const cls = p.status || 'pending';
  const txt = `${p.selection || ''}${p.odds ? ` (${p.odds})` : ''}`;
  return `<td class="${cls}">${txt || ''}</td>`;
}

function rowHtmlForTicket(t) {
  const d = t.date ? new Date(t.date) : null;
  const dateStr = d && !isNaN(d) ? d.toLocaleDateString() : (t.date || '');
  return `
    <td>${t.weekLabel || ''}</td>
    <td>${t.league || ''}</td>
    <td>${t.season || ''}</td>
    <td>${dateStr}</td>
    ${tdForPick(t.picks[0] || {})}
    ${tdForPick(t.picks[1] || {})}
    ${tdForPick(t.picks[2] || {})}
    <td>${t.totalOdds || ''}</td>
    <td>$${(t.payout ?? '')}</td>
    <td>${t.notes || ''}</td>
  `;
}

function normalizeTicket(row) {
  // expected CSV headers:
  // ticketId,weekNumber,weekLabel,league,season,date,totalOdds,payout,notes,
  // p1_player,p1_selection,p1_status,p1_odds,
  // p2_player,p2_selection,p2_status,p2_odds,
  // p3_player,p3_selection,p3_status,p3_odds
  const get = (k) => row[k] ?? row[k?.toLowerCase()] ?? '';

  const t = {
    ticketId: get('ticketId'),
    weekNumber: Number(get('weekNumber') || 0),
    weekLabel: get('weekLabel'),
    league: get('league'),
    season: get('season'),
    date: get('date'),
    totalOdds: get('totalOdds'),
    payout: Number(get('payout') || 0),
    notes: get('notes'),
    picks: [
      { player: get('p1_player'), selection: get('p1_selection'), status: (get('p1_status') || 'pending').toLowerCase(), odds: get('p1_odds') },
      { player: get('p2_player'), selection: get('p2_selection'), status: (get('p2_status') || 'pending').toLowerCase(), odds: get('p2_odds') },
      { player: get('p3_player'), selection: get('p3_selection'), status: (get('p3_status') || 'pending').toLowerCase(), odds: get('p3_odds') }
    ]
  };
  // Coerce statuses to the enum set
  t.picks.forEach(p => {
    const s = (p.status || '').toLowerCase();
    if (!['hit','miss','pending'].includes(s)) p.status = 'pending';
  });
  return t;
}

// ====== Rendering main sections ======
function renderAll(currentTicket, pastTickets) {
  // Current
  currentBody.innerHTML = '';
  if (currentTicket) {
    const tr = document.createElement('tr');
    tr.innerHTML = rowHtmlForTicket(currentTicket);
    currentBody.appendChild(tr);
  }

  // Past (sorted by date)
  pastBody.innerHTML = '';
  const sortedPast = [...(pastTickets || [])].sort((a,b) => new Date(a.date) - new Date(b.date));
  sortedPast.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = rowHtmlForTicket(t);
    pastBody.appendChild(tr);
  });

  // Stats
  resetStats();
  if (currentTicket) processPicks(currentTicket.picks);
  sortedPast.forEach(t => processPicks(t.picks));
  renderStats();

  // ---- Progress bar total ----
  // Base total is sum of past payouts
  let total = sortedPast.reduce((s, t) => s + (Number(t.payout) || 0), 0);

  // If current ticket's 3 picks are all 'hit', include its payout
  const allCurrentHit =
    currentTicket &&
    Array.isArray(currentTicket.picks) &&
    currentTicket.picks.length === 3 &&
    currentTicket.picks.every(p => (p.status || '').toLowerCase() === 'hit');

  if (allCurrentHit) {
    total += (Number(currentTicket.payout) || 0);
  }

  const pct = Math.min((total / 5000) * 100, 100);
  progressBar.style.width = pct + '%';
  progressText.textContent = `$${total} / $5000`;

// ---- Chart (cumulative from 0) ----
let running = 0;
const labels = [];
const cumulative = [];

// Always graph past tickets first (sorted)
sortedPast.forEach(t => {
  const dt = new Date(t.date);
  labels.push(dt);
  running += (Number(t.payout) || 0);
  cumulative.push(running);
});

// If current ticket is a 3/3 hit, include it as the next point
const allCurrentHitChart =
  currentTicket &&
  Array.isArray(currentTicket.picks) &&
  currentTicket.picks.length === 3 &&
  currentTicket.picks.every(p => (p.status || '').toLowerCase() === 'hit');

if (allCurrentHitChart) {
  // Prefer current ticket's date; if missing/invalid, place it 1 day after the last label
  let curDate = currentTicket.date ? new Date(currentTicket.date) : null;
  if (!curDate || isNaN(curDate)) {
    curDate = labels.length ? new Date(labels[labels.length - 1].getTime() + 24 * 3600 * 1000) : new Date();
  }
  labels.push(curDate);
  running += (Number(currentTicket.payout) || 0);
  cumulative.push(running);
}

// Goal line: $15 per point, same length as labels
const goalLine = labels.map((_, i) => 15 * (i + 1));

progressChart.data.labels = labels;
progressChart.data.datasets[0].data = goalLine;
progressChart.data.datasets[1].data = cumulative;
progressChart.update();
}

// ====== CSV Loading (always from repo on load) ======
function handleCsvText(csvText) {
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  if (parsed.errors?.length) {
    console.error(parsed.errors);
    alert('CSV parse error. Check console for details.');
    return;
  }
  const rows = parsed.data || [];
  if (!rows.length) {
    alert('CSV appears empty.');
    return;
  }

  // First row -> current, rest -> past
  const current = normalizeTicket(rows[0]);
  const past = rows.slice(1).map(normalizeTicket);

  renderAll(current, past);
}

// Auto-load the CSV from the repo path on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('./data/tickets.csv', { cache: 'no-store' });
    if (!res.ok) throw new Error('tickets.csv not found');
    const text = await res.text();
    handleCsvText(text);
  } catch (err) {
    console.error(err);
    alert('Could not fetch ./data/tickets.csv — make sure it exists in /data/');
  }
});