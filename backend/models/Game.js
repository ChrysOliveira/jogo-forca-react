//Gerencia o estado do jogo
import Player from './Player.js';

class Game {
  constructor(id, db) {
    this.id = id;
    this.players = [];
    this.started = false;
    this.currentQuestion = 0;
    this.questions = [];
    this.results = [];
    this.playerAnswers = [];
    this.questionStartTime = null;
    this.db = db; //Referência ao banco de dados
  }

  //Adicionar um jogador ao jogo
  async addPlayer(socketId, playerName, isLeader = false) {
    try {
      const playerResult = await this.db.run(
        'INSERT INTO players (socket_id, name, game_id, is_leader) VALUES (?, ?, ?, ?)',
        socketId, playerName, this.id, isLeader ? 1 : 0
      );
      
      const playerId = playerResult.lastID;
      const player = new Player(playerId, socketId, playerName, isLeader);
      this.players.push(player);
      
      return player;
    } catch (error) {
      console.error('Erro ao adicionar jogador ao jogo:', error);
      throw error;
    }
  }

  //Remover um jogador do jogo
  async removePlayer(socketId) {
    try {
      this.players = this.players.filter(p => p.socketId !== socketId);
      
      // Se o líder saiu, escolha um novo líder
      if (this.players.length > 0) {
        const hasLeader = this.players.some(p => p.isLeader);
        
        if (!hasLeader) {
          this.players[0].isLeader = true;
          
          // Atualizar no banco de dados
          await this.db.run(
            'UPDATE players SET is_leader = 1 WHERE id = ?',
            this.players[0].id
          );
        }
      }
      
      return this.players;
    } catch (error) {
      console.error('Erro ao remover jogador do jogo:', error);
      throw error;
    }
  }

  //Iniciar o jogo com as perguntas fornecidas
  startGame(questions) {
    this.questions = questions;
    this.started = true;
    this.currentQuestion = 0;
    this.results = [];
    return true;
  }

  //Obter a pergunta atual
  getCurrentQuestion() {
    if (!this.started || this.questions.length === 0) {
      return null;
    }
    
    const currentQ = this.questions[this.currentQuestion];
    
    //Retornar versão sem a resposta correta
    return {
      id: currentQ.id,
      question: currentQ.question,
      answers: currentQ.answers,
      questionNumber: this.currentQuestion + 1,
      totalQuestions: this.questions.length
    };
  }

  //Registrar resposta de um jogador
  async submitAnswer(socket, answer, questionId) {
    try {
      const currentQuestion = this.questions[this.currentQuestion];
      if (currentQuestion.id !== questionId) {
        return { error: 'ID de pergunta inválido' };
      }
      
      const player = this.players.find(p => p.socketId === socket.id);
      if (!player) {
        return { error: 'Jogador não encontrado no jogo' };
      }
      
      //Calcular tempo de resposta
      const responseTime = Date.now() - this.questionStartTime;
      
      //Verificar se a resposta está correta
      const isCorrect = answer === currentQuestion.correct_answer;
      
      //Salvar a resposta do jogador
      const playerAnswer = {
        playerId: player.id,
        playerName: player.name,
        answer,
        isCorrect,
        responseTime,
        points: 0 //Pontos serão atualizados depois
      };
      
      this.playerAnswers.push(playerAnswer);
        
      //Salvar a resposta no banco de dados
      await this.db.run(
        'INSERT INTO player_answers (player_id, question_id, answer, is_correct, response_time, points) VALUES (?, ?, ?, ?, ?, ?)',
        player.id, questionId, answer || '', isCorrect ? 1 : 0, responseTime, 0 
      );
      
      //Verificar se todos os jogadores responderam
      const allPlayersAnswered = this.playerAnswers.length === this.players.length;
      
      return { 
        received: true, 
        allPlayersAnswered 
      };
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      throw error;
    }
  }

  //Calcular pontuações quando todos responderam
  async calculateScores() {
    try {
      const currentQuestion = this.questions[this.currentQuestion];
      
      //Calcular pontos para respostas corretas
      //Ordenar por tempo de resposta (mais rápido recebe mais pontos)
      const correctAnswers = this.playerAnswers
        .filter(pa => pa.isCorrect)
        .sort((a, b) => a.responseTime - b.responseTime);
      
      //Atribuir pontos: 100 para o mais rápido, diminuindo 10 por posição
      correctAnswers.forEach(async (pa, index) => {
        const points = Math.max(100 - (index * 10), 10); // Mínimo de 10 pontos
        
        //Atualizar pontuação do jogador
        const player = this.players.find(p => p.id === pa.playerId);
        if (player) {
          player.addPoints(points);
        }
        
        //Atualizar pontos no registro de resposta
        pa.points = points;
        
        //Atualizar pontos no banco de dados
        await this.db.run(
          'UPDATE player_answers SET points = ? WHERE player_id = ? AND question_id = ?',
          points, pa.playerId, currentQuestion.id
        );
      });
      
      //Salvar os resultados para o placar final
      this.results.push({
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        correctAnswer: currentQuestion.correct_answer,
        playerAnswers: [...this.playerAnswers]
      });
      
      return {
        answers: this.playerAnswers,
        correctAnswer: currentQuestion.correct_answer
      };
    } catch (error) {
      console.error('Error calculating scores:', error);
      throw error;
    }
  }

  //Avançar para a próxima pergunta
  nextQuestion() {
    this.currentQuestion++;
    this.playerAnswers = [];
    this.questionStartTime = Date.now();
    
    //Verificar se ainda há perguntas
    if (this.currentQuestion < this.questions.length) {
      return this.getCurrentQuestion();
    }
    
    return null; //Não há mais perguntas, jogo acabou
  }

  //Finalizar o jogo e retornar resultados finais
  async finishGame() {
    try {
      //Atualizar jogo como finalizado no banco de dados
      await this.db.run(
        'UPDATE games SET finished_at = CURRENT_TIMESTAMP WHERE id = ?',
        this.id
      );
      
      //Atualizar pontuações dos jogadores no banco de dados
      for (const player of this.players) {
        await this.db.run(
          'UPDATE players SET score = ? WHERE id = ?',
          player.score, player.id
        );
      }
      
      const finalScores = this.players
        .map(p => ({ name: p.name, score: p.score }))
        .sort((a, b) => b.score - a.score);
      
      return {
        finalScores,
        detailedResults: this.results
      };
    } catch (error) {
      console.error('Error finishing game:', error);
      throw error;
    }
  }

  //Preparar jogo para começar a próxima questão
  startQuestion() {
    this.questionStartTime = Date.now();
    return this.getCurrentQuestion();
  }

  //Verificar se o usuário é líder
  isPlayerLeader(socketId) {
    const player = this.players.find(p => p.socketId === socketId);
    return player && player.isLeader;
  }

  //Obter todos os jogadores como objetos JSON
  getPlayersJSON() {
    return this.players.map(player => player.toJSON());
  }
}

export default Game;
