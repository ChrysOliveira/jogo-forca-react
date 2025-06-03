import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    console.log('Inicializa conexão com o socket...');

    //Pode ser configurado por uma variável de ambiente ou um arquivo de configuração
    //Você pode mudar para o IP da sua máquina na rede local
    const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
    
    const socketConnection = io(SERVER_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    socketConnection.on('connect', () => {
      console.log('Socket conectado com sucesso ao servidor');
      setConnected(true);
    });

    socketConnection.on('disconnect', () => {
      console.log('Socket desconectado do servidor');
      setConnected(false);
    });

    socketConnection.on('connect_error', (error) => {
      console.error('Erro de conexão do socket:', error.message);
      setConnected(false);
    });

    //Definir o socket imediatamente para que esteja disponível no momento em que o usuário entrar
    setSocket(socketConnection);
    
    //Se já estiver conectado na criação, certificar que o estado reflete isso
    if (socketConnection.connected) {
      console.log('Socket já conectado na inicialização');
      setConnected(true);
    }

    return () => {
      console.log('Removendo conexão do socket...');
      socketConnection.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
