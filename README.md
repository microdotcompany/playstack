# Playstack

A modern, customizable video player component for React that supports multiple video services including YouTube, Vimeo, Bunny Stream, Google Drive, and more. Built with TypeScript and featuring a beautiful, responsive UI with custom controls.

## Features

- 🎥 **Multi-platform Support**: YouTube, Vimeo, Bunny Stream, Google Drive, and other video platforms
- 🎨 **Customizable UI**: Modern, responsive design with theme customization (YouTube, Vimeo, and other react-player platforms)
- ⌨️ **Keyboard Controls**: Full keyboard navigation support
- **Mobile Optimized**: Touch-friendly controls and iOS fullscreen support
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

### YouTube

```tsx
import { Player } from 'playstack';

function App() {
  return (
    <Player
      src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      onTimeUpdate={(time) => console.log('Current time:', time.current)}
    />
  );
}
```

### Vimeo

```tsx
import { Player } from 'playstack';

function App() {
  return (
    <Player
      src="https://vimeo.com/123456789"
      onTimeUpdate={(time) => console.log('Current time:', time.current)}
    />
  );
}
```

### Bunny Stream Integration

**Important**: Bunny Stream requires both `src` and `bunny` props to work properly. If `src` is not provided, the player will show a loading indicator indefinitely.

```tsx
import { Player, BunnyPlayerProvider } from 'playstack';

function App() {
  return (
    <BunnyPlayerProvider>
      <Player
        src="https://iframe.mediadelivery.net/embed/your-library/your-video-id"
        bunny={{
          id: 'your-video-id',
          hostname: 'your-library.b-cdn.net'
        }}
        onTimeUpdate={(time) => console.log('Current time:', time.current)}
      />
    </BunnyPlayerProvider>
  );
}
```

## API Reference

### Player Props

| Prop               | Type                                                    | Default     | Description                                                                                                                                       |
| ------------------ | ------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src`              | `string`                                                | -           | Direct video URL (YouTube, Vimeo, etc.) or Bunny Stream iframe URL                                                                                |
| `bunny`            | `{ id: string; hostname: string }`                      | -           | Bunny Stream configuration (requires `src` to be provided)                                                                                        |
| `theme`            | `string`                                                | `'#00B2FF'` | Theme color for player controls (YouTube, Vimeo, and other react-player platforms only)                                                           |
| `onTimeUpdate`     | `(time: { current: number; duration: number }) => void` | -           | Callback for time updates                                                                                                                         |
| `onTitleChange`    | `(title: string) => void`                               | -           | Callback when video title is available                                                                                                            |
| `reactPlayerProps` | `ReactPlayerProps`                                      | -           | Additional props for ReactPlayer component. See [react-player documentation](https://github.com/cookpete/react-player/) for all available options |

### BunnyPlayerProvider

Required wrapper component that loads the Bunny Player JavaScript library.

```tsx
<BunnyPlayerProvider>{/* Your app components */}</BunnyPlayerProvider>
```

### Player Ref

The Player component supports ref forwarding. You can use a callback function that receives the player object.

**Note**: The ref receives different player objects depending on the platform:

- **YouTube, Vimeo, and other react-player platforms**: ReactPlayer instance with HTMLMediaElement-compatible methods
- **Bunny Stream**: Bunny Player.js instance
- **Google Drive**: iframe element only (limited functionality)

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
- **Requirements**: Both `src` (iframe URL) and `bunny` (configuration) props must be provided
- **Theme Support**: ❌ Uses Bunny's native player (theme only affects loading indicator)
- **iOS Fullscreen**: ✅ Full native iOS fullscreen support
- **Usage**:
  ```tsx
  <Player
    src="https://iframe.mediadelivery.net/embed/your-library/your-video-id"
    bunny={{
      id: 'your-video-id',
      hostname: 'your-library.b-cdn.net'
    }}
  />
  ```
- **Note**: If `src` is missing, the player will display a loading indicator

### Google Drive

- **Features**: Basic iframe embedding with hidden link overlay
- **Limitation**: No additional functionality beyond embedding
- **Theme Support**: ❌ Uses Google Drive's native iframe (no theme customization)
- **iOS Fullscreen**: ✅ Full native iOS fullscreen support
- **Note**: The component hides Google Drive's "Open" link button for cleaner UI

### Direct Video, HLS, DASH

- **Features**: Native HTML5 video support, including HLS and DASH streams
- **Theme Support**: ✅ Full theme customization
- **iOS Fullscreen**: ✅ Native fullscreen support on iOS (video enters fullscreen when playback starts)

### Other Platforms

Supports all platforms compatible with [react-player](https://github.com/cookpete/react-player/):

- Twitch
- Wistia
- And many more

**Note**:

- Theme customization and iOS fullscreen limitations only apply to platforms that use the custom ReactPlayer component (YouTube, Vimeo, direct video, HLS, DASH, etc.).
- **iOS Fullscreen**:
  - YouTube, Vimeo, direct video, HLS, DASH: ✅ Native fullscreen support (video automatically enters fullscreen on play)
  - Other platforms: ⚠️ Limited fullscreen support on iOS

## Keyboard Controls

| Key     | Action             |
| ------- | ------------------ |
| `Space` | Play/Pause         |
| `←`     | Rewind 10 seconds  |
| `→`     | Forward 10 seconds |
| `↑`     | Increase volume    |
| `↓`     | Decrease volume    |
| `M`     | Mute/Unmute        |

**Note**: On iOS devices, the volume bar is hidden for react-player platforms because browsers do not allow programmatic volume control.

## Customization

### Theme Colors

**Note**: Theme customization only works with YouTube, Vimeo, and other react-player platforms.

```tsx
<Player theme="#FF6B6B" src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
```

### Custom ReactPlayer Props

The `reactPlayerProps` prop allows you to pass any prop supported by [react-player](https://github.com/cookpete/react-player/).

```tsx
<Player
  src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  reactPlayerProps={{
    onReady: (player) => console.log('Player ready:', player),
    onError: (error) => console.error('Player error:', error),
    onProgress: (state) => console.log('Progress:', state)
  }}
