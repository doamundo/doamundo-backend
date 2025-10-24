import express from 'express';
import { Request, Response } from 'express';
import PouchDB from 'pouchdb-node';
import dotenv from 'dotenv';
import cors from 'cors';
import purchaseRoutes from './routes/purchaseRoutes';
import userRoutes from './routes/userRoutes';
import planRoutes from './routes/planRoutes';
import http from "http";
import { WebSocketServer, WebSocket } from "ws";

// Configurações
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const server = http.createServer(app);

// WebSocket no caminho /chat
const wss = new WebSocketServer({ server, path: "/chat" });

wss.on("connection", (ws: WebSocket) => {
    console.log("Cliente conectado no /chat");

    ws.on("message", (msg: string) => {
        const jsonString = Buffer.isBuffer(msg) ? msg.toString('utf8') : msg;
        try {
            const json = JSON.parse(jsonString);
            console.log("Mensagem recebida (JSON):", json);
        } catch (e) {
            console.log("Mensagem recebida (não JSON):", jsonString);
        }

        // responder só para o cliente
        //ws.send(`${msg}`);

        // ou mandar broadcast
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(`${msg}`);
            }
        });
    });

    ws.on("close", () => {
        console.log("Cliente desconectado");
    });
});

// Use User routes
app.use('/user', userRoutes);

// Use Purchase routes
app.use('/purchase', purchaseRoutes);

// Use Plan routes
app.use('/plan', planRoutes);

//Servir arquivos
app.use('/uploads', express.static('uploads'));

// Inicia o servidor
server.listen(port, () => {
    console.log(`🚀 Servidor rodando em http://127.0.0.1:${port}`);
    console.log(`WebSocket em ws://localhost:${port}/chat`);
});
