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

/**
 * Global type declarations for third-party video player libraries
 * These are loaded dynamically at runtime and need to be declared globally
 * to avoid TypeScript errors when accessing window properties
 */
declare global {
  interface Window {
    Hls: any; // HLS.js library for HTTP Live Streaming
    Vimeo: any; // Vimeo Player SDK
    YT: any; // YouTube IFrame API
    dashjs: any; // DASH.js library for MPEG-DASH streaming
    playerjs: any; // Player.js library for Bunny.net player
  }
}

/**
 * Player component props interface
 * Defines all configurable options and event callbacks for the video player
 */
export interface PlayerProps {
  src: string; // Video source URL
  config?: {
    bunny?: {
      id: string; // Bunny.net video ID
      hostname: string; // Bunny.net CDN hostname
    };
    theme?: string; // CSS custom property for player theme color
    defaultControls?: boolean; // Use native browser/iframe controls instead of custom controls
    hidePlayerControls?: boolean; // Hide custom player controls entirely
  };
  onTimeUpdate?: (time: { current: number; duration: number }) => void; // Fires when playback time updates
  onDurationChange?: (duration: number) => void; // Fires when video duration is available
  onTitleChange?: (title?: string) => void; // Fires when video title is available
  onReady?: (player: any) => void; // Fires when player is ready
  onVolumeChange?: (data: { volume: number; muted: boolean }) => void; // Fires when volume/mute changes (not supported on bunny and gdrive)
  onPlaybackRateChange?: (playbackRate: number) => void; // Fires when playback speed changes (not supported on bunny and gdrive)
}

/**
 * React Context for sharing player state between Player component and child components
 * Used by Controls, Overlay, and individual player implementations
 */
// eslint-disable-next-line react-refresh/only-export-components
export const ContextProvider = createContext<any>({});

