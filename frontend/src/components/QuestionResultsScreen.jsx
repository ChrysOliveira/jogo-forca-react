import { useGame } from '../context/GameContext';

const QuestionResultsScreen = () => {
  const { questionResults, players } = useGame();

  if (!questionResults) return null;

  // Get the player names from players array
  const getPlayerName = (playerId) => {
    const player = players.find((p) => p.id === playerId);
    return player ? player.name : 'Unknown Player';
  };

  return (
    <div className="screen">
      <div className="card" style={{ maxWidth: '42rem' }}>
        <h1 className="text-3xl font-bold mb-medium center-text text-primary">
          Resultado da Pergunta
        </h1>

        <div style={{ 
          backgroundColor: 'var(--color-surface-light)', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          marginBottom: '1.5rem' 
        }}>
          <h2 className="mb-small">Resposta Correta:</h2>
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: 'rgba(34, 197, 94, 0.2)', 
            border: '1px solid var(--color-success)', 
            borderRadius: '0.5rem' 
          }}>
            {questionResults.correctAnswer}
          </div>
        </div>

        <h2 className="mb-medium">Respostas dos Jogadores:</h2>
        <div className="mb-large">
          {questionResults.answers.map((answer, index) => (
            <div 
              key={index}
              className={`player-answer ${answer.isCorrect ? 'correct' : 'incorrect'}`}
            >
              <div className="flex space-between">
                <div>
                  <span style={{ fontWeight: '500' }}>{answer.playerName}</span>
                  <div className="text-small" style={{ marginTop: '0.25rem' }}>
                    Resposta: {answer.answer}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {answer.isCorrect ? (
                    <div>
                      <span className="text-success">+{answer.points}</span>
                      <div className="text-small text-muted" style={{ marginTop: '0.25rem' }}>
                        {(answer.responseTime / 1000).toFixed(1)}s
                      </div>
                    </div>
                  ) : (
                    <span className="text-error">+0</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="center-text text-large">
          <p>Próxima pergunta em {questionResults.nextQuestionIn} segundos...</p>
        </div>
      </div>
    </div>
  );
};

export default QuestionResultsScreen;
