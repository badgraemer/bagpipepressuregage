const express = require('express');
const app = express();
const cors = require('cors')
const server = require('http').createServer(app);

const PORT = 5000;

// Serve static files
app.use(cors());
app.use(express.static('public'));

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
