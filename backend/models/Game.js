//Gerencia o estado do jogo
import Player from './Player.js';

class Game {
  constructor(id, db) {
    this.id = id;
    this.players = [];
    this.started = false;
    this.currentRound = 0;
    this.words = [];
    this.roundWinners = [];
    this.guessedLetters = new Set();
    this.wrongGuesses = 0;
    this.maxWrong = 6;
    this.db = db;
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

  //Iniciar o jogo com as palavras fornecidas
  startGame(words) {
    this.words = words;
    this.started = true;
    this.currentRound = 0;
    this.roundWinners = [];
    this._initRound();
    return true;
  }

  _initRound() {
    this.guessedLetters.clear();
    this.wrongGuesses = 0;
  }

  getCurrentState() {
    if (!this.started || !this.words[this.currentRound]) return null;

    const { palavra, dica, categoria } = this.words[this.currentRound];
    // monta a string com underscores e letras já chutadas
    const display = palavra
      .split('')
      .map(ch => (ch === ' ' ? ' ' : (this.guessedLetters.has(ch) ? ch : '_')))
      .join('');

    return {
      round: this.currentRound + 1,
      totalRounds: this.words.length,
      hint: dica,
      category: categoria,
      displayWord: display,
      wrongGuesses: this.wrongGuesses,
      maxWrong: this.maxWrong,
      guessedLetters: Array.from(this.guessedLetters)
    };
  }

  //Registrar resposta de um jogador
  async guessLetter(socket, letter) {
    letter = letter.toUpperCase();
    if (this.guessedLetters.has(letter)) {
      return { error: 'Letra já chutada' };
    }
    this.guessedLetters.add(letter);

    const palavra = this.words[this.currentRound].palavra;
    if (!palavra.includes(letter)) {
      this.wrongGuesses++;
    }

    // Verifica vitória ou derrota do round
    const isWon = palavra
      .split('')
      .every(ch => ch === ' ' || this.guessedLetters.has(ch));
    const isLost = this.wrongGuesses >= this.maxWrong;

    let roundResult = null;
    if (isWon || isLost) {
      // registra vencedor (no empate de derrota, ninguém ganha o ponto)
      if (isWon) {
        const player = this.players.find(p => p.socketId === socket.id);
        this.roundWinners.push(player?.id || null);
        player?.addPoints(1);
      } else {
        this.roundWinners.push(null);
      }

      roundResult = {
        won: isWon,
        fullWord: palavra
      };
    }

    return {
      state: this.getCurrentState(),
      roundResult
    };
  }

  nextRound() {
    if (!this.started) 
      return null;
    
    this.currentRound++;

    if (this.currentRound < this.words.length) {
      this._initRound();
      return this.getCurrentState();
    }
    return null;
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
