import { forwardRef, useContext, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { ContextProvider } from './player';
import { waitForLibrary } from './helper/wait';

/**
 * Props for the Vimeo player component
 */
interface VimeoProps {
  src: string;
  id: string;
  defaultControls?: boolean;
}

/**
 * Vimeo player component that wraps the Vimeo Player API
 * Integrates with the player context to sync state and expose control methods
 */
export const Vimeo = forwardRef(({ src, id, defaultControls }: VimeoProps, ref: any) => {
  // Reference to the Vimeo Player instance
  const playerRef = useRef<any>(null);

  // Reference to the DOM element where the Vimeo player will be embedded
  const vimeoPlayerRef = useRef<HTMLDivElement>(null);

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
    setError
  } = useContext(ContextProvider);

  // Construct the Vimeo player URL with hash parameter for unlisted videos
  const url = useMemo(() => {
    const hash = new URLSearchParams(src).get('h');
    return `https://player.vimeo.com/video/${id}?h=${hash}`;
  }, [src, id]);

  useEffect(() => {
    /**
     * Event handler: Called when the player is ready
     * Fetches and sets the video duration
     */
    const onReady = () => {
      setReady(true);
      playerRef.current.getDuration().then(function (duration: number) {
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
      setError(error);
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

    // Wait for Vimeo Player library to load, then initialize the player
    waitForLibrary('Vimeo')
      .then(() => {
        // Create new Vimeo Player instance
        playerRef.current = new window.Vimeo.Player(vimeoPlayerRef.current, {
          url: url,
          autoplay: false,
          controls: true,
          muted: false,
          playsinline: isIOS ? false : true,
          fullscreen: defaultControls || isIOS ? true : false,
          keyboard: defaultControls ? true : false
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
            playerRef.current.on('seeked', onPlay);
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

    // Cleanup: Destroy player instance when component unmounts or dependencies change
    return () => {
      if (playerRef.current) playerRef.current.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, defaultControls, vimeoPlayerRef, isIOS]);

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
        playerRef.current?.play();
      },
      /**
       * Pauses video playback
       */
      pause: () => {
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
        // When manual seeking, bufferstart won't trigger, so we need to set the state to buffering manually.
        // When seek completes, the seeked event will trigger and set the state to playing.
        setState('buffering');
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
