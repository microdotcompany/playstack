import { forwardRef, useContext, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { ContextProvider } from './player';
import { waitForLibrary } from './helper/wait';

interface VimeoProps {
  src: string;
  id: string;
  defaultControls?: boolean;
}

export const Vimeo = forwardRef(({ src, id, defaultControls }: VimeoProps, ref: any) => {
  const playerRef = useRef<any>(null);

  const vimeoPlayerRef = useRef<HTMLDivElement>(null);

  const {
    setStarted,
    setState,
    setCurrentTime,
    setDuration,
    setReady,
    isIOS,
    setVolume,
    setMuted,
    setPlaybackRate,
    setError
  } = useContext(ContextProvider);

  const url = useMemo(() => {
    const hash = new URLSearchParams(src).get('h');
    return `https://player.vimeo.com/video/${id}?h=${hash}`;
  }, [src, id]);

  useEffect(() => {
    const onReady = () => {
      setReady(true);
      playerRef.current.getDuration().then(function (duration: number) {
        setDuration(duration);
      });
    };

    const onPlay = () => {
      setStarted(true);
      setState('playing');
    };
    const onPause = () => setState('paused');
    const onBuffering = () => setState('buffering');
    const onEnded = () => {
      // if the video is ended reset the video to 0 and pause it (to prevent the video from playing again)
      playerRef.current
        .setCurrentTime(0)
        .then(async () => {
          await playerRef.current.pause().catch((err: any) => console.log('paused error', err));
        })
        .catch((error: any) => console.error('Error seeking to time:', error));
    };

    const onTimeUpdate = (data: any) => setCurrentTime(data.seconds);

    const onError = (error: any) => {
      console.error('Error player:', error);
      setError(error);
    };

    const onVolumeChange = (data: any) => {
      setMuted(data.muted);
      setVolume(data.volume);
    };

    const onPlaybackRateChange = (data: any) => {
      setPlaybackRate(data.playbackRate);
    };

    waitForLibrary('Vimeo')
      .then(() => {
        playerRef.current = new window.Vimeo.Player(vimeoPlayerRef.current, {
          url: url,
          autoplay: false,
          controls: 1,
          muted: false,
          playsinline: isIOS ? false : true
        });

        // Wait for player to be ready before attaching event listeners
        playerRef.current
          .ready()
          .then(() => {
            onReady();
            playerRef.current.on('play', onPlay);
            playerRef.current.on('pause', onPause);
            playerRef.current.on('ended', onEnded);
            playerRef.current.on('bufferstart', onBuffering);
            playerRef.current.on('bufferend', onPlay);
            playerRef.current.on('timeupdate', onTimeUpdate);
            playerRef.current.on('error', onError);
            playerRef.current.on('volumechange', onVolumeChange);
            playerRef.current.on('playbackratechange', onPlaybackRateChange);
          })
          .catch((error: any) => {
            console.error('Error initializing Vimeo player:', error);
          });
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      if (playerRef.current) playerRef.current.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, defaultControls, vimeoPlayerRef, isIOS]);

  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        playerRef.current.play();
      },
      pause: () => {
        playerRef.current.pause();
      },
      setVolume: (volume: number) => {
        playerRef.current.setVolume(volume);
      },
      getTitle: async () => {
        return await playerRef.current.getVideoTitle().then((title: string) => title);
      },
      seekTo: (time: number) => {
        playerRef.current.setCurrentTime(time);
      },
      setMuted: (muted: boolean) => {
        playerRef.current.setMuted(muted);
      },
      setPlaybackRate: (playbackRate: number) => {
        playerRef.current.setPlaybackRate(playbackRate);
      },
      instance: () => playerRef.current
    }),
    [playerRef]
  );

  return <div ref={vimeoPlayerRef} className="vimeo-player" />;
});
