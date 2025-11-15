import { forwardRef, useContext, useEffect, useImperativeHandle, useRef } from 'react';
import { ContextProvider } from './player';
import { loadLibrary } from './helper/load';

// Component props interface for YouTube player
interface YoutubeProps {
  id: string;
  service: string;
  defaultControls?: boolean;
  noCookie?: boolean;
}
const Youtube = forwardRef(
  ({ id, service, defaultControls, noCookie = true }: YoutubeProps, ref: any) => {
    // Ref to store the YouTube Player API instance
    const playerRef = useRef<any>(null);
    // Ref to the DOM element that will contain the YouTube player
    const youtubePlayerRef = useRef<HTMLDivElement>(null);

    // Reference to store the previous buffering state
    const wasBuffering = useRef<boolean>(false);

    // Access player context methods and state
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
      setError,
      setLive
    } = useContext(ContextProvider);

    useEffect(() => {
      let iframeWindow: any = null;

      // Handler called when YouTube player is ready
      // Sets the player as ready and captures the video duration
      const onReady = (event: any) => {
        setReady(true);
        setDuration(event.target.getDuration());
      };

      // Handler for YouTube player state changes
      // Maps YouTube player states (1=playing, 3=buffering, 0=ended, etc.) to our internal state
      const onStateChange = (event: any) => {
        // reset the buffering state
        wasBuffering.current = false;
        if (event.data === 1) {
          // set the state to playing
          setState('playing');
          // set the started state to true
          setStarted(true);
        } else if (event.data === 3) {
          // set the buffering state to true
          wasBuffering.current = true;
          // set the state to buffering
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

      // Error handler for YouTube player errors
      const onError = (error: any) => {
        // if the video is playable (some times prvt video through error 5) and the duration is greater than 1 second, do not set the error
        if (error.data === 5 && playerRef.current?.getDuration() >= 1) {
          const videoData = playerRef.current.getVideoData?.();

          // private video mostly doesnt have isPlayable property
          if (typeof videoData?.isPlayable === 'boolean' && !videoData?.isPlayable) {
            setError(error);
          } else {
            console.log('Playable video');
          }
        } else {
          console.error('Error player:', error);
          setError(error);
        }
      };

      // Message handler for cross-origin communication with YouTube iframe
      // Receives player info updates (currentTime, volume, muted, playbackRate)
      const onMessage = (event: any) => {
        if (event.source === iframeWindow) {
          const data = JSON.parse(event.data);

          // Process infoDelivery events from YouTube player
          if (data.event === 'infoDelivery' && data.info) {
            if (data.info.currentTime) {
              const time = Math.floor(data.info.currentTime);
              // Update current time only if it has changed
              setCurrentTime((state: number) => (state !== time ? time : state));
            }

            if (typeof data.info.volume === 'number') {
              // YouTube volume is 0-100, convert to 0-1 range
              setVolume(data.info.volume / 100);
            }

            if (typeof data.info.muted === 'boolean') {
              setMuted(data.info.muted);
            }

            if (typeof data.info.playbackRate === 'number') {
              setPlaybackRate(data.info.playbackRate);
            }

            // if the video is live, set the live state to true
            if (data.info.videoData?.isLive) {
              setLive(true);
            }
          }
        }
      };

      // Wait for YouTube IFrame API to load, then initialize player
      loadLibrary('YT')
        .then(() => {
          window.YT.ready(() => {
            const div = document.createElement('div');

            // Remove existing player if present (handles re-initialization)
            if (youtubePlayerRef.current?.firstChild) {
              youtubePlayerRef.current.firstChild.remove();
            }

            youtubePlayerRef.current?.appendChild(div);

            // Initialize YouTube Player with configuration
            playerRef.current = new window.YT.Player(div, {
              videoId: id,
              // Use regular YouTube domain for shorts, nocookie domain for regular videos (if noCookie is true)
              host:
                service === 'youtube-shorts' || !noCookie
                  ? 'https://www.youtube.com'
                  : 'https://www.youtube-nocookie.com',
              playerVars: {
                playsinline: isIOS ? 0 : 1,
                cc_load_policy: 0,
                cc_lang_pref: 'en',
                controls: defaultControls ? 1 : 0,
                disablekb: defaultControls ? 0 : 1,
                fs: defaultControls || isIOS ? 1 : 0,
                rel: 0,
                iv_load_policy: 3,
                autoplay: 0,
                hl: 'en',
                origin: window.location.origin
              }
            });

            // Get iframe window reference for message event filtering
            iframeWindow = playerRef.current?.getIframe()?.contentWindow;

            // Attach event listeners to YouTube player
            playerRef.current.addEventListener('onStateChange', onStateChange);
            playerRef.current.addEventListener('onError', onError);
            playerRef.current.addEventListener('onReady', onReady);
            // Listen for postMessage events from YouTube iframe
            window.addEventListener('message', onMessage);
          });
        })
        .catch((error) => {
          console.error(error);
        });

      // Cleanup: destroy player and remove event listeners on unmount
      return () => {
        if (playerRef.current) {
          playerRef.current.destroy();
          window.removeEventListener('message', onMessage);
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isIOS, id, service, defaultControls, noCookie, youtubePlayerRef]);

    // Expose player control methods via ref for parent components
    useImperativeHandle(
      ref,
      () => ({
        /**
         * Start video playback
         */
        play: () => {
          // if the video was previously buffering, set the state to buffering
          if (wasBuffering.current) setState('buffering');
          playerRef.current?.playVideo();
        },
        /**
         * Pause video playback
         */
        pause: () => {
          // if the video was previously buffering, set the state to paused (because the video was paused before seeking)
          if (wasBuffering.current) setState('paused');
          playerRef.current?.pauseVideo();
        },
        /**
         * Set the player volume
         * @param volume - Volume level between 0 and 1 (converted to YouTube's 0-100 range)
         */
        setVolume: (volume: number) => {
          // Convert 0-1 range to YouTube's 0-100 range
          playerRef.current?.setVolume(volume * 100);
        },
        /**
         * Get the video title
         * @returns Promise resolving to the video title
         */
        getTitle: () => {
          return new Promise((resolve) => {
            resolve(playerRef.current?.videoTitle);
          });
        },
        /**
         * Seek to a specific time in the video
         * @param time - Time in seconds to seek to
         * Updates the context immediately for responsive UI feedback, then seeks the player
         */
        seekTo: (time: number) => {
          // Update context immediately to ensure seekbar updates without delay
          setCurrentTime(time);
          // Seek to time (second parameter true = allow seeking before video is loaded)
          playerRef.current?.seekTo(time, true);
        },
        /**
         * Set the muted state of the player
         * @param muted - Whether the player should be muted
         */
        setMuted: (muted: boolean) => {
          if (muted) {
            playerRef.current?.mute();
          } else {
            playerRef.current?.unMute();
          }
        },
        /**
         * Set the playback rate/speed
         * @param playbackRate - Playback rate (e.g., 1.0 = normal, 1.5 = 1.5x speed, 0.5 = 0.5x speed)
         */
        setPlaybackRate: (playbackRate: number) => {
          playerRef.current?.setPlaybackRate(playbackRate);
        },
        /**
         * Get the raw YouTube Player API instance
         * @returns The YouTube Player API instance for direct access
         */
        instance: () => playerRef.current
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [playerRef]
    );

    return <div ref={youtubePlayerRef} className="youtube-player" />;
  }
);

export default Youtube;
