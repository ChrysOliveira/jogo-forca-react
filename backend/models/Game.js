//Gerencia o estado do jogo
import Player from './Player.js';

class Game {
  constructor(id, db) {
    this.id = id;
    this.players = [];
    this.started = false;
    this.currentRound = 0;
    this.words = [];
    this.roundsWinners = [];

    this.playerStates = new Map()

    this.maxWrongAttempts = 6;
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

      this.playerStates.set(socketId, {
        guessedLetters: new Set(),
        correctLetters: new Set(),
        wrongLetters: new Set(),
      })

      console.log(`Adicionei os estados: ${this.playerStates.guessedLetters}\n${this.playerStates.correctLetters}\n${this.playerStates.wrongLetters}`)

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
      this.playerStates.delete(socketId);

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
    this.roundsWinners = [];
    this._initRound();
    return true;
  }

  _initRound() {
    for (const state of this.playerStates.values()) {
      state.guessedLetters.clear();
      state.correctLetters.clear();
      state.wrongLetters.clear();
    }
  }

  getCurrentState(socketId) {
    console.log("getCurrentState:: Enviando estado atual");

    if (!this.started || !this.words[this.currentRound]) return null;
    
    const state = this.playerStates.get(socketId);
    if (!state) return null;

    const { palavra, dica, categoria } = this.words[this.currentRound];
    console.log(`getCurrentState:: Palavra atual: ${palavra}`)
    console.log(`getCurrentState:: Dica atual: ${dica}`)
    console.log(`getCurrentState:: Categoria atual: ${categoria}`)

    // monta a string com underscores e letras já chutadas
    const display = palavra
      .split('')
      .map(ch => (ch === ' ' ? ' ' : (state.guessedLetters.has(ch) ? ch : '_')))
      .join('');

    console.log(`getCurrentState:: Display atual: ${display}`)

    const finished = this.verificaLetras(state.guessedLetters, palavra);

    console.log(`getCurrentState:: Finished?: ${finished}`)

    return {
      round: this.currentRound,
      totalRounds: this.words.length,
      hint: dica,
      category: categoria,
      displayWord: display,
      wrongLetters: Array.from(state.wrongLetters),
      correctLetters: Array.from(state.correctLetters),
      guessedLetters: Array.from(state.guessedLetters),
      finished: finished || this.verificaSePerdeu(state.wrongLetters)
    };
  }

  verificaSePerdeu = (wrongLetters) => {
    const total = wrongLetters.size;
    console.log(`Total de erros: ${total}`)

    if (total >= this.maxWrongAttempts) return true;

    return false;
  }

  verificaLetras = (array, palavra) => {
    // Remove duplicatas do array e da palavra
    const setArray = new Set(array);
    const setPalavra = new Set(palavra);

    if (setArray.size !== setPalavra.size) {
      return false;
    }
    // Todo caractere do array tem que estar na palavra
    for (let letra of setArray) {
      if (!setPalavra.has(letra)) {
        return false;
      }
    }
    // Não precisa checar o contrário pois os tamanhos já são iguais
    return true;
  }

  //Registrar resposta de um jogador
  async guessLetter(socket, letter) {
    letter = letter.toUpperCase();
    const state = this.playerStates.get(socket.id)

    if (!state) 
      return { error: 'Jogador não encontrado' };

    if (state.guessedLetters.has(letter)) {
      return { error: 'Letra já chutada' };
    }

    state.guessedLetters.add(letter);

    const palavra = this.words[this.currentRound].palavra;

    if (!palavra.includes(letter)) {
      state.wrongLetters.add(letter);
    } else {
      state.correctLetters.add(letter);
    }

    // Verifica vitória ou derrota do round
    const isWon = palavra
      .split('')
      .every(ch => ch === ' ' || state.guessedLetters.has(ch));

    //TODO: validar o fluxo de derrota
    const isLost = state.wrongLetters.size >= this.maxWrongAttempts;

    let roundResult = {
      won: false,
      lost: this.finishRound(),
      playerWin: "Ninguem acertou essa rodada",
      fullWord: palavra
    };

    if (isWon) {
      // registra vencedor (no empate de derrota, ninguém ganha o ponto)
      
      /** @type {Player} */
      const player = this.players.find(p => p.socketId === socket.id);
      this.roundsWinners.push(player?.id || null);
      player?.addPoints(1);

      roundResult.playerWin = player.name
      roundResult.won = true;
    }

    return {
      state: this.getCurrentState(socket.id),
      roundResult
    };
  }

  nextRound(socketId) {
    if (!this.started)
      return null;

    this.currentRound++;

    if (this.currentRound < this.words.length) {
      this._initRound();
      return this.getCurrentState(socketId);
    }
    return null;
  }

  //Calcular pontuações quando todos responderam
  // async calculateScores() {
  //   try {
  //     const currentQuestion = this.questions[this.currentQuestion];
  //
  //     //Calcular pontos para respostas corretas
  //     //Ordenar por tempo de resposta (mais rápido recebe mais pontos)
  //     const correctAnswers = this.playerAnswers
  //       .filter(pa => pa.isCorrect)
  //       .sort((a, b) => a.responseTime - b.responseTime);
  //
  //     //Atribuir pontos: 100 para o mais rápido, diminuindo 10 por posição
  //     correctAnswers.forEach(async (pa, index) => {
  //       const points = Math.max(100 - (index * 10), 10); // Mínimo de 10 pontos
  //
  //       //Atualizar pontuação do jogador
  //       const player = this.players.find(p => p.id === pa.playerId);
  //       if (player) {
  //         player.addPoints(points);
  //       }
  //
  //       //Atualizar pontos no registro de resposta
  //       pa.points = points;
  //
  //       //Atualizar pontos no banco de dados
  //       await this.db.run(
  //         'UPDATE player_answers SET points = ? WHERE player_id = ? AND question_id = ?',
  //         points, pa.playerId, currentQuestion.id
  //       );
  //     });
  //
  //     //Salvar os resultados para o placar final
  //     this.results.push({
  //       questionId: currentQuestion.id,
  //       question: currentQuestion.question,
  //       correctAnswer: currentQuestion.correct_answer,
  //       playerAnswers: [...this.playerAnswers]
  //     });
  //
  //     return {
  //       answers: this.playerAnswers,
  //       correctAnswer: currentQuestion.correct_answer
  //     };
  //   } catch (error) {
  //     console.error('Error calculating scores:', error);
  //     throw error;
  //   }
  // }

  finishRound() {
    const answer = Array.from(this.playerStates.values()).every(p => p.wrongLetters.size >= this.maxWrongAttempts)
    console.log(`Valor de answer: ${answer} - ${JSON.stringify(this.playerStates.values)}`)
    return answer
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
