import { forwardRef, useContext, useEffect, useImperativeHandle, useRef } from 'react';
import { ContextProvider } from './player';
import { waitForLibrary } from './helper/wait';

interface YoutubeProps {
  id: string;
  service: string;
  defaultControls?: boolean;
}
const Youtube = forwardRef(({ id, service, defaultControls }: YoutubeProps, ref: any) => {
  const playerRef = useRef<any>(null);
  const youtubePlayerRef = useRef<HTMLDivElement>(null);

  const {
    isIOS,
    setStarted,
    setState,
    setCurrentTime,
    setDuration,
    setReady,
    setVolume,
    setMuted,
    setPlaybackRate,
    setError
  } = useContext(ContextProvider);

  useEffect(() => {
    let iframeWindow: any = null;

    const onReady = (event: any) => {
      setReady(true);
      setDuration(event.target.getDuration());
    };

    const onStateChange = (event: any) => {
      if (event.data === 1) {
        setState('playing');
        setStarted(true);
      } else if (event.data === 3) {
        setState('buffering');
      } else {
        setState('paused');
      }

      // if the video is ended reset the video to 0 and pause it (to prevent the video from playing again)
      if (event.data === 0) {
        playerRef.current?.seekTo(0, true);
        playerRef.current?.pauseVideo();
      }
    };

    const onError = (error: any) => {
      console.error('Error player:', error);
      setError(error);
    };

    const onMessage = (event: any) => {
      if (event.source === iframeWindow) {
        const data = JSON.parse(event.data);

        if (data.event === 'infoDelivery' && data.info) {
          if (data.info.currentTime) {
            const time = Math.floor(data.info.currentTime);
            setCurrentTime((state: number) => (state !== time ? time : state));
          }

          if (typeof data.info.volume === 'number') {
            setVolume(data.info.volume / 100);
          }

          if (typeof data.info.muted === 'boolean') {
            setMuted(data.info.muted);
          }

          if (typeof data.info.playbackRate === 'number') {
            setPlaybackRate(data.info.playbackRate);
          }
        }
      }
    };

    waitForLibrary('YT')
      .then(() => {
        const div = document.createElement('div');

        if (youtubePlayerRef.current?.firstChild) {
          youtubePlayerRef.current.firstChild.remove();
        }

        youtubePlayerRef.current?.appendChild(div);

        playerRef.current = new window.YT.Player(div, {
          videoId: id,
          host:
            service === 'youtube-shorts'
              ? 'https://www.youtube.com'
              : 'https://www.youtube-nocookie.com',
          playerVars: {
            playsinline: isIOS ? 0 : 1,
            cc_load_policy: 0,
            cc_lang_pref: 'en',
            controls: defaultControls ? 1 : 0,
            disablekb: 1,
            fs: defaultControls || isIOS ? 1 : 0,
            rel: 0,
            iv_load_policy: 3,
            autoplay: 0,
            hl: 'en',
            origin: window.location.origin
          }
        });

        iframeWindow = playerRef.current?.getIframe()?.contentWindow;

        playerRef.current.addEventListener('onStateChange', onStateChange);
        playerRef.current.addEventListener('onError', onError);
        playerRef.current.addEventListener('onReady', onReady);
        window.addEventListener('message', onMessage);
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        window.removeEventListener('message', onMessage);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIOS, id, service, defaultControls, youtubePlayerRef]);

  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        playerRef.current?.playVideo();
      },
      pause: () => {
        playerRef.current?.pauseVideo();
      },
      setVolume: (volume: number) => {
        playerRef.current?.setVolume(volume * 100);
      },
      getTitle: () => {
        return new Promise((resolve) => {
          resolve(playerRef.current?.videoTitle);
        });
      },
      seekTo: (time: number) => {
        playerRef.current?.seekTo(time, true);
      },
      setMuted: (muted: boolean) => {
        if (muted) {
          playerRef.current?.mute();
        } else {
          playerRef.current?.unMute();
        }
      },
      setPlaybackRate: (playbackRate: number) => {
        playerRef.current?.setPlaybackRate(playbackRate);
      },
      instance: () => playerRef.current
    }),
    [playerRef]
  );

  return <div ref={youtubePlayerRef} className="youtube-player" />;
});

export default Youtube;
