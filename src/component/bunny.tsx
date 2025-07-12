import { forwardRef, useEffect, useRef, useState } from 'react';

// Global type declaration for the Bunny.net Player.js library
// This allows TypeScript to recognize the playerjs object that gets loaded externally
declare global {
  const playerjs: {
    Player: new (element: HTMLElement | null) => {
      on: (event: string, callback: (data: any) => void) => void;
    };
  };
}

interface props {
  src?: string;
  thumbnail?: string;
  id: string;
  onTimeUpdate?: (time: { current: number; duration: number }) => void;
}

// Bunny.net video player component using forwardRef to expose player instance
const Bunny = forwardRef(({ src, thumbnail, id, onTimeUpdate }: props, ref) => {
  // Reference to the iframe element that will contain the video player
  const iframe = useRef<HTMLIFrameElement>(null);
  // Reference to store the interval ID for polling playerjs availability
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // State to track whether the player has finished loading and is ready
  const [playerReady, setPlayerReady] = useState(false);

  // Effect to reset player state when video ID changes
  useEffect(() => {
    setPlayerReady(false);
    // Set iframe background to transparent initially
    if (iframe.current) iframe.current.style.background = 'transparent';
  }, [id]);

  // Effect to initialize the Bunny.net player when source changes
  useEffect(() => {
    // Poll every 100ms to check if playerjs library is available
    intervalRef.current = setInterval(() => {
      if (src && typeof playerjs !== 'undefined') {
        // Clear the polling interval once playerjs is available
        if (intervalRef.current) clearInterval(intervalRef.current);

        // Create new player instance with the iframe element
        const player = new playerjs.Player(iframe.current);

        // Forward the player instance to parent component if ref is a function
        if (typeof ref === 'function') ref(player);

        // Set up event listeners when player is ready
        player.on('ready', () => {
          setPlayerReady(true);
          // Change iframe background to black when player is ready
          if (iframe.current) iframe.current.style.background = 'black';
          // Listen for time updates and call the callback with current time and duration
          player.on('timeupdate', (time) => {
            if (typeof onTimeUpdate === 'function')
              onTimeUpdate({
                current: time.seconds,
                duration: time.duration
              });
          });
        });
      }
    }, 100);

    // Cleanup function to clear interval when component unmounts or src changes
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <div className="bunny-player-container">
      {/* Display thumbnail image before video loads */}
      <img className="thumbnail" src={thumbnail} />
      {/* Show loading spinner while player is initializing */}
      {!playerReady && (
        <div className="loader">
          <div />
        </div>
      )}
      {/* Iframe that will contain the Bunny.net video player */}
      <iframe ref={iframe} src={src} allowFullScreen allow="picture-in-picture;" />
    </div>
  );
});

export default Bunny;
