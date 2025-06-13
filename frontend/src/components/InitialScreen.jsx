import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';

const InitialScreen = () => {
  const [name, setName] = useState('');
  const { joinLobby } = useGame();
  const { connected } = useSocket();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && connected) {
      setIsSubmitting(true);
      console.log('Tentando entrar na sala com nome:', name.trim());
      joinLobby(name.trim());
    } else if (!connected) {
      alert('Aguarde a conexão com o servidor ser estabelecida...');
    }
  };

  return (
    <div className="screen">
      <div className="card">
        <h1 className="text-4xl font-bold mb-large center-text text-primary">
          Jogo da forca em Tempo Real
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-column gap-medium">
          <div>
            <label htmlFor="playerName" className="mb-small">
              Como você se chama?
            </label>
            <input
              type="text"
              id="playerName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome"
              required
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim() || !connected || isSubmitting}
          >
            {!connected ? 'Conectando...' : isSubmitting ? 'Entrando...' : 'Entrar na Sala'}
          </button>
          {!connected && (
            <p className="text-small text-error center-text" style={{ marginTop: '0.5rem' }}>
              Aguardando conexão com o servidor...
            </p>
          )}
        </form>
      </div>

      <div className="mb-medium text-muted text-small center-text">
        <p>Entre para participar do jogo da forca e teste seus conhecimentos!</p>
      </div>
    </div>
  );
};

export default InitialScreen;
