import { useGame } from '../context/GameContext';

const GameOverScreen = () => {
  const { finalScores, resetGame } = useGame();

  // Só exibe após o jogo terminar e existir pelo menos um score
  if (!finalScores || finalScores.length === 0) return null;

  // Ordena do maior para o menor
  const sortedScores = [...finalScores].sort((a, b) => b.score - a.score);

  return (
    <div className="screen" style={{ alignItems: 'center', padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '48rem' }}>
        <h1 className="text-3xl font-bold mb-medium center-text text-primary">
          Fim de Jogo - Placar Final
        </h1>

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
                {sortedScores.map((player, index) => (
                  <tr key={player.name} style={{ borderTop: '1px solid var(--color-surface)' }}>
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

        <div className="center-text">
          <button
            onClick={resetGame}
            style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--color-primary)' }}
          >
            Jogar Novamente
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverScreen;
