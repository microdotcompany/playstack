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
  service
}: {
  thumbnail?: string;
  player: any;
  service?: string;
}) => {
  // Get player state from context (started, state, ready, error)
  const { started, state, ready, error } = useContext(ContextProvider);

  // Determine if video is paused based on player state
  const paused = useMemo(() => state === 'paused', [state]);

  // Determine if video is initial loading based on player state and ready state
  const isInitialLoading = useMemo(
    () => !ready || (!started && state === 'buffering'),
    [started, state, ready]
  );

  // Determine if video is not started and service is youtube or youtube-shorts
  const isYtNotStarted = useMemo(
    () => !started && (service === 'youtube' || service === 'youtube-shorts'),
    [started, service]
  );

  // Show thumbnail only if video hasn't started and a thumbnail URL is provided
  const showThumbnail = useMemo(() => !started && thumbnail, [started, thumbnail]);

  // This allows embedded players (YouTube, Vimeo) to handle their own play button initially
  const deferToIframeControls = useMemo(
    () =>
      !started && (service === 'vimeo' || service === 'youtube' || service === 'youtube-shorts'),
    [service, started]
  );

  return error ? null : (
    <div
      role="button"
      className="control-overlaid"
      style={{
        backgroundImage: showThumbnail ? `url(${thumbnail})` : undefined,
        backgroundColor: showThumbnail || isYtNotStarted ? 'black' : 'transparent', // show black background if thumbnail is shown or video is not started and service is youtube
        opacity: !paused && !isInitialLoading ? 0 : 100, // hide the overlay if the video is not paused and not initial loading
        pointerEvents: deferToIframeControls ? 'none' : 'auto'
      }}
      onClick={() => {
        // Only handle play/pause if:
        // - Not using iframe controls (YouTube, Vimeo)
        // - Player instance exists
        // - Player is ready
        if (!deferToIframeControls && player.current && ready) {
          if (paused) {
            player.current.play();
          } else {
            player.current.pause();
          }
        }
      }}
    >
      <div>{paused ? <IconPlayerPlayFilled /> : <IconPlayerPauseFilled />}</div>

      {isInitialLoading && <div className="loader" />}
    </div>
  );
};
