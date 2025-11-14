/* eslint-disable react-hooks/exhaustive-deps */
import { forwardRef, useContext, useEffect, useImperativeHandle, useRef } from 'react';
import { ContextProvider } from './player';
import { loadLibrary } from './helper/load';

/**
 * Video component that wraps an HTML5 video element with support for multiple video formats
 * (HLS, DASH, and standard video formats) and integrates with the player context.
 *
 * @param src - The video source URL (supports .m3u8, .mpd, or standard video formats)
 * @param ref - Ref to expose imperative methods for controlling the video
 */
const Video = forwardRef(({ src }: { src: string }, ref: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get state setters from the player context to sync video state
  const {
    setDuration,
    setCurrentTime,
    setStarted,
    setState,
    setReady,
    setVolume,
    setMuted,
    setPlaybackRate
  } = useContext(ContextProvider);

  useEffect(() => {
    if (!videoRef.current) return;

    // Track if video was playing before seeking to restore playback state
    let wasPlayingBeforeSeeking = false;

    /**
     * Loads a video URL into the video element without autoplay
     */
    const loadVideo = (url: any) => {
      if (!videoRef.current) return;

      videoRef.current.src = url;
      videoRef.current.autoplay = false;
      // this will load the video and prevent it from playing automatically
      videoRef.current.load();
    };

    // Handle different video source formats
    if (src.endsWith('.m3u8') || src.includes('stream.mux.com')) {
      // HLS (HTTP Live Streaming) format
      const url = !src.endsWith('.m3u8') ? `${src}.m3u8` : src;

      // Check if native HLS support is available
      if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        loadVideo(url);
      } else {
        // Use HLS.js library for browsers without native HLS support
        loadLibrary('Hls')
          .then(() => {
            if (window.Hls.isSupported()) {
              const hls = new window.Hls();
              hls.loadSource(url);
              hls.attachMedia(videoRef.current);
            }
          })
          .catch((error) => {
            console.error(error);
          });
      }
    } else if (src.endsWith('.mpd')) {
      // DASH (Dynamic Adaptive Streaming over HTTP) format
      loadLibrary('dashjs')
        .then(() => {
          const player = window.dashjs.MediaPlayer().create();
          player.initialize(videoRef.current, src, false);
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      // Standard video format (mp4, webm, etc.)
      loadVideo(src);
    }

    /**
     * Fired when enough data is available to start playback
     * Updates the ready state and duration in context
     */
    const onCanPlay = () => {
      setReady(true);
      setDuration(videoRef.current?.duration);
      // this will prevent the video from playing automatically (if the video is not autoplayed)
      if (!videoRef.current?.autoplay && !videoRef.current?.paused) videoRef.current?.pause();
    };

    /**
     * Fired continuously as the video plays
     * Updates the current playback time in context
     */
    const onTimeUpdate = () => {
      setCurrentTime(videoRef.current?.currentTime);
    };

    /**
     * Fired when playback starts
     * Marks the video as started and updates state to 'playing'
     */
    const onPlay = () => {
      wasPlayingBeforeSeeking = true;
      setStarted(true);
      setState('playing');
    };

    /**
     * Fired when playback is paused
     * Updates state to 'paused' and resets the seeking flag
     */
    const onPause = () => {
      wasPlayingBeforeSeeking = false;
      setState('paused');
    };

    /**
     * Fired when playback resumes after buffering
     * Restores playback if it was playing before seeking
     */
    const onPlaying = () => {
      if (wasPlayingBeforeSeeking) videoRef.current?.play();
    };

    /**
     * Fired when playback is waiting for data to load
     * Updates state to 'buffering'
     */
    const onWaiting = () => {
      setState('buffering');
    };

    /**
     * Fired when playback reaches the end
     * Resets the video to the beginning and pauses it
     */
    const onEnded = () => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.pause();
      }
    };

    /**
     * Fired when volume or mute state changes
     * Updates volume and muted state in context
     */
    const onVolumeChange = () => {
      setMuted(videoRef.current?.muted);
      setVolume(videoRef.current?.volume);
    };

    /**
     * Fired when playback rate changes
     * Updates playback rate in context
     */
    const onRateChange = () => {
      setPlaybackRate(videoRef.current?.playbackRate);
    };

    // Attach event listeners to the video element
    videoRef.current.addEventListener('canplay', onCanPlay);
    videoRef.current.addEventListener('timeupdate', onTimeUpdate);
    videoRef.current.addEventListener('play', onPlay);
    videoRef.current.addEventListener('pause', onPause);
    videoRef.current.addEventListener('ended', onEnded);
    videoRef.current.addEventListener('waiting', onWaiting);
    videoRef.current.addEventListener('playing', onPlaying);
    videoRef.current.addEventListener('volumechange', onVolumeChange);
    videoRef.current.addEventListener('ratechange', onRateChange);

    // Cleanup: remove all event listeners when component unmounts or src changes
    return () => {
      if (!videoRef.current) return;
      videoRef.current.removeEventListener('canplay', onCanPlay);
      videoRef.current.removeEventListener('timeupdate', onTimeUpdate);
      videoRef.current.removeEventListener('play', onPlay);
      videoRef.current.removeEventListener('pause', onPause);
      videoRef.current.removeEventListener('ended', onEnded);
      videoRef.current.removeEventListener('waiting', onWaiting);
      videoRef.current.removeEventListener('playing', onPlaying);
      videoRef.current.removeEventListener('volumechange', onVolumeChange);
      videoRef.current.removeEventListener('ratechange', onRateChange);
    };
  }, [src, videoRef]);

  /**
   * Exposes imperative methods to parent components via ref
   * Allows external control of video playback without direct DOM manipulation
   */
  useImperativeHandle(
    ref,
    () => ({
      /**
       * Starts video playback
       */
      play: () => {
        videoRef.current?.play();
      },
      /**
       * Pauses video playback
       */
      pause: () => {
        videoRef.current?.pause();
      },
      /**
       * Seeks to a specific time in the video.
       * Updates the context immediately to ensure the seekbar reflects the new position
       * for better user experience before the video element's timeupdate event fires.
       *
       * @param time - The target time in seconds
       */
      seekTo: (time: number) => {
        if (videoRef.current) {
          // Update context immediately to ensure seekbar updates without delay
          setCurrentTime(time);
          videoRef.current.currentTime = time;
        }
      },
      /**
       * Sets the video volume.
       *
       * @param volume - Volume level between 0 and 1
       */
      setVolume: (volume: number) => {
        if (videoRef.current) videoRef.current.volume = volume;
      },
      /**
       * Sets the muted state of the video.
       *
       * @param muted - Whether the video should be muted
       */
      setMuted: (muted: boolean) => {
        if (videoRef.current) videoRef.current.muted = muted;
      },
      /**
       * Sets the playback rate of the video.
       *
       * @param playbackRate - Playback speed (1.0 = normal, 2.0 = 2x speed, etc.)
       */
      setPlaybackRate: (playbackRate: number) => {
        if (videoRef.current) videoRef.current.playbackRate = playbackRate;
      },
      /**
       * Returns the underlying HTML5 video element instance.
       *
       * @returns The video element or null if not available
       */
      instance: () => videoRef.current
    }),
    [videoRef]
  );

  return (
    <video
      playsInline
      ref={videoRef}
      controls={false}
      style={{ width: '100%', height: '100%' }}
      controlsList="nodownload"
    />
  );
});

export default Video;
