//SocketManager.js - Gerencia conexões e eventos de socket
import Game from '../models/Game.js';

class SocketManager {
  constructor(io, databaseManager) {
    this.io = io;
    this.databaseManager = databaseManager;
    this.activeGames = new Map();
    this.socketToGameMap = new Map();
    
    this.setupSocketEvents();
  }

  //Configurar eventos de socket
  setupSocketEvents() {
    this.io.on('connection', (socket) => {
      console.log('Usuário conectado:', socket.id);

      //Usuário entra no lobby
      socket.on('join_lobby', (data) => this.handleJoinLobby(socket, data));
      
      //Líder inicia o jogo
      socket.on('start_game', () => this.handleStartGame(socket));

      //Usuário envia resposta
      socket.on('submit_answer', (data) => this.handleSubmitAnswer(socket, data));
      
      //Desconexão
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  //Tratamento do evento 'join_lobby'
  async handleJoinLobby(socket, { playerName }) {
    try {
      let gameId;
      let game;
      let isLeader = false;

      //Procurar por um jogo existente que ainda não começou
      for (const [id, existingGame] of this.activeGames.entries()) {
        if (!existingGame.started) {
          gameId = id;
          game = existingGame;
          break;
        }
      }

      //Se nenhum jogo ativo for encontrado, criar um novo
      if (!gameId) {
        gameId = await this.databaseManager.createGame();
        //Primeiro jogador torna-se o líder
        isLeader = true;
        
        game = new Game(gameId, this.databaseManager.getDatabase());
        this.activeGames.set(gameId, game);
      }

      //Adicionar jogador ao jogo
      const player = await game.addPlayer(socket.id, playerName, isLeader);
      
      //Mapear o ID do socket ao ID do jogo para consulta rápida
      this.socketToGameMap.set(socket.id, gameId);
      
      //Entrar na sala do jogo
      socket.join(`game:${gameId}`);
      
      //Enviar lista atualizada de jogadores para todos no lobby
      this.io.to(`game:${gameId}`).emit('lobby_update', {
        players: game.getPlayersJSON(),
        gameId
      });
      
    } catch (error) {
      console.error('Error ao entrar no lobby:', error);
      socket.emit('error', { message: 'Erro ao entrar no lobby' });
    }
  }

  //Tratamento do evento 'start_game'
  async handleStartGame(socket) {
    try {
      const gameId = this.socketToGameMap.get(socket.id);
      
      if (!gameId) {
        socket.emit('error', { message: 'Você não faz parte de nenhum jogo' });
        return;
      }
      
      const game = this.activeGames.get(gameId);
      
      if (!game) {
        socket.emit('error', { message: 'Jogo não encontrado' });
        return;
      }

      //Verificar se o jogador é o líder
      if (!game.isPlayerLeader(socket.id)) {
        socket.emit('error', { message: 'Apenas o líder pode iniciar o jogo' });
        return;
      }
      
      //Buscar perguntas do banco de dados
      const questions = await this.databaseManager.getRandomQuestions(5);
      
      //Iniciar o jogo
      game.startGame(questions);
      
      //Iniciar a contagem regressiva
      this.io.to(`game:${gameId}`).emit('game_starting', { countdown: 3 });
      
      //Após a contagem regressiva, enviar a primeira pergunta
      setTimeout(() => {
        const questionData = game.startQuestion();
        
        this.io.to(`game:${gameId}`).emit('question', questionData);
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao iniciar o jogo:', error);
      socket.emit('error', { message: 'Erro ao iniciar o jogo' });
    }
  }

  //Tratamento do evento 'submit_answer'
  async handleSubmitAnswer(socket, { answer, questionId }) {
    try {
      const gameId = this.socketToGameMap.get(socket.id);
      
      if (!gameId) {
        socket.emit('error', { message: 'Você não faz parte de nenhum jogo' });
        return;
      }
      
      const game = this.activeGames.get(gameId);
      
      if (!game || !game.started) {
        socket.emit('error', { message: 'Jogo não encontrado ou não iniciado' });
        return;
      }

      //Registrar a resposta do jogador
      const result = await game.submitAnswer(socket, answer, questionId);
      
      if (result.error) {
        socket.emit('error', { message: result.error });
        return;
      }
      
      //Enviar confirmação ao jogador
      socket.emit('answer_received', { received: true });
      
      //Se todos os jogadores responderam, processar resultados
      if (result.allPlayersAnswered) {
        //Calcular pontuações
        const results = await game.calculateScores();
        
        //Enviar resultados da pergunta para todos os jogadores
        this.io.to(`game:${gameId}`).emit('question_results', {
          ...results,
          nextQuestionIn: 5 //segundos
        });
        
        //Passar para a próxima pergunta ou finalizar o jogo após um atraso
        setTimeout(() => {
          const nextQuestion = game.nextQuestion();
          
          if (nextQuestion) {
            //Próxima pergunta
            this.io.to(`game:${gameId}`).emit('question', nextQuestion);
          } else {
            //Jogo acabou, mostrar placar final
            this.handleGameOver(gameId, game);
          }
        }, 5000);
      }
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      socket.emit('error', { message: 'Erro ao enviar resposta' });
    }
  }

  //Lidar com o fim do jogo
  async handleGameOver(gameId, game) {
    try {
      const finalResult = await game.finishGame();
      
      this.io.to(`game:${gameId}`).emit('game_over', finalResult);
      
      //Remover o jogo após algum tempo para limpar memória
      setTimeout(() => {
        if (this.activeGames.has(gameId)) {
          //Limpar socketToGameMap para todos os jogadores deste jogo
          game.getPlayersJSON().forEach(player => {
            this.socketToGameMap.delete(player.socketId);
          });
          
          this.activeGames.delete(gameId);
        }
      }, 60000); //Remover após 1 minuto
    } catch (error) {
      console.error('Erro ao encerrar o jogo:', error);
    }
  }

  //Tratamento do evento 'disconnect'
  async handleDisconnect(socket) {
    try {
      console.log('User disconnected:', socket.id);
      
      const gameId = this.socketToGameMap.get(socket.id);
      
      if (gameId) {
        const game = this.activeGames.get(gameId);
        
        if (game) {
          //Remover jogador do jogo
          const players = await game.removePlayer(socket.id);
          
          //Se ainda há jogadores e o jogo não começou, atualizar o lobby
          if (players.length > 0) {
            if (!game.started) {
              this.io.to(`game:${gameId}`).emit('lobby_update', {
                players: game.getPlayersJSON(),
                gameId
              });
            }
          } else {
            //Se não há mais jogadores, remover o jogo
            this.activeGames.delete(gameId);
          }
        }
        
        //Remover o mapeamento de socket para jogo
        this.socketToGameMap.delete(socket.id);
      }
    } catch (error) {
      console.error('Erro ao lidar com desconexão:', error);
    }
  }
}

export default SocketManager;
