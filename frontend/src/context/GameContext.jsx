import { createContext, useContext, useReducer, useEffect } from 'react';
import { useSocket } from './SocketContext';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

/*
 * Estados do jogo
 * - INITIAL: Estado inicial, antes de entrar no lobby
 * - LOBBY: Lobby do jogo, onde os jogadores podem entrar
 * - COUNTDOWN: Contagem regressiva antes do início do jogo
 * - QUESTION: Estado em que uma pergunta é exibida
 * - QUESTION_RESULTS: Estado em que os resultados da pergunta são exibidos
 * - GAME_OVER: Estado em que o jogo termina
 */
export const GAME_STATES = {
  INITIAL: 'INITIAL',
  LOBBY: 'LOBBY',
  COUNTDOWN: 'COUNTDOWN',
  QUESTION: 'QUESTION',
  QUESTION_RESULTS: 'QUESTION_RESULTS',
  GAME_OVER: 'GAME_OVER',
};

//Estados iniciais
const initialState = {
  gameState: GAME_STATES.INITIAL,
  player: {
    name: '',
    isLeader: false,
  },
  gameId: null,
  players: [],
  currentQuestion: null,
  questionNumber: 0,
  totalQuestions: 0,
  countdown: 0,
  questionResults: null,
  finalScores: null,
  detailedResults: null,
  error: null,
};

//Ações do jogo
export const ACTIONS = {
  SET_PLAYER_NAME: 'SET_PLAYER_NAME',
  JOIN_LOBBY: 'JOIN_LOBBY', 
  UPDATE_LOBBY: 'UPDATE_LOBBY',
  START_COUNTDOWN: 'START_COUNTDOWN',
  UPDATE_COUNTDOWN: 'UPDATE_COUNTDOWN',
  SHOW_QUESTION: 'SHOW_QUESTION',
  SUBMIT_ANSWER: 'SUBMIT_ANSWER',
  SHOW_QUESTION_RESULTS: 'SHOW_QUESTION_RESULTS',
  GAME_OVER: 'GAME_OVER',
  SET_ERROR: 'SET_ERROR',
  RESET_GAME: 'RESET_GAME',
};

