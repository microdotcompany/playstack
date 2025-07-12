import './style.css';
import { forwardRef, useEffect, useMemo, type ReactNode } from 'react';
import getVideoId from 'get-video-id';
import GDrive from './gdrive';
import Bunny from './bunny';
import ReactPlayer, { type ReactPlayerProps } from './react-player';

export interface BunnyPlayerProviderProps {
  children: ReactNode;
}

export interface PlayerProps {
  theme?: string;
  bunny?: { id: string; hostname: string };
  src?: string;
  onTimeUpdate?: (time: { current: number; duration: number }) => void;
  onTitleChange?: (title: string) => void;
  reactPlayerProps?: ReactPlayerProps;
}

/**
 * Provider component that loads the Bunny Player JavaScript library.
 * This component should wrap your app to ensure the Bunny Player script
 * is loaded before any Bunny video components are rendered.
 */
export const BunnyPlayerProvider = ({ children }: BunnyPlayerProviderProps) => {
  useEffect(() => {
    if (!document.head.querySelector('#bunny-player-cdn')) {
      const script = document.createElement('script');
      script.src = 'https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js';
      script.type = 'text/javascript';
      script.id = 'bunny-player-cdn';
      document.head.appendChild(script);
    }
  }, []);

  return children;
};

/**
 * Main Player component that handles different video services and sources.
 * Supports Bunny, Google Drive, YouTube, and other video platforms.
 * Uses forwardRef to expose player controls to parent components.
 */
export const Player = forwardRef(
  (
    { theme = '#00B2FF', bunny, src, onTimeUpdate, onTitleChange, reactPlayerProps }: PlayerProps,
    ref: any
  ) => {
    // Memoized video configuration based on source or bunny ID
    const video = useMemo(() => {
      if (src || bunny?.id) {
        // Handle Bunny video service
        if (bunny?.id)
          return {
            thumbnail: `https://${bunny.hostname}/${bunny.id}/thumbnail.jpg`,
            service: 'bunny',
            src,
            id: bunny.id
          };

        if (!src) return null;

        // Parse video URL to extract service and ID
        const videoData = getVideoId(src);

        // Handle Google Drive URLs (not supported by get-video-id)
        if (!videoData.service && !videoData.id) {
          const pattern =
            // eslint-disable-next-line no-useless-escape
            /^https?:\/\/(?:drive\.google\.com|docs\.google\.com)\/(?:file\/d\/|open\?id=|drive\/folders\/|folderview\?id=|drive\/u\/)([^\/?#&]+)/;
          const match = src.match(pattern);

          if (match)
            return {
              service: 'gdrive',
              src: `https://drive.google.com/file/d/${match[1]}/preview`,
              id: match[1]
            };

          return null;
        }

        // Handle YouTube Shorts (convert to regular YouTube URL)
        const ytShorts = videoData.service === 'youtube' && src.includes('shorts');

        return {
          thumbnail:
            videoData.service === 'youtube'
              ? `https://i.ytimg.com/vi/${videoData.id}/sddefault.jpg`
              : undefined,
          src: ytShorts
            ? `https://www.youtube.com/watch?v=${videoData.id}`
            : videoData.service === 'youtube'
            ? `https://www.youtube-nocookie.com/embed/${videoData.id}`
            : src,
          service: ytShorts ? 'youtube-shorts' : videoData.service,
          id: videoData.id
        };
      }

      return null;
    }, [src, bunny]);

    // Apply theme color to CSS custom property
    useEffect(() => {
      if (theme) document.documentElement.style.setProperty('--player-theme-color', theme);
    }, [theme]);

    // Early return if no video configuration
    if (!video) return;

    // Render Bunny player for Bunny service
    if (video.service === 'bunny' && video.id)
      return (
        <Bunny
          src={video.src}
          thumbnail={video.thumbnail}
          id={video.id}
          onTimeUpdate={onTimeUpdate}
          ref={ref}
        />
      );

    // Early return if no source URL
    if (!video.src) return;

    // Render appropriate player based on service type
    return video.service === 'gdrive' ? (
      <GDrive src={video.src} ref={ref} />
    ) : (
      <ReactPlayer
        src={video.src}
        thumbnail={video.thumbnail}
        service={video.service}
        onTimeUpdate={onTimeUpdate}
        onTitleChange={onTitleChange}
        reactPlayerProps={reactPlayerProps}
        ref={ref}
      />
    );
  }
);
