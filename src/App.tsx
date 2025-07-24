import { BunnyPlayerProvider, Player } from 'playstack';
import { useState } from 'react';

// Preview component for testing and demonstrating the player functionality
// This component wraps the Player with BunnyPlayerProvider to show how
// the player works with a sample YouTube video URL
const App = () => {
  const [src, setSrc] = useState('https://youtu.be/K-NDA_QpVYA');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      <BunnyPlayerProvider>
        <Player src={src} />
      </BunnyPlayerProvider>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '.75rem',
          background: '#f7f7fa',
          padding: '1rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          justifyContent: 'center'
        }}
      >
        {[
          { label: 'YouTube', url: 'https://youtu.be/K-NDA_QpVYA' },
          { label: 'Vimeo', url: 'https://vimeo.com/90509568' },
          { label: 'Twitch', url: 'https://www.twitch.tv/videos/106400740' },
          { label: 'Wistia', url: 'https://home.wistia.com/medias/e4a27b971d' },
          { label: 'Spotify', url: 'https://open.spotify.com/episode/5Jo9ncrz2liWiKj8inZwD2' },
          {
            label: 'Mux',
            url: 'https://stream.mux.com/maVbJv2GSYNRgS02kPXOOGdJMWGU1mkA019ZUjYE7VU7k'
          },
          {
            label: 'DASH',
            url: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps_640x360_800k.mpd'
          },
          {
            label: 'HLS',
            url: 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8'
          },
          {
            label: 'HTML',
            url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4'
          }
        ].map(({ label, url }) => (
          <button
            key={label}
            onClick={() => setSrc(url)}
            style={{
              padding: '0.5rem 1.25rem',
              border: 'none',
              borderRadius: '8px',
              background: '#4f8cff',
              color: '#fff',
              fontWeight: 500,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              transition: 'background 0.2s, transform 0.1s',
              outline: 'none'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#2563eb')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#4f8cff')}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default App;
