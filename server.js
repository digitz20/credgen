const express = require('express');
const bodyParser = require('body-parser');
const { runNetworkScan } = require('./credential_generator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Credential Generator API is running. Use /scan to start a scan.');
});

app.post('/scan', async (req, res) => {
    const { startIp, endIp } = req.body;
    if (!startIp || !endIp) {
        return res.status(400).json({ error: 'Both startIp and endIp are required.' });
    }
    res.status(202).json({ message: `Scan initiated for IP range ${startIp} to ${endIp}. Check server logs for progress.` });
    (async () => {
        try {
            console.log(`API triggered scan for ${startIp} to ${endIp}`);
            await runNetworkScan(startIp, endIp);
            console.log(`Scan completed for ${startIp} to ${endIp}`);
        } catch (error) {
            console.error(`Error during scan for ${startIp} to ${endIp}:`, error);
        }
    })();
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Define the IP ranges to scan
    const ipRanges = [
        { startIp: '192.168.1.1', endIp: '192.168.1.254', description: 'common local network range (/24 subnet)' },
        { startIp: '192.168.1.100', endIp: '192.168.1.100', description: 'single IP address' },
        { startIp: '192.168.0.1', endIp: '192.168.255.254', description: 'wider range (/16 subnet - WARNING: very long!)' },
        { startIp: '1.0.0.0', endIp: '223.255.255.255', description: 'entire IPv4 public address space (CRITICAL WARNING: EXTREMELY long!)' },
        { startIp: '127.0.0.1', endIp: '127.0.0.1', description: 'localhost' }
    ];

    // Fisher-Yates (Knuth) shuffle algorithm
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
    }

    // Automatically start scans for various IP ranges
    (async () => {
        try {
            console.log(`Automatically initiating scans...`);

            shuffleArray(ipRanges); // Shuffle the IP ranges

            for (const range of ipRanges) {
                console.log(`Initiating scan for ${range.startIp} to ${range.endIp} (${range.description})`);
                await runNetworkScan(range.startIp, range.endIp);
            }

            console.log(`All automatic scans initiated.`);
        } catch (error) {
            console.error(`Error during automatic scan initiation:`, error);
        }
    })();
});