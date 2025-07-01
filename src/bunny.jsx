import { useEffect, useRef, useState } from 'react';

const Bunny = ({ src, thumbnail, id, onTimeUpdate }) => {
  const ref = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    setPlayerReady(false);
    ref.current.style.background = 'transparent';
  }, [id]);

  useEffect(() => {
    if (src && typeof playerjs !== 'undefined') {
      // eslint-disable-next-line no-undef
      const player = new playerjs.Player(ref.current);

      player.on('ready', () => {
        setPlayerReady(true);
        ref.current.style.background = 'black';
        player.on('timeupdate', (time) => {
          if (typeof onTimeUpdate === 'function')
            onTimeUpdate({
              current: time.seconds,
              duration: time.duration
            });
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);
  return (
    <div className="bunny-player-container">
      <img className="thumbnail" src={thumbnail} />

      {!playerReady && (
        <div className="loader">
          <div />
        </div>
      )}

      <iframe ref={ref} src={src} allowFullScreen allow="picture-in-picture;" />
    </div>
  );
};

export default Bunny;
