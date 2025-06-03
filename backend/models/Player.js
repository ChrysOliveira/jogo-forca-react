//Representa um jogador no jogo
class Player {
  constructor(id, socketId, name, isLeader = false) {
    this.id = id;
    this.socketId = socketId;
    this.name = name;
    this.score = 0;
    this.isLeader = isLeader;
  }

  //Adicionar pontos ao jogador
  addPoints(points) {
    this.score += points;
    return this.score;
  }

  //Converter para um objeto simples para enviar pelo socket
  toJSON() {
    return {
      id: this.id,
      socketId: this.socketId,
      name: this.name,
      score: this.score,
      isLeader: this.isLeader
    };
  }

  //Criar a partir de dados do banco de dados
  static fromDatabase(data) {
    const player = new Player(
      data.id,
      data.socket_id,
      data.name,
      data.is_leader === 1
    );
    player.score = data.score || 0;
    return player;
  }
}

export default Player;