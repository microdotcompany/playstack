# Playstack

A modern, customizable video player component for React that supports multiple video services including YouTube, Vimeo, Bunny Stream, Google Drive, Mux, and more. Built with TypeScript and featuring a beautiful, responsive UI with custom controls.

## Features

- 🎥 **Multi-platform Support**: YouTube, Vimeo, Bunny Stream, Google Drive, Mux, HLS, DASH, and direct video URLs
- 🎨 **Customizable UI**: Modern, responsive design with theme customization (YouTube, Vimeo, and direct video platforms)
- ⌨️ **Keyboard Controls**: Full keyboard navigation support
- 📱 **Mobile Optimized**: Touch-friendly controls and iOS fullscreen support
- 🎛️ **Advanced Controls**: Custom seekbar, volume control, playback speed, and fullscreen
- 🔧 **TypeScript**: Fully typed with comprehensive interfaces
- 🎯 **Accessible**: Built with accessibility in mind using Radix UI components

## Installation

```bash
npm install playstack
# or
yarn add playstack
```

### Import CSS Styles

To use the custom player controls, you need to import the CSS styles:

```tsx
import 'playstack/dist/style.css';
```

**Note**: The CSS import is required for the custom controls to display properly. Without it, the player will still function but will use the default styling of the underlying video platforms.

## Quick Start

**Important**: The `Provider` component is required to load all necessary video player libraries. Wrap your app or player components with it.

### YouTube

```tsx
import { Player, Provider } from 'playstack';

function App() {
  return (
    <Provider>
      <Player
        src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        onTimeUpdate={(time) => console.log('Current time:', time.current)}
      />
    </Provider>
  );
}
```

### Vimeo

```tsx
import { Player, Provider } from 'playstack';

function App() {
  return (
    <Provider>
      <Player
        src="https://vimeo.com/123456789"
        onTimeUpdate={(time) => console.log('Current time:', time.current)}
      />
    </Provider>
  );
}
```

### Bunny Stream Integration

**Important**: Bunny Stream requires both `src` (iframe URL) and `config.bunny` props to work properly. If `src` is not provided, the player will show a loading indicator indefinitely.

```tsx
import { Player, Provider } from 'playstack';

function App() {
  return (
    <Provider>
      <Player
        src="https://iframe.mediadelivery.net/embed/your-library/your-video-id"
        config={{
          bunny: {
            id: 'your-video-id',
            hostname: 'your-library.b-cdn.net'
          }
        }}
        onTimeUpdate={(time) => console.log('Current time:', time.current)}
      />
    </Provider>
  );
}
```

## API Reference

### Player Props

| Prop                        | Type                                                    | Default     | Description                                                                                      |
| --------------------------- | ------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `src`                       | `string`                                                | -           | Direct video URL (YouTube, Vimeo, Mux, HLS, DASH, direct video, etc.) or Bunny Stream iframe URL |
| `config`                    | `object`                                                | -           | Configuration object (see below)                                                                 |
| `config.bunny`              | `{ id: string; hostname: string }`                      | -           | Bunny Stream configuration (requires `src` to be provided)                                       |
| `config.theme`              | `string`                                                | `'#00B2FF'` | Theme color for player controls (YouTube, Vimeo, and direct video platforms only)                |
| `config.defaultControls`    | `boolean`                                               | `false`     | Use default platform controls instead of custom controls                                         |
| `config.hidePlayerControls` | `boolean`                                               | `false`     | Hide all player controls (overlay and controls bar)                                              |
| `onTimeUpdate`              | `(time: { current: number; duration: number }) => void` | -           | Callback for time updates                                                                        |
| `onDurationChange`          | `(duration: number) => void`                            | -           | Callback when video duration is available                                                        |
| `onTitleChange`             | `(title?: string) => void`                              | -           | Callback when video title is available (YouTube and Vimeo only)                                  |
| `onReady`                   | `(player: any) => void`                                 | -           | Callback when player is ready (receives player instance)                                         |
| `onVolumeChange`            | `(data: { volume: number; muted: boolean }) => void`    | -           | Callback when volume or mute state changes (does not work on Bunny Stream and Google Drive)      |
| `onPlaybackRateChange`      | `(playbackRate: number) => void`                        | -           | Callback when playback rate changes (does not work on Bunny Stream and Google Drive)             |

### Provider

Required wrapper component that loads all necessary video player libraries (YouTube API, Vimeo API, Bunny Player.js, HLS.js, Dash.js).

