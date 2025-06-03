import { useGame } from '../context/GameContext';

const CountdownScreen = () => {
  const { countdown } = useGame();

  return (
    <div className="screen">
      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem' }}>
        <h1 className="text-3xl font-bold mb-large center-text text-primary">
          O Quiz vai começar em
        </h1>
        
        <div className="countdown-number mb-large">
          {countdown}
        </div>
        
        <p className="text-xl">Prepare-se!</p>
      </div>
    </div>
  );
};

export default CountdownScreen;
