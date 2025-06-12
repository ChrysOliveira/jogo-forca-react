import { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

const WordScreen = () => {
  const { hint, category, displayWord, wrongLetters, correctLetters, guessedLetters, round, finished, submitAnswer } = useGame();
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef(null);

  console.log(`WordScreen::WordScreen: Dados recebidos from useGame():\ndisplayWord: ${displayWord}, \nwrongLetters: ${wrongLetters}, \ncorrectLetters: ${correctLetters}, \nguessedLetters: ${guessedLetters}, \nround: ${round}, \nfinished: ${finished}\n`);

  // Tempo do round
  // useEffect(() => {
  //   timerRef.current = setInterval(() => {
  //     setTimeLeft((prevTime) => {
  //       if (prevTime <= 1) {
  //         clearInterval(timerRef.current);
  //         return 0;
  //       }
  //       return prevTime - 1;
  //     });
  //   }, 1000);
  //
  //   return () => {
  //     if (timerRef.current) clearInterval(timerRef.current);
  //   };
  // }, [round]);

  // useEffect(() => {
  //   if (finished && timerRef.current) {
  //     clearInterval(timerRef.current);
  //   }
  // }, [finished]);

  // useEffect(() => {
  //   if (timeLeft === 0 && !finished) {
  //     console.log('Tempo esgotado! Enviando resposta vazia.');
  //
  //     setTimeout(() => {
  //       submitAnswer(guessedLetters, round);
  //     }, 10);
  //   }
  // }, [timeLeft, finished, round, submitAnswer, guessedLetters]);

  const handleLetterSubmit = (letter) => {
    if (finished) return;

    submitAnswer(letter);
  };

  if (!displayWord) return null;

  // Componente de teclado virtual
  const VirtualKeyboard = ({ onKeyPress, guessedLetters, correctKeys, wrongKeys }) => {
    // QWERTY layout (padrão internacional)
    const qwertyRows = [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ['z', 'x', 'c', 'v', 'b', 'n', 'm']
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1rem' }}>
        {qwertyRows.map((row, rowIdx) => (
          <div key={rowIdx} style={{ display: 'flex', marginBottom: '0.3rem' }}>
            {row.map((letter) => {
              const isCorrect = correctKeys.includes(letter.toUpperCase());
              const isWrong = wrongKeys.includes(letter.toUpperCase());
              const isGuessed = guessedLetters.includes(letter.toUpperCase());

              const backgroundColor = isCorrect ? 'green' : isWrong ? 'red' : '#eee';
              const fontColor = isCorrect || isWrong ? '#fff' : '#000';

              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => onKeyPress(letter)}
                  disabled={isGuessed || finished}
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    margin: '0.25rem',
                    borderRadius: '4px',
                    border: '1px solid #555',
                    backgroundColor,
                    color: fontColor,
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="screen">
      <div className="card">
        <h1 className="text-4xl font-bold mb-large center-text text-primary">
          Jogo da Forca
        </h1>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
          {displayWord.split('').map((ch, idx) => (
            <div
              key={idx}
              style={{ fontSize: '2rem', width: '2rem', textAlign: 'center', margin: '0 0.5rem' }}
            >
              {ch || '_'}
            </div>
          ))}
        </div>

        {/* Exibe contador de erros */}
        <div style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.25rem' }}>
          Erros: {wrongLetters.length}
        </div>

        {/* Exibe contador de erros */}
        <div style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.25rem' }}>
          Categoria: {category}
        </div>

        {/* Exibe contador de erros */}
        <div style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.25rem' }}>
          Dica: {hint}
        </div>

        {/* Teclado virtual */}
        <VirtualKeyboard
          onKeyPress={handleLetterSubmit}
          guessedLetters={guessedLetters}
          correctKeys={correctLetters}
          wrongKeys={wrongLetters}
        />
      </div>
    </div>
  );
};

export default WordScreen;
