const ctx = document.getElementById('pressureChart').getContext('2d');

const chart = new Chart(ctx, {
    type: 'line',
    data: {
        datasets: [{
            label: 'Pressure 1',
            data: [],
            borderColor: 'rgb(200, 25, 25)',
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
        elements: {
            line: {
                borderWidth: 5
            }
        },
        plugins: {
            legend: {
                display: true
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

let dataCounter = 0;
let startTime = Date.now();

const throttledUpdate = throttle(() => chart.update('none'), 100);

// MQTT WebSocket Client setup
const client = mqtt.connect('ws://10.28.10.86:8080');

client.on('connect', () => {
    console.log('Connected to MQTT Broker');
    client.subscribe('bagpipes/p1', (err) => {
        if (err) console.error('Error subscribing to bagpipes/p1:', err);
        else console.log('Subscribed to bagpipes/p1');
    });
    client.subscribe('bagpipes/p2', (err) => {
        if (err) console.error('Error subscribing to bagpipes/p2:', err);
        else console.log('Subscribed to bagpipes/p2');
    });
});

client.on('message', (topic, message) => {
    try {
        // Since the message format is now known to be {"p": 9} for both topics, we can directly parse it
        const mqttData = JSON.parse(message.toString());
        console.log('Received MQTT data for topic', topic, ':', mqttData); 

        const value = parseFloat(mqttData.p);

        if (!isNaN(value)) {
            const elapsedTime = (Date.now() - startTime) / 1000;
            // Determine which dataset to update based on the topic
            const datasetIndex = topic === 'bagpipes/p1' ? 0 : 1;
            chart.data.datasets[datasetIndex].data.push({x: elapsedTime, y: value});

            const maxDataPoints = 5000;
            chart.data.datasets.forEach(dataset => {
                if (dataset.data.length > maxDataPoints) {
                    dataset.data.shift();
                }
            });

            const timeWindow = 2; 
            chart.options.scales.x.min = elapsedTime - timeWindow;
            chart.options.scales.x.max = elapsedTime;
            throttledUpdate();
            console.log('Chart updated with value:', value, 'for topic:', topic);
        } else {
            console.error('Received invalid value for topic', topic, ':', mqttData.p);
        }
    } catch (e) {
        console.error('Error parsing message for topic', topic, ':', e);
    }
});

client.on('error', (err) => {
    console.error('MQTT Error:', err);
});
