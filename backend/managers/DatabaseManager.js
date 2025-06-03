//DatabaseManager.js - Gerencia operações de banco de dados
import initializeDatabase from '../database.js';

class DatabaseManager {
  constructor() {
    this.db = null;
  }

  async initialize() {
    try {
      this.db = await initializeDatabase();
      console.log("Database connected");
      return this.db;
    } catch (err) {
      console.error("Database initialization error:", err);
      throw err;
    }
  }

  //Buscar perguntas aleatórias do banco de dados
  async getRandomQuestions(limit = 5) {
    try {
      const questions = await this.db.all(`
        SELECT q.id, q.question, q.correct_answer,
               json_group_array(a.answer) as answers
        FROM questions q
        JOIN answers a ON q.id = a.question_id
        GROUP BY q.id
        ORDER BY RANDOM()
        LIMIT ?
      `, limit);
      
      //Parse da string JSON em array e embaralhamento das respostas
      questions.forEach(q => {
        q.answers = JSON.parse(q.answers);
        //Embaralhar as respostas
        q.answers = q.answers.sort(() => Math.random() - 0.5);
      });
      
      return questions;
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  }

  //Criar um novo jogo no banco de dados
  async createGame() {
    try {
      const result = await this.db.run('INSERT INTO games (started_at) VALUES (CURRENT_TIMESTAMP)');
      return result.lastID;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  }

  //Obter referência direta ao banco de dados
  getDatabase() {
    return this.db;
  }
}

export default DatabaseManager;
