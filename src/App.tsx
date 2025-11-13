import { Player, Provider } from 'playstack';
import { useRef, useState } from 'react';

// Preview component for testing and demonstrating the player functionality
// the player works with a sample YouTube video URL
const App = () => {
  const playerRef = useRef<any>(null);
  const [src, setSrc] = useState('https://youtu.be/K-NDA_QpVYA');
  const [customMode, setCustomMode] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      <Provider>
        <Player ref={playerRef} src={src} />
      </Provider>
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
        {!customMode ? (
          <>
            {[
              { label: 'YouTube 1', url: 'https://youtu.be/K-NDA_QpVYA' },
              { label: 'YouTube 2', url: 'https://www.youtube.com/watch?v=_cMxraX_5RE' },
              { label: 'YouTube Shorts', url: 'https://www.youtube.com/shorts/tLZjL-dMH_g' },
              { label: 'Vimeo', url: 'https://vimeo.com/90509568' },
              {
                label: 'Mux 1',
                url: 'https://stream.mux.com/maVbJv2GSYNRgS02kPXOOGdJMWGU1mkA019ZUjYE7VU7k'
              },
              {
                label: 'Mux 2',
                url: 'https://stream.mux.com/v69RSHhFelSm4701snP22dYz2jICy4E4FUyk02rW4gxRM.m3u8'
              },
              {
                label: 'DASH',
                url: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps_640x360_800k.mpd'
              },
              {
                label: 'HLS',
                url: 'https://files.vidstack.io/sprite-fight/hls/stream.m3u8'
              },
              {
                label: 'HTML',
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
              }
            ].map(({ label, url }) => (
              <button
                key={label}
                onClick={() => setSrc(url)}
                style={{
                  padding: '0.5rem 1.25rem',
                  border: 'none',
                  borderRadius: '8px',
                  background: src === url ? '#2563eb' : '#4f8cff',
                  color: '#fff',
                  fontWeight: 500,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  transition: 'background 0.2s, transform 0.1s',
                  outline: 'none'
                }}
                onMouseOver={(e) => {
                  if (src !== url) e.currentTarget.style.background = '#2563eb';
                }}
                onMouseOut={(e) => {
                  if (src !== url) e.currentTarget.style.background = '#4f8cff';
                }}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setCustomMode(true)}
              style={{
                padding: '0.5rem 1.25rem',
                border: 'none',
                borderRadius: '8px',
                background: '#10b981',
                color: '#fff',
                fontWeight: 500,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'background 0.2s, transform 0.1s',
                outline: 'none'
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#059669')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#10b981')}
            >
              Custom
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Enter custom URL"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid #ccc',
                fontSize: '1rem',
                width: '320px'
              }}
            />
            <button
              onClick={() => {
                setSrc(customUrl);
                setCustomMode(false);
                setCustomUrl('');
              }}
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
              disabled={!customUrl}
            >
              Show
            </button>
            <button
              onClick={() => {
                setCustomMode(false);
                setSrc('https://youtu.be/K-NDA_QpVYA');
              }}
              style={{
                padding: '0.5rem 1.25rem',
                border: 'none',
                borderRadius: '8px',
                background: '#e5e7eb',
                color: '#111',
                fontWeight: 500,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'background 0.2s, transform 0.1s',
                outline: 'none'
              }}
            >
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
