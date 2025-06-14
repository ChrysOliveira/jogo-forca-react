import { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

import forca0 from '../../assets/forca_0.png';
import forca1 from '../../assets/forca_1.png';
import forca2 from '../../assets/forca_2.png';
import forca3 from '../../assets/forca_3.png';
import forca4 from '../../assets/forca_4.png';
import forca5 from '../../assets/forca_5.png';
import forca6 from '../../assets/forca_6.png';

const hangmanSprites = [
  forca0,
  forca1,
  forca2,
  forca3,
  forca4,
  forca5,
  forca6,
];

const WordScreen = () => {
  const { hint, category, displayWord, wrongLetters, correctLetters, guessedLetters, round, finished, submitAnswer } = useGame();

  console.log(`WordScreen::WordScreen: Dados recebidos from useGame():\ndisplayWord: ${displayWord}, \nwrongLetters: ${wrongLetters}, \ncorrectLetters: ${correctLetters}, \nguessedLetters: ${guessedLetters}, \nround: ${round}, \nfinished: ${finished}\n`);

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

        {/* Exibe sprite dependendo do número de erros */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <img
            src={hangmanSprites[wrongLetters.length <= 6 ? wrongLetters.length : 6]}
            alt={`Forca etapa ${wrongLetters.length}`}
            style={{ maxWidth: '200px', height: 'auto' }}
          />
        </div>

        {/* Exibe a palavra com underlines */}
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

        {/* Categoria e dica */}
        <div style={{ textAlign: 'center', marginBottom: '0.75rem', fontSize: '1.25rem' }}>
          Categoria: {category}
        </div>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
          Dica: {hint}
        </div>

        {/* Teclado virtual */}
        <VirtualKeyboard
          onKeyPress={handleLetterSubmit}
          guessedLetters={guessedLetters}
          correctKeys={correctLetters}
          wrongKeys={wrongLetters}
        />

        {/* Aviso de derrota */}
        {wrongLetters.length >= hangmanSprites.length - 1 && (
          <div style={{
            marginTop: '1rem',
            textAlign: 'center',
            color: 'red',
            fontSize: '1.25rem'
          }}>
            Você errou. Aguardando os outros jogadores...
          </div>
        )}
      </div>
    </div>
  );
};

export default WordScreen;
