import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function initializeDatabase() {
  const db = await open({
    filename: './quiz.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      answer TEXT NOT NULL,
      is_correct BOOLEAN NOT NULL,
      FOREIGN KEY (question_id) REFERENCES questions (id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      finished_at DATETIME
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      socket_id TEXT NOT NULL,
      name TEXT NOT NULL,
      game_id INTEGER NOT NULL,
      score INTEGER DEFAULT 0,
      is_leader BOOLEAN DEFAULT 0,
      FOREIGN KEY (game_id) REFERENCES games (id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS player_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      answer TEXT NOT NULL,
      is_correct BOOLEAN NOT NULL,
      response_time INTEGER NOT NULL,
      points INTEGER DEFAULT 0,
      FOREIGN KEY (player_id) REFERENCES players (id),
      FOREIGN KEY (question_id) REFERENCES questions (id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS palavras_forca(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      palavra TEXT NOT NULL,
      dica TEXT NOT NULL,
      categoria TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

    // verifica se já tem palavras; se não, insere o seed
  const count = await db.get('SELECT COUNT(*) as cnt FROM palavras_forca');
  if (count.cnt === 0) {
    const palavras = [
      // —— Filmes —— 
      { palavra: "INCEPTION",       dica: "Filme de Christopher Nolan sobre sonhos",            categoria: "Filme" },
      { palavra: "MATRIX",          dica: "Keanu Reeves luta contra máquinas num mundo virtual", categoria: "Filme" },
      { palavra: "AVATAR",          dica: "Mundo alienígena chamado Pandora",                  categoria: "Filme" },

      // —— Séries —— 
      { palavra: "BREAKING BAD",    dica: "Químico vira fabricante de metanfetamina",          categoria: "Série" },
      { palavra: "STRANGER THINGS", dica: "Menino desaparece e amigos enfrentam mundo invertido",categoria: "Série" },
      { palavra: "FRIENDS",         dica: "Seis amigos vivem em Nova York",                    categoria: "Série" },

      // —— Personagens —— 
      { palavra: "GANDALF",         dica: "Mago cinzento de 'O Senhor dos Anéis'",             categoria: "Personagem" },
      { palavra: "HARRY POTTER",    dica: "Bruxo com cicatriz em forma de raio",               categoria: "Personagem" },
      { palavra: "SHERLOCK HOLMES", dica: "Detetive criado por Sir Arthur Conan Doyle",       categoria: "Personagem" },

      // —— Comidas —— 
      { palavra: "PIZZA",           dica: "Prato italiano com muçarela e tomate",              categoria: "Comida" },
      { palavra: "SUSHI",           dica: "Comida japonesa feita com arroz e peixe cru",        categoria: "Comida" },
      { palavra: "BRIGADEIRO",      dica: "Doce brasileiro de chocolate e leite condensado",    categoria: "Comida" },

      // —— Animais —— 
      { palavra: "PENGUIN",         dica: "Ave que não voa e vive em regiões frias",            categoria: "Animal" },
      { palavra: "KANGAROO",        dica: "Mamífero marsupial típico da Austrália",             categoria: "Animal" },
      { palavra: "DOLPHIN",         dica: "Mamífero marinho muito inteligente",                 categoria: "Animal" },

      // —— Outros (exemplos extras) —— 
      { palavra: "BATMAN",          dica: "Herói de Gotham City, identidade de Bruce Wayne",   categoria: "Super-herói" },
      { palavra: "MARIO",           dica: "Encanador bigodudo da Nintendo",                    categoria: "Personagem" },
      { palavra: "TACO",            dica: "Comida mexicana com tortilla e recheio variado",     categoria: "Comida" },
      { palavra: "DRAGON",          dica: "Criatura mítica que cospe fogo",                    categoria: "Animal" }
    ];

    const insertStmt = await db.prepare(
      `INSERT INTO palavras_forca (palavra, dica, categoria) VALUES (?, ?, ?)`
    );
    for (const w of palavras) {
      await insertStmt.run(w.palavra, w.dica, w.categoria);
    }
    await insertStmt.finalize();

    console.log('Seed de palavras da forca inserido com sucesso!');
  }   

  // const questionCount = await db.get('SELECT COUNT(*) as count FROM questions');
  // if (questionCount.count === 0) {
  //   const questions = [
  //     {
  //       question: "Qual função é usada para criar um componente funcional no React?",
  //       correctAnswer: "function",
  //       answers: ["class", "component", "function", "createComponent"]
  //     },
  //     {
  //       question: "Qual hook do React é usado para gerenciar o estado de um componente?",
  //       correctAnswer: "useState",
  //       answers: ["useEffect", "useState", "useContext", "useReducer"]
  //     },
  //     {
  //       question: "O que é JSX no React?",
  //       correctAnswer: "Uma extensão de sintaxe para JavaScript",
  //       answers: ["Um tipo de banco de dados", "Uma extensão de sintaxe para JavaScript", "Uma linguagem de programação", "Uma biblioteca externa"]
  //     },
  //     {
  //       question: "Como você passa dados para um componente filho no React?",
  //       correctAnswer: "Props",
  //       answers: ["Props", "State", "Context", "Redux"]
  //     },
  //     {
  //       question: "O que é o Node.js?",
  //       correctAnswer: "Um ambiente de execução JavaScript do lado do servidor",
  //       answers: ["Um framework JavaScript", "Um ambiente de execução JavaScript do lado do servidor", "Uma linguagem de programação", "Um banco de dados"]
  //     },
  //     {
  //       question: "Qual módulo do Node.js é usado para criar um servidor HTTP?",
  //       correctAnswer: "http",
  //       answers: ["server", "http", "express", "net"]
  //     },
  //     {
  //       question: "Qual comando é usado para inicializar um projeto Node.js e criar um package.json?",
  //       correctAnswer: "npm init",
  //       answers: ["node start", "npm start", "npm init", "node init"]
  //     },
  //     {
  //       question: "Qual é o gerenciador de pacotes padrão do Node.js?",
  //       correctAnswer: "npm",
  //       answers: ["yarn", "npm", "pnpm", "bower"]
  //     },
  //     {
  //       question: "Qual hook do React é usado para executar efeitos colaterais?",
  //       correctAnswer: "useEffect",
  //       answers: ["useState", "useEffect", "useReducer", "useCallback"]
  //     },
  //     {
  //       question: "O que é o Virtual DOM no React?",
  //       correctAnswer: "Uma representação leve do DOM real na memória",
  //       answers: ["Um componente do React", "Uma representação leve do DOM real na memória", "Um tipo de banco de dados", "Um servidor virtual"]
  //     },
  //     {
  //       question: "Qual método é usado para renderizar listas no React?",
  //       correctAnswer: "map()",
  //       answers: ["forEach()", "filter()", "map()", "reduce()"]
  //     },
  //     {
  //       question: "O que é o Express.js?",
  //       correctAnswer: "Um framework web para Node.js",
  //       answers: ["Um banco de dados", "Um framework web para Node.js", "Uma linguagem de programação", "Uma biblioteca React"]
  //     },
  //     {
  //       question: "Qual ferramenta é comumente usada para gerenciar estado global em aplicações React?",
  //       correctAnswer: "Redux",
  //       answers: ["Redux", "jQuery", "Bootstrap", "Axios"]
  //     },
  //     {
  //       question: "O que é o npm na ecosistema Node.js?",
  //       correctAnswer: "Node Package Manager",
  //       answers: ["Node Programming Method", "Node Package Manager", "New Programming Module", "Node Process Manager"]
  //     },
  //     {
  //       question: "Como é chamado o arquivo principal de configuração de um projeto Node.js?",
  //       correctAnswer: "package.json",
  //       answers: ["node.config.js", "package.json", "config.js", "app.json"]
  //     },
  //     {
  //       question: "Qual método é usado para lidar com operações assíncronas em JavaScript moderno?",
  //       correctAnswer: "async/await",
  //       answers: ["then/catch", "callback", "async/await", "subscribe"]
  //     }
  //   ];

  //   for (const q of questions) {
  //     const { lastID } = await db.run(
  //       'INSERT INTO questions (question, correct_answer) VALUES (?, ?)',
  //       q.question, q.correctAnswer
  //     );

  //     for (const answer of q.answers) {
  //       await db.run(
  //         'INSERT INTO answers (question_id, answer, is_correct) VALUES (?, ?, ?)',
  //         lastID, answer, answer === q.correctAnswer ? 1 : 0
  //       );
  //     }
  //   }
  // }

  console.log('Database initialized successfully');
  return db;
}

export default initializeDatabase;

