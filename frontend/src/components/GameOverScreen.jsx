import { useGame } from '../context/GameContext';

const GameOverScreen = () => {
  const { finalScores, detailedResults, resetGame } = useGame();

  if (!finalScores || !detailedResults) return null;

  return (
    <div className="screen" style={{ alignItems: 'center', padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '48rem' }}>
        <h1 className="text-3xl font-bold mb-medium center-text text-primary">
          Fim de Jogo - Pontuação Final
        </h1>

        <div className="podium-container">
          {finalScores.slice(0, 3).map((player, index) => {
            const positions = [
              { className: 'first', text: '1º' },
              { className: 'second', text: '2º' },
              { className: 'third', text: '3º' }
            ];
            
            if (index >= finalScores.length) return null;
            
            const position = positions[index];
            
            return (
              <div key={index} className="podium-position">
                <div className="podium-info">
                  <p className="font-bold">{player.name}</p>
                  <p className="text-primary font-bold">{player.score} pts</p>
                </div>
                <div className={`podium-block ${position.className}`}>
                  <span>{position.text}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ 
          backgroundColor: 'var(--color-surface-light)', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          marginBottom: '2rem' 
        }}>
          <h2 className="text-xl mb-medium">Placar Completo</h2>
          <div style={{ overflowY: 'auto', maxHeight: '15rem' }}>
            <table style={{ width: '100%' }}>
              <thead style={{ backgroundColor: 'var(--color-surface)' }}>
                <tr>
                  <th style={{ padding: '0.5rem 1rem', textAlign: 'left' }}>Posição</th>
                  <th style={{ padding: '0.5rem 1rem', textAlign: 'left' }}>Jogador</th>
                  <th style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>Pontuação</th>
                </tr>
              </thead>
              <tbody>
                {finalScores.map((player, index) => (
                  <tr key={index} style={{ borderTop: '1px solid var(--color-surface)' }}>
                    <td style={{ padding: '0.5rem 1rem' }}>{index + 1}º</td>
                    <td style={{ padding: '0.5rem 1rem' }}>{player.name}</td>
                    <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontWeight: 'bold' }}>
                      {player.score} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-large">
          <h2 className="text-xl mb-medium">Resumo das Perguntas</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {detailedResults.map((result, index) => (
              <div key={index} style={{ 
                backgroundColor: 'var(--color-surface-light)', 
                padding: '1rem', 
                borderRadius: '0.5rem' 
              }}>
                <h3 className="mb-small">
                  Pergunta {index + 1}: {result.question}
                </h3>
                <p className="text-success mb-small">
                  <span style={{ fontWeight: '500' }}>Resposta correta:</span> {result.correctAnswer}
                </p>
                <div className="text-small text-muted">
                  {result.playerAnswers.length} jogadores responderam
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="center-text">
          <button
            onClick={resetGame}
            style={{ 
              padding: '0.75rem 1.5rem', 
              backgroundColor: 'var(--color-primary)' 
            }}
          >
            Jogar Novamente
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverScreen;
