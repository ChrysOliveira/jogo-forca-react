import { useGame } from '../context/GameContext';

const RoundResultsScreen = () => {
  const { won, lost, playerWin, fullWord } = useGame();

  // Get the player names from players array
  // const getPlayerName = (playerId) => {
  //   const player = players.find((p) => p.id === playerId);
  //   return player ? player.name : 'Unknown Player';
  // };

  // Exibe apenas quando o jogo terminar (vitória ou derrota)
  if (!won && !lost) return null;

  return (
    <div className="screen">
      <div className="card" style={{ maxWidth: '42rem' }}>
        <h1 className="text-3xl font-bold mb-medium center-text text-primary">
          Resultado da Forca
        </h1>

        <div style={{
          backgroundColor: 'var(--color-surface-light)',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <h2 className="mb-small">Palavra:</h2>
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            border: '1px solid var(--color-success)',
            borderRadius: '0.5rem'
          }}>
            {fullWord}
          </div>
        </div>

        <h2 className="mb-medium">Vencedor:</h2>
        <div style={{
          padding: '0.75rem',
          backgroundColor: 'var(--color-surface-light)',
          borderRadius: '0.5rem'
        }}>
          {playerWin}
        </div>
      </div>
    </div>
  );
};

export default RoundResultsScreen;
