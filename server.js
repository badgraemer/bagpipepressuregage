const express = require('express');
const app = express();
const cors = require('cors')
const server = require('http').createServer(app);
const mqtt = require('mqtt'); // Correct require statement

const PORT = 5000;
const MQTT_BROKER = 'mqtt://localhost:1883';

// Create an MQTT client
const mqttClient = mqtt.connect(MQTT_BROKER); // Correct method to connect

app.get('/sse', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    // Subscribe to MQTT topics
    mqttClient.subscribe('bagpipes/p1');
    mqttClient.subscribe('bagpipes/p2');

    // Handle incoming MQTT messages
    const onMessage = (topic, message) => {
        // Forward MQTT messages to SSE clients
        res.write(`data: ${JSON.stringify({ topic: topic.toString(), message: message.toString() })}\n\n`);
    };

    mqttClient.on('message', onMessage);

    // Cleanup on client disconnect
    req.on('close', () => {
        mqttClient.removeListener('message', onMessage);
    });
});

// Serve static files
app.use(cors());
app.use(express.static('public'));

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
