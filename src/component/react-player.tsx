import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ReactPlayerProps as OrgReactPlayerProps,
  VideoElementProps
} from 'react-player/types';
import OrgReactPlayer from 'react-player';
import screenfull from 'screenfull';
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconChevronRight,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconSettingsFilled
} from '@tabler/icons-react';
import * as Slider from '@radix-ui/react-slider';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { IconVolume } from '@tabler/icons-react';
import { IconVolumeOff } from '@tabler/icons-react';
import { IconCircleCheckFilled } from '@tabler/icons-react';
import { IconVolume2 } from '@tabler/icons-react';

/**
 * Extended ReactPlayer props interface that overrides the onReady callback
 * to accept either an Iplayer (custom player with shadowRoot) or HTMLVideoElement
 * instead of the original ReactPlayer's onReady signature
 */
export interface ReactPlayerProps extends Omit<OrgReactPlayerProps, 'onReady'> {
  onReady?: (player: Iplayer | HTMLVideoElement) => void;
}

interface Iplayer extends VideoElementProps {
  currentTime: number;
  duration: number;
  shadowRoot: ShadowRoot;
}

interface props {
  src: string;
  thumbnail?: string;
  service?: string;
  onTimeUpdate?: (time: { current: number; duration: number }) => void;
  onTitleChange?: (title: string) => void;
  reactPlayerProps?: ReactPlayerProps;
}

