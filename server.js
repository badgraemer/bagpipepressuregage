const express = require('express');
const WebSocket = require('ws');
const mqtt = require('mqtt');
const path = require('path');
const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

const MQTT_BROKER = 'mqtt://localhost'; // Adjust if your MQTT broker isn't on the same machine
const PORT = 5000;

const mqttClient = mqtt.connect(MQTT_BROKER);

mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
    mqttClient.subscribe('bagpipes/p1', (err) => {
        if (!err) {
            console.log('Subscribed to topic: bagpipes/p1');
        }
    });
});

mqttClient.on('message', (topic, message) => {
    console.log(`MQTT message received from topic ${topic}:`, message.toString());
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message.toString());
            console.log('Message sent to WebSocket client:', message.toString());
        }
    });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');
    
    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Error handling for MQTT client
mqttClient.on('error', (error) => {
    console.error('MQTT Error:', error);
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
