import { database, ref, onValue } from './firebase.js';  // Importing the Firebase database methods

const ticketTable = document.getElementById('current-ticket').querySelector('tbody');
const pastWeeksTable = document.getElementById('past-weeks').querySelector('tbody');

// Fetch current ticket
onValue(ref(database, '/currentTicket'), (snapshot) => {
    const currentTicket = snapshot.val();
    if (currentTicket) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${currentTicket.sport}</td>
            <td>${currentTicket.week}</td>
            ${currentTicket.picks.map(pick => `<td class="${pick.status}">${pick.pick}</td>`).join('')}
            <td>$${currentTicket.payout}</td>
        `;
        ticketTable.appendChild(row);
    }
});

// Fetch past tickets
onValue(ref(database, '/pastTickets'), (snapshot) => {
    const pastTickets = snapshot.val() || [];
    pastWeeksTable.innerHTML = '';
    pastTickets.forEach(ticket => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ticket.sport}</td>
            <td>${ticket.week}</td>
            ${ticket.picks.map(pick => `<td class="${pick.status}">${pick.pick}</td>`).join('')}
            <td>$${ticket.payout}</td>
        `;
        pastWeeksTable.appendChild(row);
    });
});