/>
```

**For a complete list of all available props and options, see the [react-player documentation](https://github.com/cookpete/react-player/).**

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

### Title Extraction

```tsx
<Player
  src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  onTitleChange={(title) => {
    document.title = `Watching: ${title}`;
  }}
/>
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Mobile Support

- **iOS Safari**:

  - YouTube, Vimeo, direct video, HLS, DASH: Native fullscreen support (video automatically enters fullscreen on play)
  - Bunny Stream and Google Drive: Full native iOS fullscreen support
  - Other platforms: Limited fullscreen support on iOS
  - **Note**: The volume bar will not be displayed on iOS devices for react-player platforms, as programmatic volume control is not supported by iOS browsers.

- **Android Chrome**: Standard fullscreen APIs with touch-friendly controls
- **Touch Controls**: Gesture support across all platforms

## Dependencies

- [react-player](https://github.com/cookpete/react-player/) - Core video player functionality
- [@radix-ui/react-slider](https://www.radix-ui.com/primitives/docs/components/slider) - Accessible slider components
- [@radix-ui/react-dropdown-menu](https://www.radix-ui.com/primitives/docs/components/dropdown-menu) - Settings menu
- [@tabler/icons-react](https://tabler-icons.io/) - Icon library
- [screenfull](https://github.com/sindresorhus/screenfull) - Cross-browser fullscreen API

## Credits

This project builds upon the excellent work of:

- **[react-player](https://github.com/cookpete/react-player/)** by Pete Cook - The foundation for multi-platform video support
- **[Bunny Stream](https://docs.bunny.net/docs/stream-embedding-videos)** - For their powerful video streaming platform and Player.js library
- **[Radix UI](https://www.radix-ui.com/)** - For accessible, unstyled UI primitives
- **[Tabler Icons](https://tabler-icons.io/)** - For the beautiful icon set

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions:

1. Check the [react-player documentation](https://github.com/cookpete/react-player/)
2. Review the [Bunny Stream documentation](https://docs.bunny.net/docs/stream-embedding-videos)
3. Open an issue in this repository
