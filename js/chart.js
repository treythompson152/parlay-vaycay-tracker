const ctx = document.getElementById('progress-chart').getContext('2d');
const weeks = [1, 2, 3, 4, 5]; // Example weeks
const outcomes = [100, 250, 300, 450, 500]; // Example outcomes
const goalLine = weeks.map(week => 15 * week);

new Chart(ctx, {
    type: 'line',
    data: {
        labels: weeks,
        datasets: [
            {
                label: 'Goal ($15 per week)',
                data: goalLine,
                borderColor: 'blue',
                borderWidth: 2,
                fill: false
            },
            {
                label: 'Total Outcomes',
                data: outcomes,
                borderColor: 'green',
                borderWidth: 2,
                fill: false
            }
        ]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Weeks'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Total Payout ($)'
                }
            }
        }
    }
});
