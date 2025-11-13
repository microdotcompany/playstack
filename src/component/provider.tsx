import React, { useEffect } from 'react';

export interface ProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that dynamically loads video player libraries.
 * This component ensures all required third-party scripts are loaded
 * before the video players are rendered.
 */
export const Provider = ({ children }: ProviderProps) => {
  useEffect(() => {
    // Load YouTube iframe API for YouTube video playback
    const yt = document.createElement('script');
    yt.src = 'https://www.youtube.com/iframe_api';
    yt.async = true;
    document.head.appendChild(yt);

    // Load Bunny.net player script for Bunny.net video streaming
    const bunny = document.createElement('script');
    bunny.src = 'https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js';
    bunny.type = 'text/javascript';
    document.head.appendChild(bunny);

    // Load Vimeo player API for Vimeo video playback
    const vimeo = document.createElement('script');
    vimeo.src = 'https://player.vimeo.com/api/player.js';
    document.head.appendChild(vimeo);

    // Load HLS.js library for HTTP Live Streaming (HLS) video support
    const hls = document.createElement('script');
    hls.src = 'https://cdn.jsdelivr.net/npm/hls.js@1';
    document.head.appendChild(hls);

    // Load Dash.js library for MPEG-DASH video streaming support
    const dash = document.createElement('script');
    dash.src = 'https://cdn.dashjs.org/latest/modern/umd/dash.all.min.js';
    document.head.appendChild(dash);
  }, []);

  return children;
};