```tsx
<Provider>{/* Your app components */}</Provider>
```

### Player Ref

The Player component supports ref forwarding. You can use a callback function that receives the player object.

**Note**: The ref receives different player objects depending on the platform:

- **YouTube**: YouTube Player instance with methods like `playVideo()`, `pauseVideo()`, `seekTo()`, etc.
- **Vimeo**: Vimeo Player instance with methods like `play()`, `pause()`, `setCurrentTime()`, etc.
- **Direct video, HLS, DASH**: HTMLVideoElement-compatible object with methods like `play()`, `pause()`, `seekTo()`, `setVolume()`, etc.
- **Bunny Stream**: Bunny Player.js instance
- **Google Drive**: iframe element only (no player functionality - just an iframe embed)

## Supported Platforms

### YouTube

- **Features**: Full YouTube support including Shorts, automatic thumbnail generation
- **URL Formats**: Standard YouTube URLs, YouTube Shorts, YouTube-nocookie
- **Usage**: Simply pass the YouTube URL to the `src` prop
- **Theme Support**: ✅ Full theme customization
- **iOS Fullscreen**: ✅ Native fullscreen support on iOS (video automatically enters fullscreen when playback starts)
- **Example**:
  ```tsx
  <Player src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
  <Player src="https://youtu.be/dQw4w9WgXcQ" />
  <Player src="https://www.youtube.com/shorts/dQw4w9WgXcQ" />
  ```

### Vimeo

- **Features**: Full Vimeo support with automatic video detection
- **URL Formats**: Standard Vimeo URLs, Vimeo player URLs
- **Usage**: Simply pass the Vimeo URL to the `src` prop
- **Theme Support**: ✅ Full theme customization
- **iOS Fullscreen**: ✅ Native fullscreen support on iOS (video automatically enters fullscreen when playback starts)
- **Example**:
  ```tsx
  <Player src="https://vimeo.com/123456789" />
  <Player src="https://player.vimeo.com/video/123456789" />
  <Player src="https://vimeo.com/channels/staffpicks/123456789" />
  ```

### Bunny Stream

