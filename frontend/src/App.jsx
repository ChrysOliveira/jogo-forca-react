import { useEffect } from 'react';

import { SocketProvider, useSocket } from './context/SocketContext';
import { GameProvider, useGame, GAME_STATES } from './context/GameContext';

import InitialScreen from './components/InitialScreen';
import LobbyScreen from './components/LobbyScreen';
import CountdownScreen from './components/CountdownScreen';
import QuestionScreen from './components/QuestionScreen';
import QuestionResultsScreen from './components/QuestionResultsScreen';
import GameOverScreen from './components/GameOverScreen';

import './App.css';

const GameContent = () => {
  const { gameState, error } = useGame();
  const { connected } = useSocket();

  /* Renderiza o conteúdo com base no estado do jogo
   * O estado do jogo é gerenciado pelo contexto GameContext
   * O conteúdo renderizado depende do estado atual do jogo
   * e é feito através de um switch case que verifica o valor de gameState
   * e retorna o componente correspondente a cada estado
   * Os componentes correspondentes a cada estado do jogo são:
   * - InitialScreen: Tela inicial do jogo
   * - LobbyScreen: Tela de lobby do jogo
   * - CountdownScreen: Tela de contagem regressiva do jogo
   * - QuestionScreen: Tela de perguntas do jogo
   * - QuestionResultsScreen: Tela de resultados das perguntas do jogo
   * - GameOverScreen: Tela de fim de jogo
   */
  const renderContent = () => {
    switch (gameState) {
      case GAME_STATES.INITIAL:
        return <InitialScreen />;
      case GAME_STATES.LOBBY:
        return <LobbyScreen />;
      case GAME_STATES.COUNTDOWN:
        return <CountdownScreen />;
      case GAME_STATES.QUESTION:
        return <QuestionScreen />;
      case GAME_STATES.QUESTION_RESULTS:
        return <QuestionResultsScreen />;
      case GAME_STATES.GAME_OVER:
        return <GameOverScreen />;
      default:
        return <InitialScreen />;
    }
  };

  // Exibe um alerta em caso de erro
  useEffect(() => {
    if (error) {
      alert(`Erro: ${error}`);
    }
  }, [error]);

  //Log status da conexão
  useEffect(() => {
    console.log('Status da conexão:', connected ? 'Conectado' : 'Desconectado');
  }, [connected]);

  return renderContent();
};

function App() {
  return (
    <SocketProvider>
      <GameProvider>
        <GameContent />
      </GameProvider>
    </SocketProvider>
  );
}

export default App;
