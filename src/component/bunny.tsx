import { forwardRef, useContext, useEffect, useImperativeHandle, useRef } from 'react';
import { ContextProvider } from './player';
import { waitForLibrary } from './helper/wait';

// Global type declaration for the Bunny.net Player.js library
// This allows TypeScript to recognize the playerjs object that gets loaded externally
interface props {
  src?: string;
  thumbnail?: string;
  id: string;
}

// Bunny.net video player component using forwardRef to expose player instance
export const Bunny = forwardRef(({ src, thumbnail, id }: props, ref) => {
  // Reference to the iframe element that will contain the video player
  const iframe = useRef<HTMLIFrameElement>(null);

  const playerRef = useRef<any>(null);

  const { setDuration, setCurrentTime, ready, setReady } = useContext(ContextProvider);

  useEffect(() => {
    // Set iframe background to transparent initially
    if (iframe.current) iframe.current.style.background = 'transparent';
  }, [id]);

  // Effect to initialize the Bunny.net player when source changes
  useEffect(() => {
    if (src) {
      waitForLibrary('playerjs')
        .then(() => {
          // Create new player instance with the iframe element
          playerRef.current = new window.playerjs.Player(iframe.current);

          // Set up event listeners when player is ready
          playerRef.current.on('ready', () => {
            setReady(true);
            // Change iframe background to black when player is ready
            if (iframe.current) iframe.current.style.background = 'black';
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
    }

    // Cleanup function to remove event listeners when component unmounts
    return () => {
      if (playerRef.current) {
        playerRef.current.off('ready');
        playerRef.current.off('timeupdate');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useImperativeHandle(
    ref,
    () => ({
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
