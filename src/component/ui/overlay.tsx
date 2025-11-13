import { IconPlayerPauseFilled, IconPlayerPlayFilled } from '@tabler/icons-react';
import { useContext, useMemo } from 'react';
import { ContextProvider } from '../player';

/**
 * Overlay component that renders play/pause controls and thumbnail over the video player
 * Handles user interactions for play/pause functionality
 */
export const Overlay = ({
  thumbnail,
  player,
  deferToIframeControls
}: {
  thumbnail?: string;
  player: any;
  deferToIframeControls?: boolean;
}) => {
  // Get player state from context (started, state, ready, error)
  const { started, state, ready, error } = useContext(ContextProvider);

  // Determine if video is paused based on player state
  const paused = useMemo(() => state === 'paused', [state]);

  // Show thumbnail only if video hasn't started and a thumbnail URL is provided
  const showThumbnail = useMemo(() => !started && thumbnail, [started, thumbnail]);

  // This allows embedded players (YouTube, Vimeo) to handle their own play button initially
  const initialPlayButton = useMemo(
    () => deferToIframeControls && !started,
    [deferToIframeControls, started]
  );

  return error ? null : (
    <div
      role="button"
      className="control-overlaid"
      style={{
        backgroundImage: showThumbnail ? `url(${thumbnail})` : undefined,
        backgroundColor: showThumbnail ? 'black' : 'transparent',
        opacity: !paused ? 0 : 100,
        pointerEvents: initialPlayButton && !started ? 'none' : 'auto'
      }}
      onClick={() => {
        // Only handle play/pause if:
        // - Not using iframe controls (YouTube, Vimeo)
        // - Player instance exists
        // - Player is ready
        if (!initialPlayButton && player.current && ready) {
          if (paused) {
            player.current.play();
          } else {
            player.current.pause();
          }
        }
      }}
    >
      <div>{paused ? <IconPlayerPlayFilled /> : <IconPlayerPauseFilled />}</div>

      {!ready && <div className="loader" />}
    </div>
  );
};
