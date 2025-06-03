import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import DatabaseManager from './managers/DatabaseManager.js';
import SocketManager from './managers/SocketManager.js';


/*
* Inicializar servidor Express
* O servidor Express é responsável por gerenciar as requisições HTTP.
*/
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", //Permite acesso de qualquer origem
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: '*' //Permite acesso de qualquer origem
}));
app.use(express.json());

/*
 * Inicializar gerenciador de banco de dados e socket
 * O gerenciador de banco de dados é responsável por conectar ao banco de dados e executar consultas.
 * Ele deve ser inicializado antes de qualquer operação de banco de dados.
 * O gerenciador de socket é responsável por gerenciar as conexões WebSocket.
 * Ele deve ser inicializado após o banco de dados estar conectado.
 */
const databaseManager = new DatabaseManager();
let dbInitialized = false;

databaseManager.initialize()
  .then(() => {
    console.log("Database inicializada e conectada com sucesso!");
    dbInitialized = true;

    //Inicializar gerenciador de socket
    const socketManager = new SocketManager(io, databaseManager);
  })
  .catch(err => {
    console.error("Failed to initialize database:", err);
  });


const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor está rodando na porta ${PORT}`);
});

export { app, server };
