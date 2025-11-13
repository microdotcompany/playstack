/* eslint-disable react-hooks/exhaustive-deps */
import { forwardRef, useContext, useEffect, useImperativeHandle, useRef } from 'react';
import { ContextProvider } from './player';
import { waitForLibrary } from './helper/wait';

const Video = forwardRef(({ src }: { src: string }, ref: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);

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

    let wasPlayingBeforeSeeking = false;

    const loadVideo = (url: any) => {
      if (!videoRef.current) return;

      videoRef.current.src = url;
      videoRef.current.autoplay = false;
      // this will load the video and prevent it from playing automatically
      videoRef.current.load();
    };

    if (src.endsWith('.m3u8') || src.includes('stream.mux.com')) {
      const url = !src.endsWith('.m3u8') ? `${src}.m3u8` : src;

      if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        loadVideo(url);
      } else {
        waitForLibrary('Hls')
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
      waitForLibrary('dashjs')
        .then(() => {
          const player = window.dashjs.MediaPlayer().create();
          player.initialize(videoRef.current, src, false);
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      loadVideo(src);
    }

    const onCanPlay = () => {
      setReady(true);
      setDuration(videoRef.current?.duration);
      // this will prevent the video from playing automatically (if the video is not autoplayed)
      if (!videoRef.current?.autoplay && !videoRef.current?.paused) videoRef.current?.pause();
    };

    const onTimeUpdate = () => {
      setCurrentTime(videoRef.current?.currentTime);
    };

    const onPlay = () => {
      wasPlayingBeforeSeeking = true;
      setStarted(true);
      setState('playing');
    };

    const onPause = () => {
      wasPlayingBeforeSeeking = false;
      setState('paused');
    };

    const onPlaying = () => {
      if (wasPlayingBeforeSeeking) videoRef.current?.play();
    };

    const onWaiting = () => {
      setState('buffering');
    };

    const onEnded = () => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.pause();
      }
    };

    const onVolumeChange = () => {
      setMuted(videoRef.current?.muted);
      setVolume(videoRef.current?.volume);
    };

    const onRateChange = () => {
      setPlaybackRate(videoRef.current?.playbackRate);
    };

    videoRef.current.addEventListener('canplay', onCanPlay);
    videoRef.current.addEventListener('timeupdate', onTimeUpdate);
    videoRef.current.addEventListener('play', onPlay);
    videoRef.current.addEventListener('pause', onPause);
    videoRef.current.addEventListener('ended', onEnded);
    videoRef.current.addEventListener('waiting', onWaiting);
    videoRef.current.addEventListener('playing', onPlaying);
    videoRef.current.addEventListener('volumechange', onVolumeChange);
    videoRef.current.addEventListener('ratechange', onRateChange);

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

  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        videoRef.current?.play();
      },
      pause: () => {
        videoRef.current?.pause();
      },
      seekTo: (time: number) => {
        if (videoRef.current) videoRef.current.currentTime = time;
      },
      setVolume: (volume: number) => {
        if (videoRef.current) videoRef.current.volume = volume;
      },
      setMuted: (muted: boolean) => {
        if (videoRef.current) videoRef.current.muted = muted;
      },
      setPlaybackRate: (playbackRate: number) => {
        if (videoRef.current) videoRef.current.playbackRate = playbackRate;
      },
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