/**
 * Default player options applied on initialization
 */
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
    /**
     * iOS Detection Logic
     * Detects iOS devices including iPad (which reports as MacIntel in newer iOS versions)
     * This is important because iOS has special handling for video playback and volume control
     */
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // Ref to the actual player instance (Youtube, Vimeo, Video, etc.)
    const playerRef = useRef<any>(null);

    // Ref to the container div for positioning and fullscreen functionality
    const containerRef = useRef<HTMLDivElement>(null);

    // Player state management
    const [ready, setReady] = useState<boolean>(false);
    const [duration, setDuration] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [state, setState] = useState<string>('paused');
    const [started, setStarted] = useState<boolean>(false);
    const [volume, setVolume] = useState<number>(0.5);
    const [muted, setMuted] = useState<boolean>(false);
    const [playbackRate, setPlaybackRate] = useState<number>(1);
    const [error, setError] = useState<any>(null);
    const [live, setLive] = useState<boolean>(false);

    /**
     * Video Service Detection and Parsing
     * This memoized value parses the video source URL to determine:
     * - Which service provider (YouTube, Vimeo, Bunny, Google Drive, or generic)
     * - The video ID for that service
     * - The thumbnail URL (if available)
     *
     * Processing order:
     * 1. Bunny.net videos (requires config.bunny)
     * 2. URL validation (must be HTTPS or blob URL)
     * 3. Google Drive URLs (custom regex parsing)
     * 4. YouTube/Vimeo (via get-video-id library)
     * 5. Generic video URLs (fallback)
     */
    const video: {
      thumbnail?: string;
      service?: string;
      src: string;
      id: string;
    } | null = useMemo(() => {
      const { bunny } = config || {};

      if (src || bunny?.id) {
        // Handle Bunny video service (requires explicit config)
        if (bunny?.id)
          return {
            thumbnail: `https://${bunny.hostname}/${bunny.id}/thumbnail.jpg`,
            service: 'bunny',
            src,
            id: bunny.id
          };

        // Security: Only allow valid HTTPS URLs or blob URLs for video sources
        // Prevents XSS attacks and ensures secure video loading
        if (!src || !(src.startsWith('https://') || src.startsWith('blob:'))) return null;

        // Parse video URL to extract service and ID using get-video-id library
        // Supports YouTube and Vimeo out of the box
        const videoData = getVideoId(src);

        // Handle Google Drive URLs (not supported by get-video-id library)
        // Uses custom regex to extract file ID from various Google Drive URL formats
        if (!videoData.service && !videoData.id) {
          const pattern =
            // eslint-disable-next-line no-useless-escape
            /^https?:\/\/(?:drive\.google\.com|docs\.google\.com)\/(?:file\/d\/|open\?id=|drive\/folders\/|folderview\?id=|drive\/u\/)([^\/?#&]+)/;
          const match = src.match(pattern);

          if (match) {
            // Extract Google Drive file ID and construct preview URL
            const id = match[1];
            return {
              service: 'gdrive',
              src: `https://drive.google.com/file/d/${id}/preview`,
              id
            };
          }

          // Fallback: Treat as generic video URL
          return {
            service: 'other',
            src,
            id: src.split('/')?.pop() || ''
          };
        }

        // Validation: If get-video-id couldn't extract an ID, return null
        if (!videoData.id) return null;

        // Special handling for YouTube Shorts
        // YouTube Shorts use a different URL format but can be played with regular YouTube player
        const ytShorts = videoData.service === 'youtube' && src.includes('shorts');

        return {
          // Generate YouTube thumbnail URL if available
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

    /**
     * Reset player state when video source changes
     * This ensures clean state when switching between videos
     */
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
      setLive(false);
    }, [video]);

    /**
     * Apply theme color to CSS custom property
     * Allows dynamic theming of player controls via CSS
     */
    useEffect(() => {
      document.documentElement.style.setProperty(
        '--player-theme-color',
        config?.theme || '#00B2FF'
      );
    }, [config]);

    /**
     * Callback: Notify parent component of time updates
     * Fires whenever currentTime or duration changes
     */
    useEffect(() => {
      if (onTimeUpdate) onTimeUpdate({ current: currentTime, duration: duration });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration, currentTime]);

    /**
     * Callback: Notify parent component of duration changes
     * Also attempts to fetch and notify video title when player is ready
     */
    useEffect(() => {
      if (onDurationChange) onDurationChange(duration);

      if (onTitleChange && ready && typeof playerRef.current?.getTitle === 'function')
        playerRef.current.getTitle().then((title: string) => {
          onTitleChange(title);
        });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration, ready]);

    /**
     * Initialize player settings when ready
     * Sets default volume and mute state, and calls onReady callback
     * Note: iOS requires volume to be set to 1 due to platform restrictions
     */
    useEffect(() => {
      if (ready) {
        if (playerRef.current) {
          // iOS doesn't allow programmatic volume control, must be set to 1
          playerRef.current.setVolume?.(isIOS ? 1 : defaultOptions.volume);
          playerRef.current.setMuted?.(defaultOptions.muted);
        }

        // Call onReady callback only once (when started is false)
        if (onReady && !started) onReady(playerRef.current);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, started, playerRef, isIOS]);

    /**
     * Callback: Notify parent component of volume/mute changes
     */
    useEffect(() => {
      if (onVolumeChange) onVolumeChange({ volume, muted });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [volume, muted]);

    /**
     * Callback: Notify parent component of playback rate changes
     */
    useEffect(() => {
      if (onPlaybackRateChange) onPlaybackRateChange(playbackRate);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playbackRate]);

    /**
     * Expose player instance to parent component via ref
     * Allows parent to control player programmatically (play, pause, seek, etc.)
     */
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
          setError,
          live,
          setLive
        }}
      >
        <div
          ref={containerRef}
          className={`playstack-player-container ${video?.service} ${started ? 'started' : ''} ${
            config?.defaultControls || error ? 'default-controls' : ''
          }`}
        >
          {/**
           * Conditional rendering of video player components based on detected service
           * Each service has its own implementation with different capabilities
           */}
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
            // Generic HTML5 video player for direct video URLs and HLS/DASH streams
            video?.src && <Video src={video.src} ref={playerRef} />
          )}

          {/**
           * Conditional rendering of custom controls and overlay
           * Only shown when:
           * - defaultControls is false (not using native controls)
           * - hidePlayerControls is false (controls not explicitly hidden)
           * - Service is not bunny or gdrive (these have built-in controls)
           */}
          {!config?.defaultControls &&
            !config?.hidePlayerControls &&
            video?.service !== 'bunny' &&
            video?.service !== 'gdrive' && (
              <>
                {/**
                 * Overlay component: Handles play button, loading states, and click-to-play
                 * deferToIframeControls: For YouTube/Vimeo, let iframe handle initial play
                 */}
                <Overlay
                  deferToIframeControls={
                    video?.service === 'vimeo' ||
                    video?.service === 'youtube' ||
                    video?.service === 'youtube-shorts'
                  }
                  thumbnail={video?.thumbnail}
                  player={playerRef}
                />
                {/**
                 * Controls component: Custom playback controls (play/pause, seek, volume, etc.)
                 */}
                <Controls container={containerRef} player={playerRef} service={video?.service} />
              </>
            )}
        </div>
      </ContextProvider.Provider>
    );
  }
);
