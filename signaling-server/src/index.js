const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidV4 } = require('uuid');

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const rooms = {};

wss.on('connection', (ws) => {
    console.log('Cliente conectado.');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            const { type, roomId, payload } = data;

            switch (type) {
                case 'join':
                    joinRoom(ws, roomId);
                    break;
                case 'offer':
                case 'answer':
                case 'ice-candidate':
                    forwardMessage(ws, roomId, type, payload);
                    break;
                case 'leave':
                    leaveRoom(ws, roomId);
                    break;
                default:
                    console.log('Unknown message type:', type);
            }
        } catch (err) {
            console.error('Error handling message:', err);
        }
    });

    ws.on('close', () => {
        console.log('Cliente Desconectado.');
        leaveAllRooms(ws);
    });
});

function joinRoom(ws, roomId) {
    if (!rooms[roomId]) {
        rooms[roomId] = [];
    }
    rooms[roomId].push(ws);
    console.log(`Client joined room: ${roomId}`);

    ws.send(JSON.stringify({ type: 'joined', payload: { roomId } }));

    rooms[roomId].forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'new-peer' }));
        }
    });
}

function forwardMessage(ws, roomId, type, payload) {
    const clients = rooms[roomId] || [];
    clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type, payload }));
        }
    });
}

function leaveRoom(ws, roomId) {
    if (!rooms[roomId]) return;
    rooms[roomId] = rooms[roomId].filter(client => client !== ws);

    rooms[roomId].forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'peer-left' }));
        }
    });

    if (rooms[roomId].length === 0) {
        delete rooms[roomId];
    }
}

function leaveAllRooms(ws) {
    for (const roomId in rooms) {
        leaveRoom(ws, roomId);
    }
}

app.get('/', (req, res) => {
    res.send('Signaling server is running.');
});
server.listen(PORT, () => {
    console.log(`Signaling server listening on http://localhost:${PORT}`);
});


