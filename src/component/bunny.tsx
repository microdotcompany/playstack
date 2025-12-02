import { forwardRef, useContext, useEffect, useImperativeHandle, useRef } from 'react';
import { ContextProvider } from './player';
import { loadLibrary } from './helper/load';

/**
 * Props for the Bunny video player component
 */
interface props {
  src?: string;
  thumbnail?: string;
  id: string;
}

/**
 * Bunny.net video player component that embeds a video using the Player.js API.
 * Uses forwardRef to expose the player instance to parent components.
 */
export const Bunny = forwardRef(({ src, thumbnail, id }: props, ref) => {
  // Reference to the iframe element that will host the Bunny.net video player
  const iframe = useRef<HTMLIFrameElement>(null);

  // Reference to the Player.js instance for programmatic control
  const playerRef = useRef<any>(null);

  // Access player state and setters from the context provider
  const { setDuration, setCurrentTime, ready, setReady } = useContext(ContextProvider);

  // Initialize iframe background to transparent when component mounts or id changes
  useEffect(() => {
    if (iframe.current) iframe.current.style.background = 'transparent';
  }, [id]);

  // Initialize the Bunny.net player when the video source changes
  useEffect(() => {
    // Wait for the Player.js library to load before initializing
    loadLibrary('playerjs')
      .then(() => {
        if (!(src && src.length > 1)) return;

        // Create new player instance with the iframe element
        playerRef.current = new window.playerjs.Player(iframe.current);

        // Register event handlers when the player is ready
        playerRef.current.on('ready', () => {
          setReady(true);
          // Set iframe background to black once the player is ready
          if (iframe.current) iframe.current.style.background = 'black';
          // Fetch and set the video duration
          playerRef.current.getDuration((duration: number) => setDuration(duration));

          // Listen for time updates and call the callback with current time and duration
          playerRef.current.on('timeupdate', (time: any) => {
            setCurrentTime(time.seconds);
          });
        });
      })
      .catch((error) => {
        console.error(error);
      });

    // Cleanup function to remove event listeners when component unmounts
    return () => {
      try {
        if (playerRef.current) {
          playerRef.current.off('ready');
          playerRef.current.off('timeupdate');
          playerRef.current = null;
        }
      } catch (error) {
        console.error('Error removing event listeners for bunny player', error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Expose the player instance to parent components via ref
  useImperativeHandle(
    ref,
    () => ({
      /**
       * Returns the underlying Bunny.net Player instance.
       *
       * @returns The Bunny.net Player instance or null if not available
       */
      instance: () => playerRef.current
    }),
    [playerRef]
  );

  return (
    <>
      {/* Display thumbnail image before video loads */}
      <img className="thumbnail" src={thumbnail} />
      {/* Show loading spinner while player is initializing */}
      {!ready && (
        <div className="loader">
          <div />
        </div>
      )}
      {/* Iframe that will contain the Bunny.net video player */}
      <iframe ref={iframe} src={src} allowFullScreen allow="picture-in-picture;" />
    </>
  );
});

Bunny.displayName = 'Bunny';
