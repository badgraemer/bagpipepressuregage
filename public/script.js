const ctx = document.getElementById('pressureChart').getContext('2d');

const chart = new Chart(ctx, {
    type: 'line',
    data: {
        datasets: [{
            label: 'Pressure',
            data: [], // This will hold the y-values
            borderColor: 'rgb(200, 25, 25)',
            tension: 0.1,
            fill: false,
            pointRadius: 0,
            borderWidth: 5,
        }]
    },
    options: {
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                title: {
                    display: true,
                    text: 'Time (in seconds)'
                },
                // Set min and max for x-axis to simulate scrolling
                min: 0,
                max: 3, // Adjust this to control how much history you want to show
                // Reverse the x-axis to make it scroll from right to left
                reverse: false,
            },
            y: {
                beginAtZero: true,
                min: 0,
                max: 100,
                title: {
                    display: true,
                    text: 'Pressure'
                }
            }
        },
        animation: false,
        elements: {
            line: {
                borderWidth: 5
            }
        },
        plugins: {
            legend: {
                display: false
            }
        },
        maintainAspectRatio: false,
        responsive: true,
        layout: {
            padding: {
                left: 10,
                right: 10,
                top: 10,
                bottom: 10
            }
        }
    }
});

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

const socket = new WebSocket('ws://' + window.location.hostname + ':5000');

let dataCounter = 0; // To keep track of time
let startTime = Date.now(); // To calculate elapsed time

const throttledUpdate = throttle(() => chart.update('none'), 100); // Throttle to 100ms

socket.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        console.log('Received data:', data); 

        // Calculate elapsed time in seconds
        const elapsedTime = (Date.now() - startTime) / 1000;

        // Add new data point with time as x and pressure as y
        chart.data.datasets[0].data.push({x: elapsedTime, y: data.p});

        // Limit the number of data points for performance
        const maxDataPoints = 5000; // Adjust based on performance needs
        if (chart.data.datasets[0].data.length > maxDataPoints) {
            chart.data.datasets[0].data.shift();
        }

        // Update x-axis to simulate scrolling
        const timeWindow = 2; // Time window in seconds to show on the chart
        chart.options.scales.x.min = elapsedTime - timeWindow;
        chart.options.scales.x.max = elapsedTime;

        // Use the throttled function to update the chart
        throttledUpdate();

        // Update the chart
      //    chart.update('none');

    } catch (e) {
        console.error('Error parsing data:', e);
    }
};

socket.onopen = () => console.log('WebSocket Connection Established');
socket.onclose = () => console.log('WebSocket Connection Closed');
socket.onerror = (error) => console.log('WebSocket Error:', error);
