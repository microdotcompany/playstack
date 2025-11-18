import { forwardRef, useContext, useEffect, useImperativeHandle, useRef } from 'react';
import { ContextProvider } from './player';
import { loadLibrary } from './helper/load';

/**
 * Props for the Vimeo player component
 */
interface VimeoProps {
  src: string;
  defaultControls?: boolean;
}

/**
 * Vimeo player component that wraps the Vimeo Player API
 * Integrates with the player context to sync state and expose control methods
 */
export const Vimeo = forwardRef(({ src, defaultControls }: VimeoProps, ref: any) => {
  // Reference to the Vimeo Player instance
  const playerRef = useRef<any>(null);

  // Reference to the DOM element where the Vimeo player will be embedded
  const vimeoPlayerRef = useRef<HTMLDivElement>(null);

  // Reference to store the previous buffering state
  const wasBuffering = useRef<boolean>(false);

  // Access player context methods and state
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
    setError,
    setLive
  } = useContext(ContextProvider);

  useEffect(() => {
    /**
     * Event handler: Called when the player is ready
     * Fetches and sets the video duration and live state
     */
    const onReady = () => {
      setReady(true);
      playerRef.current.getDuration().then(function (duration: number) {
        // if the video is live, set the live state to true
        setLive(duration === 0 ? true : false);
        setDuration(duration);
      });
    };

    /**
     * Event handler: Called when playback starts
     */
    const onPlay = () => {
      setStarted(true);
      setState('playing');
    };

    /**
     * Event handler: Called when playback is paused
     */
    const onPause = () => setState('paused');

    /**
     * Event handler: Called when buffering starts
     */
    const onBuffering = () => setState('buffering');

    /**
     * Event handler: Called when playback ends
     * Resets video to beginning and pauses to prevent auto-replay
     */
    const onEnded = () => {
      // if the video is ended reset the video to 0 and pause it (to prevent the video from playing again)
      playerRef.current
        .setCurrentTime(0)
        .then(async () => {
          await playerRef.current.pause().catch((err: any) => console.log('paused error', err));
        })
        .catch((error: any) => console.error('Error seeking to time:', error));
    };

    /**
     * Event handler: Called during playback to update current time
     */
    const onTimeUpdate = (data: any) => setCurrentTime(data.seconds);

    /**
     * Event handler: Called when an error occurs
     */
    const onError = (error: any) => {
      console.error('Error player:', error);
      if (error.name !== 'PlayInterrupted') setError(error);
    };

    /**
     * Event handler: Called when volume or mute state changes
     */
    const onVolumeChange = (data: any) => {
      setMuted(data.muted);
      setVolume(data.volume);
    };

    /**
     * Event handler: Called when playback rate changes
     */
    const onPlaybackRateChange = (data: any) => {
      setPlaybackRate(data.playbackRate);
    };

    /*
     * Event handler: Called when the video is seeked
     * Sets the state to playing if the video was previously buffering
     */
    const onSeeked = () => {
      // reset the buffering state
      wasBuffering.current = false;
      // set the state to playing if the video was previously buffering
      setState((state: string) => (state === 'buffering' ? 'playing' : state));
    };

    /**
     * Event handler: Called when the video enters or exits fullscreen mode
     * Prevents accidental fullscreen entry from double-tap gesture on non-iOS devices
     * when using custom controls (not defaultControls)
     */
    const onFullscreenChange = (data: any) => {
      // When video enters fullscreen via double-tap gesture on non-iOS devices with custom controls,
      // automatically exit fullscreen if the video hasn't started playing yet (time is at 0)
      // This prevents unwanted fullscreen mode when users accidentally double-tap
      if (data.fullscreen && !defaultControls && !isIOS) {
        // Check current playback time to see if video has started
        playerRef.current
          .getCurrentTime()
          .then((time: number) => {
            // If video is still at the beginning (time <= 0), exit fullscreen immediately
            // This handles the case where user double-tapped before playback started
            if (time <= 0) {
              playerRef.current
                .exitFullscreen()
                .catch((err: any) => console.log('exitFullscreen error', err));
            }
          })
          .catch((err: any) => console.log('onFullscreenChange getCurrenTime error', err));
      }
    };

    // Wait for Vimeo Player library to load, then initialize the player
    loadLibrary('Vimeo')
      .then(() => {
        // Create new Vimeo Player instance
        playerRef.current = new window.Vimeo.Player(vimeoPlayerRef.current, {
          url: src,
          autoplay: false,
          controls: true,
          muted: false,
          playsinline: true,
          fullscreen: defaultControls || isIOS ? true : false,
          keyboard: defaultControls ? true : false,
          title: false,
          transparent: false,
          portrait: false,
          byline: false,
          badge: false
        });

        // Wait for player to be ready before attaching event listeners
        playerRef.current
          .ready()
          .then(() => {
            onReady();
            // Attach all event listeners
            playerRef.current.on('play', onPlay);
            playerRef.current.on('pause', onPause);
            playerRef.current.on('ended', onEnded);
            playerRef.current.on('bufferstart', onBuffering);
            playerRef.current.on('seeked', onSeeked);
            playerRef.current.on('bufferend', onPlay);
            playerRef.current.on('timeupdate', onTimeUpdate);
            playerRef.current.on('error', onError);
            playerRef.current.on('volumechange', onVolumeChange);
            playerRef.current.on('playbackratechange', onPlaybackRateChange);
            playerRef.current.on('fullscreenchange', onFullscreenChange);
          })
          .catch((error: any) => {
            console.error('Error initializing Vimeo player:', error);
          });
      })
      .catch((error) => {
        console.error(error);
      });

    // Cleanup: Destroy player instance when component unmounts or dependencies change
    return () => {
      if (playerRef.current) {
        playerRef.current
          .destroy()
          .then(() => {
            console.log('Vimeo player destroyed');
          })
          .catch((error: any) => {
            console.error('Error destroying Vimeo player', error);
          });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, defaultControls, vimeoPlayerRef, isIOS]);

  /**
   * Expose player control methods to parent components via ref
   */
  useImperativeHandle(
    ref,
    () => ({
      /**
       * Starts video playback
       */
      play: () => {
        // if the video was previously buffering, set the state to buffering
        // this will show the buffering indicator to the user
        if (wasBuffering.current) setState('buffering');
        playerRef.current?.play();
      },
      /**
       * Pauses video playback
       */
      pause: () => {
        // if the video was previously buffering, set the state to paused (because the video was paused before seeking)
        if (wasBuffering.current) setState('paused');
        playerRef.current?.pause();
      },
      /**
       * Sets the video volume.
       *
       * @param volume - Volume level between 0 and 1
       */
      setVolume: (volume: number) => {
        playerRef.current?.setVolume(volume);
      },
      /**
       * Get the video title
       * @returns Promise resolving to the video title or null
       */
      getTitle: () => {
        return new Promise((resolve) => {
          if (!playerRef.current) return resolve(null);
          playerRef.current
            .getVideoTitle()
            .then((title: string) => resolve(title))
            .catch(() => resolve(null));
        });
      },
      /**
       * Seeks to a specific time in the video.
       * Manually sets buffering state since bufferstart event may not trigger during manual seeking.
       * Updates the context immediately to ensure the seekbar reflects the new position
       * for better user experience before the seeked event fires.
       *
       * @param time - The target time in seconds
       */
      seekTo: (time: number) => {
        // set the buffering state to true
        wasBuffering.current = true;
        // When manual seeking, bufferstart won't trigger, so we need to set the state to buffering manually.
        // When seek completes, the seeked event will trigger and set the state to playing.
        setState((state: string) => (state === 'playing' ? 'buffering' : state));
        // Set the current time in the context to the new time - ensures the seekbar is updated immediately (improves user experience)
        setCurrentTime(time);
        playerRef.current?.setCurrentTime(time);
      },
      /**
       * Sets the muted state of the video.
       *
       * @param muted - Whether the video should be muted
       */
      setMuted: (muted: boolean) => {
        playerRef.current?.setMuted(muted);
      },
      /**
       * Sets the playback rate of the video.
       *
       * @param playbackRate - Playback speed (1.0 = normal, 2.0 = 2x speed, etc.)
       */
      setPlaybackRate: (playbackRate: number) => {
        playerRef.current?.setPlaybackRate(playbackRate);
      },
      /**
       * Returns the underlying Vimeo Player instance.
       *
       * @returns The Vimeo Player instance or null if not available
       */
      instance: () => playerRef.current
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playerRef]
  );

  return <div ref={vimeoPlayerRef} className="vimeo-player" />;
});
