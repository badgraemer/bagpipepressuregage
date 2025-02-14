const ctx = document.getElementById('pressureChart').getContext('2d');

document.addEventListener('DOMContentLoaded', function() {
    const testElement = document.createElement('p');
    testElement.textContent = 'Test: This should appear if JavaScript is working';
    document.body.appendChild(testElement);
});

const chart = new Chart(ctx, {
    type: 'line',
    data: {
        datasets: [{
            label: 'Pressure 1',
            data: [],
            borderColor: 'rgb(25, 200, 25)',
            tension: 0.1,
            fill: false,
            pointRadius: 0,
            borderWidth: 5,
        }, {
            label: 'Pressure 2',
            data: [],
            borderColor: 'rgb(25, 25, 200)',
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
                min: 0,
                max: 3,
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
        maintainAspectRatio: false,
        responsive: true
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

let dataCounter = 0;
let startTime = Date.now();

const throttledUpdate = throttle(() => chart.update('none'), 50);

// SSE Connection
const eventSource = new EventSource('/sse');

eventSource.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        console.log('Received data:', data); 

        const elapsedTime = (Date.now() - startTime) / 1000;
        
        // Parse the nested JSON string to get the 'p' value
        const messageData = JSON.parse(data.message);
        const value = parseFloat(messageData.p);

// Inside onmessage handler
const dataList = document.getElementById('dataList');

        if (!isNaN(value)) {

const listItem = document.createElement('li');
    listItem.textContent = `Time: ${elapsedTime.toFixed(2)}, Pressure: ${value.toFixed(2)}`;
    dataList.appendChild(listItem);

            // Determine which dataset to update based on the topic
            const datasetIndex = data.topic === 'bagpipes/p1' ? 0 : 1;
            chart.data.datasets[datasetIndex].data.push({x: elapsedTime, y: value});

            const maxDataPoints = 10000;
            chart.data.datasets.forEach(dataset => {
                if (dataset.data.length > maxDataPoints) {
                    dataset.data.shift();
                }
            });

            const timeWindow = 2; 
            chart.options.scales.x.min = elapsedTime - timeWindow;
            chart.options.scales.x.max = elapsedTime;
            throttledUpdate();
        } else {
            console.error('Received invalid value:', messageData.p);
        }
    } catch (e) {
        console.error('Error parsing data:', e);
    }
};

eventSource.onerror = (error) => {
    console.error('SSE Error:', error);
};

eventSource.onopen = () => {
    console.log('SSE Connection Opened');
};