- **Documentation**: [Bunny Stream Embedding Documentation](https://docs.bunny.net/docs/stream-embedding-videos)
- **Features**: Native integration with Bunny's Player.js library
- **Requirements**: Both `src` (iframe URL) and `config.bunny` (configuration) props must be provided
- **Theme Support**: ❌ Uses Bunny's native player (theme only affects loading indicator)
- **iOS Fullscreen**: ✅ Full native iOS fullscreen support
- **Usage**:
  ```tsx
  <Player
    src="https://iframe.mediadelivery.net/embed/your-library/your-video-id"
    config={{
      bunny: {
        id: 'your-video-id',
        hostname: 'your-library.b-cdn.net'
      }
    }}
  />
  ```
- **Note**: If `src` is missing, the player will display a loading indicator

### Google Drive

- **Features**: Simple iframe embedding only (no player functionality)
- **Limitation**: Just an iframe wrapper - no controls, no callbacks, no player methods
- **Theme Support**: ❌ Uses Google Drive's native iframe (no theme customization)
- **iOS Fullscreen**: ✅ Full native iOS fullscreen support
- **Note**: The component hides Google Drive's "Open" link button for cleaner UI. This is a basic iframe embed with no video player features.

### Mux

- **Features**: Native support for Mux video streams (HLS)
- **URL Formats**: Mux stream URLs (automatically converts to `.m3u8` if needed)
- **Theme Support**: ✅ Full theme customization
- **iOS Fullscreen**: ✅ Native fullscreen support on iOS (video enters fullscreen when playback starts)
- **Example**:
  ```tsx
  <Player src="https://stream.mux.com/your-video-id" />
  <Player src="https://stream.mux.com/your-video-id.m3u8" />
  ```

### Direct Video, HLS, DASH

- **Features**: Native HTML5 video support, including HLS and DASH streams
- **Theme Support**: ✅ Full theme customization
- **iOS Fullscreen**: ✅ Native fullscreen support on iOS (video enters fullscreen when playback starts)
- **Example**:
  ```tsx
  <Player src="https://example.com/video.mp4" />
  <Player src="https://example.com/stream.m3u8" />
  <Player src="https://example.com/stream.mpd" />
  ```

## Keyboard Controls

| Key     | Action             |
| ------- | ------------------ |
| `Space` | Play/Pause         |
| `←`     | Rewind 10 seconds  |
| `→`     | Forward 10 seconds |
| `↑`     | Increase volume    |
| `↓`     | Decrease volume    |
| `M`     | Mute/Unmute        |

**Note**: On iOS devices, the volume bar is hidden for custom controls because browsers do not allow programmatic volume control.

## Customization

### Theme Colors

**Note**: Theme customization only works with YouTube, Vimeo, and direct video platforms.

```tsx
<Player src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" config={{ theme: '#FF6B6B' }} />
```

### Default Controls

You can use the platform's default controls instead of custom controls:

```tsx
<Player src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" config={{ defaultControls: true }} />
```

### Hide Controls

You can hide all custom controls:

```tsx
<Player src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" config={{ hidePlayerControls: true }} />
```

## Advanced Features

### Time Tracking

```tsx
<Player
  src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  onTimeUpdate={(time) => {
    console.log(`Progress: ${time.current}/${time.duration}`);
    // Save progress to localStorage, analytics, etc.
  }}
/>
```

### Duration Tracking

```tsx
<Player
  src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  onDurationChange={(duration) => {
    console.log(`Video duration: ${duration} seconds`);
  }}
/>
```

### Title Extraction

**Note**: Title extraction only works with YouTube and Vimeo platforms.

```tsx
<Player
  src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  onTitleChange={(title) => {
    document.title = `Watching: ${title}`;
  }}
/>
```

### Player Ready Callback

```tsx
<Player
  src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  onReady={(player) => {
    console.log('Player ready:', player);
    // Access player methods directly
    // player.play(), player.pause(), etc.
  }}
/>
```

### Volume and Playback Rate Tracking

```tsx
<Player
  src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  onVolumeChange={({ volume, muted }) => {
    console.log(`Volume: ${volume}, Muted: ${muted}`);
  }}
  onPlaybackRateChange={(rate) => {
    console.log(`Playback rate: ${rate}x`);
  }}
/>
```

**Note**: `onVolumeChange` and `onPlaybackRateChange` do not work with Bunny Stream and Google Drive.

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Mobile Support

- **iOS Safari**:

  - YouTube, Vimeo, direct video, HLS, DASH, Mux: Native fullscreen support (video automatically enters fullscreen on play)
  - Bunny Stream and Google Drive: Full native iOS fullscreen support
  - **Note**: The volume bar will not be displayed on iOS devices for custom controls, as programmatic volume control is not supported by iOS browsers.

- **Android Chrome**: Standard fullscreen APIs with touch-friendly controls
- **Touch Controls**: Gesture support across all platforms

## Dependencies

- [@radix-ui/react-slider](https://www.radix-ui.com/primitives/docs/components/slider) - Accessible slider components
- [@radix-ui/react-dropdown-menu](https://www.radix-ui.com/primitives/docs/components/dropdown-menu) - Settings menu
- [@tabler/icons-react](https://tabler-icons.io/) - Icon library
- [screenfull](https://github.com/sindresorhus/screenfull) - Cross-browser fullscreen API
- [get-video-id](https://github.com/radiovisual/get-video-id) - Extract video IDs from URLs

## Credits

This project builds upon the excellent work of:

- **[Bunny Stream](https://docs.bunny.net/docs/stream-embedding-videos)** - For their powerful video streaming platform and Player.js library
- **[Radix UI](https://www.radix-ui.com/)** - For accessible, unstyled UI primitives
- **[Tabler Icons](https://tabler-icons.io/)** - For the beautiful icon set
- **[HLS.js](https://github.com/video-dev/hls.js/)** - For HLS video streaming support
- **[Dash.js](https://github.com/Dash-Industry-Forum/dash.js/)** - For DASH video streaming support

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

Need help? We're here to assist you!

- **🐛 Bug Reports**: Found a bug? Please [open an issue](https://github.com/your-username/playstack/issues) with a detailed description, steps to reproduce, and your environment details.
- **💡 Feature Requests**: Have an idea for a new feature? We'd love to hear it! [Open a feature request](https://github.com/your-username/playstack/issues).
- **❓ Questions**: For general questions and discussions, check existing [issues](https://github.com/your-username/playstack/issues) or start a new discussion.
- **📖 Documentation**: Make sure to check the [API Reference](#api-reference) and [Examples](#quick-start) sections above.

**Before opening an issue**, please:

- Search existing issues to see if your question has already been answered
- Include relevant code examples and error messages
- Specify which platform(s) you're experiencing issues with (YouTube, Vimeo, Bunny Stream, etc.)
