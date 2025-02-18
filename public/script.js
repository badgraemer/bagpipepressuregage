document.addEventListener('DOMContentLoaded', function() {
    const testElement = document.createElement('p');
    testElement.textContent = 'Test: This should appear if JavaScript is working';
    document.body.appendChild(testElement);

    // MQTT Client Setup
    const client = mqtt.connect('ws://10.42.0.1:8080'); // Adjust this URL as needed

    let startTime = new Date().getTime(); // Capture the start time once when the chart initializes
    let maxX = 0; // To keep track of the maximum x value for scrolling
    const scrollSpeedMultiplier = 2; // Adjust this to control scroll speed
    const chartWidthInMs = 10000; // Fixed width in milliseconds for the chart

    // Chart.js Configuration
    const ctx = document.getElementById('pressureChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Piper 1',
                data: [],
                borderColor: 'blue',
                fill: false,
                tension: 0.5,
                pointRadius: 0,
                pointHoverRadius: 0,
                borderWidth: 6
            }, {
                label: 'Piper 2',
                data: [],
                borderColor: 'green',
                fill: false,
                tension: 0.5,
                pointRadius: 0,
                pointHoverRadius: 0,
                borderWidth: 6
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    display: false,
                    min: 0,
                    max: chartWidthInMs // Set a fixed max to ensure consistent width
                },
                y: {
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Pressure'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Live Pressure Data'
                },
                legend: {
                    display: true
                }
            },
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            responsiveAnimationDuration: 1000
        }
    });

    // MQTT Subscription
    client.on('connect', () => {
        console.log('Connected to MQTT Broker');
        const topics = ['bagpipes/p1', 'bagpipes/p2']; // Initial topics
        
        topics.forEach((topic, index) => {
            client.subscribe(topic, (err) => {
                if (err) console.error('Error subscribing to', topic, ':', err);
                else {
                    console.log('Subscribed to', topic);
                }
            });
        });

        // Placeholder for additional topics up to 10
        for (let i = topics.length; i < 10; i++) {
            // You can dynamically add topics here if needed
            // For now, we'll leave them empty
        }
    });

    client.on('message', (topic, message) => {
        try {
            const mqttData = JSON.parse(message.toString());
            const value = parseFloat(mqttData.p);

            console.log('Received data for topic:', topic, 'Value:', value);

            if (!isNaN(value) && value >= 0 && value <= 100) {
                const seriesIndex = topic === 'bagpipes/p1' ? 0 : 1;
                const x = (new Date().getTime() - startTime); // Relative time since chart started
                
                // Update the dataset
                chart.data.datasets[seriesIndex].data.push({x: x, y: value});
                
                // Update maxX to keep track of the latest time
                maxX = Math.max(maxX, x);
                
                // Limit the dataset to manage performance
                while (chart.data.datasets[seriesIndex].data.length > 400) {
                    chart.data.datasets[seriesIndex].data.shift();
                }
                
                // Adjust the x-axis min to ensure data starts from the left
                let minX = Math.max(0, maxX - chartWidthInMs);
                chart.options.scales.x.min = minX;
                chart.options.scales.x.max = maxX;
                
                // Update the chart
                chart.update('none');
                console.log('Added point to series:', topic, 'Point:', {x: x, y: value});
            } else {
                console.error('Received invalid or out of range value for topic', topic, ':', value);
            }
        } catch (e) {
            console.error('Error parsing message for topic', topic, ':', e);
        }
    });

    client.on('error', (err) => {
        console.error('MQTT Error:', err);
    });
});