const ReactPlayer = forwardRef(
  ({ thumbnail, src, service, onTimeUpdate, onTitleChange, reactPlayerProps = {} }: props, ref) => {
    // Extract event handlers from reactPlayerProps to handle them separately
    const {
      onReady,
      onDurationChange,
      onTimeUpdate: orgOnTimeUpdate,
      onPause,
      onSeeking,
      onSeeked,
      onLoadedMetadata,
      ...restReactPlayerProps
    } = reactPlayerProps;

    // Player and container refs for DOM manipulation
    const player = useRef<Iplayer | HTMLVideoElement | null>(null);
    const playerContainer = useRef<HTMLDivElement>(null);

    // Control visibility timeout management
    const timeoutControls = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [activeControls, setActiveConrols] = useState(false);

    // Player state management
    const [fullscreen, setFullscreen] = useState(false);
    const [started, setStarted] = useState(false);
    const [paused, setPaused] = useState(true);
    const [volume, setVolume] = useState(0.5);
    const [muted, setMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);

    // Seeking state for UI feedback
    const [seeking, setSeeking] = useState(false);

    /**
     * Calculate remaining time in HH:MM:SS format
     * Handles videos longer than 24 hours by including days
     */
    const remainingTime = useMemo(() => {
      let remaining = Math.max(0, Math.floor(duration - currentTime));
      const days = Math.floor(remaining / 86400);
      remaining %= 86400;
      const hours = Math.floor(remaining / 3600);
      remaining %= 3600;
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;

      const parts = [];
      if (days > 0) parts.push(days);
      if (days > 0 || hours > 0) parts.push(hours);
      parts.push(minutes);
      parts.push(seconds.toString().padStart(2, '0'));

      return parts.join(':');
    }, [currentTime, duration]);

    /**
     * Detect iOS devices for special fullscreen handling
     * iOS requires different fullscreen implementation than standard web APIs
     */
    const isIOS = () => {
      return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      );
    };

    /**
     * Toggle fullscreen mode with iOS-specific handling
     * Uses screenfull library for standard browsers and CSS positioning for iOS
     */
    const toggleFullscreen = () => {
      if (!playerContainer.current) return;

      const ios = isIOS();
      if ((ios && fullscreen) || screenfull.isFullscreen) {
        // Exit fullscreen
        if (ios) {
          playerContainer.current.style.position = 'relative';
          playerContainer.current.style.zIndex = '10';
        } else {
          screenfull.exit();
        }
        setFullscreen(false);
      } else {
        // Enter fullscreen
        if (ios) {
          playerContainer.current.style.position = 'fixed';
          playerContainer.current.style.zIndex = '100000000';
        } else {
          screenfull.request(playerContainer.current);
        }
        setFullscreen(true);
      }
    };

    /**
     * Set up event listeners for controls, fullscreen, and keyboard shortcuts
     * Handles mouse/touch events for control visibility and keyboard navigation
     */
    useEffect(() => {
      const container = playerContainer.current;

      // Handle fullscreen state changes
      const onFullscreenChange = () => {
        if (!screenfull.isFullscreen) setFullscreen(false);
      };

      // Show controls on user interaction and hide after timeout
      const onScreenEvent = () => {
        if (timeoutControls.current) clearTimeout(timeoutControls.current);
        setActiveConrols(true);
        timeoutControls.current = setTimeout(() => {
          setActiveConrols(false);
        }, 2000);
      };

      // Keyboard shortcuts for player control
      const onKeydown = (e: KeyboardEvent) => {
        if (player.current && player.current.currentTime >= 1) {
          switch (e.code) {
            case 'Space': {
              e.preventDefault();
              setPaused((state) => !state);
              break;
            }
            case 'ArrowRight': {
              e.preventDefault();
              player.current.currentTime = player.current.currentTime + 10;
              break;
            }
            case 'ArrowLeft': {
              e.preventDefault();
              player.current.currentTime = player.current.currentTime - 10;
              break;
            }
            case 'ArrowUp': {
              e.preventDefault();
              setVolume((state) => (state >= 10 ? state : state + 0.1));
              break;
            }
            case 'ArrowDown': {
              e.preventDefault();
              setVolume((state) => (state <= 0 ? state : state - 0.1));
              break;
            }
            default:
              break;
          }
        }
      };

      if (!container) return;

      // Add event listeners
      container.addEventListener('fullscreenchange', onFullscreenChange);

      container.addEventListener('mouseenter', onScreenEvent);
      container.addEventListener('mousemove', onScreenEvent);
      container.addEventListener('touchstart', onScreenEvent);
      container.addEventListener('touchmove', onScreenEvent);

      document.body.addEventListener('keydown', onKeydown);

      // Cleanup event listeners
      return () => {
        container.removeEventListener('fullscreenchange', onFullscreenChange);

        container.removeEventListener('mouseenter', onScreenEvent);
        container.removeEventListener('mousemove', onScreenEvent);
        container.removeEventListener('touchstart', onScreenEvent);
        container.removeEventListener('touchmove', onScreenEvent);

        document.body.removeEventListener('keydown', onKeydown);
      };
    }, [playerContainer, player]);

    return (
      <div className={`react-player-container ${service}`} ref={playerContainer}>
        {/* Original ReactPlayer component with custom event handling */}
        <OrgReactPlayer
          ref={(elm) => {
            player.current = elm;
            if (typeof ref === 'function') ref(elm);
          }}
          className="react-player"
          slot="media"
          playsInline={true}
          src={src}
          controls={false}
          style={
            {
              '--controls': 'none'
            } as any
          }
          volume={muted ? 0 : volume}
          playing={!paused}
          playbackRate={playbackRate}
          onReady={() => {
            // Wait for iframe to be available in shadowRoot before calling onReady
            const interval = setInterval(() => {
              if (!player.current) return;

              const iframe = player.current.shadowRoot?.querySelector('iframe');
              if (iframe) {
                iframe.setAttribute('part', 'iframe');
                onReady?.(player.current);
                clearInterval(interval);
              }
            }, 100);
          }}
          onTimeUpdate={(e: any) => {
            setCurrentTime(e.target.currentTime);
            if (typeof onTimeUpdate === 'function')
              onTimeUpdate({
                current: e.target.currentTime,
                duration: e.target.duration
              });

            orgOnTimeUpdate?.(e);
          }}
          onDurationChange={(e: any) => {
            setDuration(e.target.duration);
            onDurationChange?.(e);
          }}
          onPause={(e) => {
            setPaused(true);
            onPause?.(e);
          }}
          onSeeking={(e) => {
            setSeeking(true);
            onSeeking?.(e);
          }}
          onSeeked={(e) => {
            setSeeking(false);
            onSeeked?.(e);
          }}
          onLoadedMetadata={(e: any) => {
            if (e.target.api?.videoTitle) onTitleChange?.(e.target.api.videoTitle);
            onLoadedMetadata?.(e);
          }}
          {...restReactPlayerProps}
        />
        {/* Overlay play button with thumbnail background */}
        <div
          role="button"
          className="control-overlaid"
          style={{
            backgroundImage: !started && thumbnail ? `url(${thumbnail})` : undefined,
            backgroundColor: !started && thumbnail ? 'black' : 'transparent',
            opacity: !paused ? 0 : 100
          }}
          onClick={() => {
            if (!started) setStarted(true);
            setPaused((state) => !state);
          }}
        >
          <div>{paused ? <IconPlayerPlayFilled /> : <IconPlayerPauseFilled />}</div>
        </div>
        {/* Custom controls overlay */}
        <div
          className="controls"
          style={{
            opacity: started && (activeControls || paused) ? 100 : 0,
            pointerEvents: started && (activeControls || paused) ? 'auto' : 'none'
          }}
        >
          <button onClick={() => setPaused((state) => !state)}>
            {paused ? <IconPlayerPlayFilled /> : <IconPlayerPauseFilled />}
          </button>

          <div className="seekbar">
            <Slider.Root
              className="SliderRoot"
              value={[currentTime]}
              max={duration}
              step={1}
              onValueChange={(v) => {
                if (player.current) player.current.currentTime = v[0];
              }}
            >
              <Slider.Track
                className="SliderTrack"
                style={
                  {
                    '--react-player-seekbar-progress-loaded-percentage': `${
                      (currentTime / duration) * 100
                    }%`
                  } as any
                }
                data-seeking={seeking ? 'true' : 'false'}
              >
                <Slider.Range className="SliderRange" />
              </Slider.Track>
              <Slider.Thumb className="SliderThumb" aria-label="Volume" />
            </Slider.Root>
            <span className="time">-{remainingTime}</span>
          </div>

          <button
            onClick={() => {
              if (volume <= 0) {
                setMuted(false);
                return setVolume(0.1);
              }

              setMuted((state) => !state);
            }}
          >
            {!(volume <= 0 || muted) ? (
              volume <= 0.5 ? (
                <IconVolume2 className="speaker-2" />
              ) : (
                <IconVolume className="speaker" />
              )
            ) : (
              <IconVolumeOff className="speaker" />
            )}
          </button>
          <div className="seekbar" style={{ maxWidth: '5rem' }}>
            <Slider.Root
              className="SliderRoot"
              value={[volume]}
              max={1}
              step={0.1}
              onValueChange={(v) => setVolume(v[0])}
            >
              <Slider.Track className="SliderTrack">
                <Slider.Range className="SliderRange" />
              </Slider.Track>
              <Slider.Thumb className="SliderThumb" aria-label="Volume" />
            </Slider.Root>
          </div>
          <div className="group-btn-controls">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button>
                  <IconSettingsFilled />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal container={playerContainer.current}>
                <DropdownMenu.Content className="DropdownMenuContent" side="top" sideOffset={5}>
                  <DropdownMenu.Sub>
                    <DropdownMenu.SubTrigger className="DropdownMenuSubTrigger">
                      Speed
                      <div className="RightSlot">
                        <IconChevronRight />
                      </div>
                    </DropdownMenu.SubTrigger>
                    <DropdownMenu.Portal container={playerContainer.current}>
                      <DropdownMenu.SubContent
                        className="DropdownMenuSubContent"
                        sideOffset={2}
                        alignOffset={-5}
                      >
                        {[
                          {
                            value: 0.25,
                            label: '0.25x'
                          },
                          {
                            value: 0.5,
                            label: '0.5x'
                          },
                          {
                            value: 0.75,
                            label: '0.75x'
                          },
                          {
                            value: 1,
                            label: 'Normal'
                          },
                          {
                            value: 1.25,
                            label: '1.25x'
                          },
                          {
                            value: 1.5,
                            label: '1.5x'
                          },
                          {
                            value: 1.75,
                            label: '1.75x'
                          },
                          {
                            value: 2,
                            label: '2x'
                          }
                        ].map((v) => (
                          <DropdownMenu.CheckboxItem
                            key={v.value}
                            className="DropdownMenuCheckboxItem"
                            checked={v.value === playbackRate ? true : false}
                            onCheckedChange={() => setPlaybackRate(v.value)}
                          >
                            <DropdownMenu.ItemIndicator className="DropdownMenuItemIndicator">
                              <IconCircleCheckFilled />
                            </DropdownMenu.ItemIndicator>
                            {v.label}
                          </DropdownMenu.CheckboxItem>
                        ))}
                      </DropdownMenu.SubContent>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Sub>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            <button onClick={toggleFullscreen}>
              {fullscreen ? <IconArrowsMinimize /> : <IconArrowsMaximize />}
            </button>
          </div>
        </div>
      </div>
    );
  }
);

export default ReactPlayer;
