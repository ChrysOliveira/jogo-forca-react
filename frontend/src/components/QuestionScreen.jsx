import { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

const QuestionScreen = () => {
  const { currentQuestion, questionNumber, totalQuestions, submitAnswer } = useGame();
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef(null);

  useEffect(() => {
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setTimeLeft(15);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (isSubmitted && timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [isSubmitted]);
  useEffect(() => {
    if (timeLeft === 0 && !isSubmitted && currentQuestion) {
      console.log('Tempo esgotado! Enviando resposta vazia.');
      
      setIsSubmitted(true);
      setTimeout(() => {
        if (currentQuestion) {
          submitAnswer('', currentQuestion.id);
        }
      }, 10);
    }
  }, [timeLeft, isSubmitted, submitAnswer, currentQuestion]);

  const handleAnswerSelect = (answer) => {
    if (isSubmitted) return;
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (isSubmitted) return;
    
    submitAnswer(selectedAnswer, currentQuestion.id);
    setIsSubmitted(true);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  if (!currentQuestion) return null;

  return (
    <div className="screen">
      <div className="card" style={{ maxWidth: '42rem' }}>
        <div className="flex space-between mb-medium">
          <span className="text-small text-muted">
            Pergunta {questionNumber} de {totalQuestions}
          </span>
          <span className={timeLeft <= 5 ? 'timer-warning' : ''} style={{ 
            backgroundColor: timeLeft <= 5 ? 'var(--color-danger)' : 'var(--color-primary)', 
            fontSize: '0.75rem', 
            fontWeight: 'bold',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            transition: 'background-color 0.3s ease'
          }}>
            Tempo: {timeLeft}s
          </span>
        </div>

        <div style={{ 
          width: '100%', 
          height: '4px', 
          backgroundColor: 'var(--color-surface-light)', 
          borderRadius: '2px', 
          marginBottom: '1rem',
          overflow: 'hidden'
        }}>
          <div style={{ 
            height: '100%', 
            width: `${(timeLeft / 15) * 100}%`, 
            backgroundColor: timeLeft <= 5 ? 'var(--color-danger)' : 'var(--color-success)',
            transition: 'width 1s linear, background-color 0.3s ease'
          }}></div>
        </div>

        <h1 className="text-2xl font-bold mb-large text-primary">
          {currentQuestion.question}
        </h1>

        <div className="mb-large">
          {currentQuestion.answers.map((answer, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(answer)}
              className={`answer-button ${selectedAnswer === answer ? 'selected' : ''}`}
              disabled={isSubmitted}
            >
              <span className="font-bold">{String.fromCharCode(65 + index)}.</span> {answer}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedAnswer || isSubmitted}
          style={{
            width: '100%',
            backgroundColor: isSubmitted 
              ? 'var(--color-surface-light)' 
              : selectedAnswer 
              ? 'var(--color-success)' 
              : 'var(--color-surface-light)'
          }}
        >
          {isSubmitted ? 'Resposta Enviada!' : 'Confirmar Resposta'}
        </button>

        {isSubmitted && (
          <p className="center-text text-muted" style={{ marginTop: '1rem' }}>
            Aguardando os outros jogadores...
          </p>
        )}
      </div>
    </div>
  );
};

export default QuestionScreen;
