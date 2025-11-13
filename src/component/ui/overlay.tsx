import { IconPlayerPauseFilled, IconPlayerPlayFilled } from '@tabler/icons-react';
import { useContext, useMemo } from 'react';
import { ContextProvider } from '../player';

interface OverlayProps {
  started?: boolean;
  paused?: boolean;
  thumbnail?: string;
  player: any;
  deferToIframeControls?: boolean;
}

export const Overlay = ({ thumbnail, player, deferToIframeControls }: OverlayProps) => {
  const { started, state, ready, error } = useContext(ContextProvider);

  const paused = useMemo(() => state === 'paused', [state]);

  const showThumbnail = useMemo(() => !started && thumbnail, [started, thumbnail]);

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
