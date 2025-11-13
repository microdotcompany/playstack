import getVideoId from 'get-video-id';
import {
  createContext,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import Youtube from './youtube';
import './style.css';
import { Overlay } from './ui/overlay';
import { Controls } from './ui/controls';
import { Vimeo } from './vimeo';
import Video from './video';
import { Bunny } from './bunny';
import { GDrive } from './gdrive';

// Global type declaration for the HLS, Vimeo, and YouTube players
declare global {
  interface Window {
    Hls: any;
    Vimeo: any;
    onYouTubeIframeAPIReady?: () => void;
    YT: any;
    dashjs: any;
    playerjs: any;
  }
}

export interface PlayerProps {
  src: string;
  config?: {
    bunny?: {
      id: string;
      hostname: string;
    };
    theme?: string;
    defaultControls?: boolean;
    hidePlayerControls?: boolean;
  };
  onTimeUpdate?: (time: { current: number; duration: number }) => void;
  onDurationChange?: (duration: number) => void;
  onTitleChange?: (title?: string) => void;
  onReady?: (player: any) => void;
  onVolumeChange?: (data: { volume: number; muted: boolean }) => void; // it wont work on bunny and gdrive
  onPlaybackRateChange?: (playbackRate: number) => void; // it wont work on bunny and gdrive
}

// eslint-disable-next-line react-refresh/only-export-components
export const ContextProvider = createContext<any>({});

const defaultOptions = {
  volume: 0.5,
  muted: false
};

export const Player = forwardRef(
  (
    {
      src,
      config,
      onTimeUpdate,
      onDurationChange,
      onTitleChange,
      onReady,
      onVolumeChange,
      onPlaybackRateChange
    }: PlayerProps,
    ref: any
  ) => {
    // detect if the device is iOS
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    const playerRef = useRef<any>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    const [ready, setReady] = useState<boolean>(false);

    const [duration, setDuration] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [state, setState] = useState<string>('paused');
    const [started, setStarted] = useState<boolean>(false);
    const [volume, setVolume] = useState<number>(0.5);
    const [muted, setMuted] = useState<boolean>(false);
    const [playbackRate, setPlaybackRate] = useState<number>(1);

    const [error, setError] = useState<any>(null);

    const video: {
      thumbnail?: string;
      service?: string;
      src: string;
      id: string;
    } | null = useMemo(() => {
      const { bunny } = config || {};

      if (src || bunny?.id) {
        // Handle Bunny video service
        if (bunny?.id)
          return {
            thumbnail: `https://${bunny.hostname}/${bunny.id}/thumbnail.jpg`,
            service: 'bunny',
            src,
            id: bunny.id
          };

        // Only allow valid HTTPS URLs or blob URLs for video sources; otherwise, return null
        if (!src || !(src.startsWith('https://') || src.startsWith('blob:'))) return null;

        // Parse video URL to extract service and ID
        const videoData = getVideoId(src);

        // Handle Google Drive URLs (not supported by get-video-id)
        if (!videoData.service && !videoData.id) {
          const pattern =
            // eslint-disable-next-line no-useless-escape
            /^https?:\/\/(?:drive\.google\.com|docs\.google\.com)\/(?:file\/d\/|open\?id=|drive\/folders\/|folderview\?id=|drive\/u\/)([^\/?#&]+)/;
          const match = src.match(pattern);

          if (match) {
            // drive video id
            const id = match[1];
            return {
              service: 'gdrive',
              src: `https://drive.google.com/file/d/${id}/preview`,
              id
            };
          }

          return {
            service: 'other',
            src,
            id: src.split('/')?.pop() || ''
          };
        }

        // if no id, return null
        if (!videoData.id) return null;

        // Handle YouTube Shorts (convert to regular YouTube URL)
        const ytShorts = videoData.service === 'youtube' && src.includes('shorts');

        return {
          thumbnail:
            videoData.service === 'youtube'
              ? `https://i.ytimg.com/vi/${videoData.id}/sddefault.jpg`
              : undefined,
          src,
          service: ytShorts ? 'youtube-shorts' : videoData.service,
          id: videoData.id
        };
      }

      return null;
    }, [src, config]);

    useEffect(() => {
      setDuration(0);
      setCurrentTime(0);
      setState('paused');
      setStarted(false);
      setReady(false);
      setVolume(defaultOptions.volume);
      setMuted(defaultOptions.muted);
      setPlaybackRate(1);
      setError(null);
    }, [video]);

    useEffect(() => {
      document.documentElement.style.setProperty(
        '--player-theme-color',
        config?.theme || '#00B2FF'
      );
    }, [config]);

    useEffect(() => {
      if (onTimeUpdate) onTimeUpdate({ current: currentTime, duration: duration });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration, currentTime]);

    useEffect(() => {
      if (onDurationChange) onDurationChange(duration);

      if (onTitleChange && ready && typeof playerRef.current?.getTitle === 'function')
        playerRef.current.getTitle().then((title: string) => {
          onTitleChange(title);
        });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration, ready]);

    useEffect(() => {
      if (ready) {
        if (playerRef.current) {
          playerRef.current.setVolume?.(isIOS ? 1 : defaultOptions.volume);
          playerRef.current.setMuted?.(defaultOptions.muted);
        }

        if (onReady && !started) onReady(playerRef.current);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, started, playerRef, isIOS]);

    useEffect(() => {
      if (onVolumeChange) onVolumeChange({ volume, muted });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [volume, muted]);

    useEffect(() => {
      if (onPlaybackRateChange) onPlaybackRateChange(playbackRate);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playbackRate]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useImperativeHandle(ref, () => playerRef.current, [playerRef, ready]);

    return (
      <ContextProvider.Provider
        value={{
          duration,
          setDuration,
          currentTime,
          setCurrentTime,
          state,
          setState,
          started,
          setStarted,
          ready,
          setReady,
          volume,
          setVolume,
          isIOS,
          muted,
          setMuted,
          playbackRate,
          setPlaybackRate,
          error,
          setError
        }}
      >
        <div
          ref={containerRef}
          className={`playstack-player-container ${video?.service} ${started ? 'started' : ''} ${
            config?.defaultControls || error ? 'default-controls' : ''
          }`}
        >
          {video?.service === 'youtube' || video?.service === 'youtube-shorts' ? (
            <Youtube
              ref={playerRef}
              id={video.id}
              service={video.service}
              defaultControls={config?.defaultControls}
            />
          ) : video?.service === 'vimeo' ? (
            <Vimeo
              ref={playerRef}
              id={video.id}
              src={video.src}
              defaultControls={config?.defaultControls}
            />
          ) : video?.service === 'bunny' ? (
            <Bunny {...video} ref={(player) => (playerRef.current = player)} />
          ) : video?.service === 'gdrive' ? (
            <GDrive src={video.src} ref={playerRef} />
          ) : (
            video?.src && <Video src={video.src} ref={playerRef} />
          )}

          {!config?.defaultControls &&
            !config?.hidePlayerControls &&
            video?.service !== 'bunny' &&
            video?.service !== 'gdrive' && (
              <>
                <Overlay
                  deferToIframeControls={
                    video?.service === 'vimeo' ||
                    video?.service === 'youtube' ||
                    video?.service === 'youtube-shorts'
                  }
                  thumbnail={video?.thumbnail}
                  player={playerRef}
                />
                <Controls
                  container={containerRef}
                  player={playerRef}
                  showFullscreenOnIOS={isIOS && video?.service === 'other'}
                />
              </>
            )}
        </div>
      </ContextProvider.Provider>
    );
  }
);
