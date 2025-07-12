import { BunnyPlayerProvider, Player } from './component';

// Preview component for testing and demonstrating the player functionality
// This component wraps the Player with BunnyPlayerProvider to show how
// the player works with a sample YouTube video URL
const App = () => {
  return (
    <BunnyPlayerProvider>
      <Player src="https://youtu.be/K-NDA_QpVYA" />
    </BunnyPlayerProvider>
  );
};

export default App;