//Reducer
function gameReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_PLAYER_NAME:
      return {
        ...state,
        player: {
          ...state.player,
          name: action.payload,
        },
      };
    
    case ACTIONS.JOIN_LOBBY:
      return {
        ...state,
        gameState: GAME_STATES.LOBBY,
        player: {
          ...state.player,
          name: action.payload.playerName,
        },
      };
    
    case ACTIONS.UPDATE_LOBBY:
      //Verificar se este jogador está na lista de jogadores 
      //retornada pelo servidor
      const playerInList = action.payload.players.find(
        p => p.name === state.player.name
      );
      
      console.log('Lobby atualizado, jogadores:', action.payload.players);
      console.log('Nome do jogador atual:', state.player.name);
      console.log('Jogador encontrado na lista?', playerInList ? 'Sim' : 'Não');
      
      return {
        ...state,
        gameId: action.payload.gameId,
        players: action.payload.players,
        player: {
          ...state.player,
          id: playerInList?.id || state.player.id,
          isLeader: playerInList?.isLeader || false,
        },
      };

    case ACTIONS.START_COUNTDOWN:
      return {
        ...state,
        gameState: GAME_STATES.COUNTDOWN,
        countdown: action.payload.countdown,
      };

    case ACTIONS.UPDATE_COUNTDOWN:
      return {
        ...state,
        countdown: action.payload,
      };

    case ACTIONS.SHOW_QUESTION:
      return {
        ...state,
        gameState: GAME_STATES.QUESTION,
        currentQuestion: action.payload,
        questionNumber: action.payload.questionNumber,
        totalQuestions: action.payload.totalQuestions,
      };

    case ACTIONS.SUBMIT_ANSWER:
      return {
        ...state,
        currentQuestion: {
          ...state.currentQuestion,
          userAnswer: action.payload.answer,
        },
      };

    case ACTIONS.SHOW_QUESTION_RESULTS:
      return {
        ...state,
        gameState: GAME_STATES.QUESTION_RESULTS,
        questionResults: action.payload,
      };

    case ACTIONS.GAME_OVER:
      return {
        ...state,
        gameState: GAME_STATES.GAME_OVER,
        finalScores: action.payload.finalScores,
        detailedResults: action.payload.detailedResults,
      };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    case ACTIONS.RESET_GAME:
      return initialState;

    default:
      return state;
  }
}

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('lobby_update', (data) => {
      dispatch({
        type: ACTIONS.UPDATE_LOBBY,
        payload: data,
      });
    });

    socket.on('game_starting', (data) => {
      dispatch({
        type: ACTIONS.START_COUNTDOWN,
        payload: data,
      });

      //Logica para contagem regressiva
      //A contagem regressiva é iniciada quando o servidor envia o evento 'game_starting'
      //e o valor inicial é definido pelo servidor
      //O cliente irá atualizar o estado a cada segundo
      //e parar quando o valor chegar a 0
      let count = data.countdown;
      const countdownInterval = setInterval(() => {
        count--;
        dispatch({
          type: ACTIONS.UPDATE_COUNTDOWN,
          payload: count,
        });

        if (count <= 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);
    });

    socket.on('question', (data) => {
      dispatch({
        type: ACTIONS.SHOW_QUESTION,
        payload: data,
      });
    });
    
    socket.on('question_results', (data) => {
      dispatch({
        type: ACTIONS.SHOW_QUESTION_RESULTS,
        payload: data,
      });
    });

    socket.on('game_over', (data) => {
      dispatch({
        type: ACTIONS.GAME_OVER,
        payload: data,
      });
    });

    socket.on('error', (data) => {
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: data.message,
      });
    });

    return () => {
      socket.off('lobby_update');
      socket.off('game_starting');
      socket.off('question');
      socket.off('question_results');
      socket.off('game_over');
      socket.off('error');
    };
  }, [socket]);

  /*Funções para manipular o estado do jogo
   * - setPlayerName: Atualiza o nome do jogador no estado
   * - joinLobby: Entra no lobby do jogo
   * - startGame: Inicia o jogo
   * - submitAnswer: Envia a resposta do jogador
   * - resetGame: Reseta o estado do jogo
   * - setPlayerName: Atualiza o nome do jogador no estado
   * - joinLobby: Entra no lobby do jogo
   * - startGame: Inicia o jogo
   * - submitAnswer: Envia a resposta do jogador
   * - resetGame: Reseta o estado do jogo
  */
  const setPlayerName = (name) => {
    dispatch({
      type: ACTIONS.SET_PLAYER_NAME,
      payload: name,
    });
  };

  const joinLobby = (playerName) => {
    if (!socket) {
      console.error("Conexão do socket não estabelecida");
      return;
    }
    
    if (!socket.connected) {
      console.log("Socket não está conectado ainda, aguardando...");
      socket.on('connect', () => {
        console.log("Socket conectado, agora entrando no lobby");
        socket.emit('join_lobby', { playerName });
      });
    } else {
      console.log("Socket está conectado, entrando no lobby diretamente");
      socket.emit('join_lobby', { playerName });
    }
    
    dispatch({
      type: ACTIONS.JOIN_LOBBY,
      payload: { playerName },
    });
  };

  const startGame = () => {
    if (!socket || !socket.connected) {
      console.error("Conexão do socket não estabelecida ou não conectada");
      return;
    }
    socket.emit('start_game');
  };
  const submitAnswer = (answer, questionId) => {
    if (!socket) return;
    
    //Garantir que nunca enviamos null para o servidor
    const safeAnswer = answer || ''; 
    
    socket.emit('submit_answer', { answer: safeAnswer, questionId });
    dispatch({
      type: ACTIONS.SUBMIT_ANSWER,
      payload: { answer: safeAnswer },
    });
  };

  const resetGame = () => {
    dispatch({ type: ACTIONS.RESET_GAME });
  };

  return (
    <GameContext.Provider
      value={{
        ...state,
        setPlayerName,
        joinLobby,
        startGame,
        submitAnswer,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export default GameContext;
