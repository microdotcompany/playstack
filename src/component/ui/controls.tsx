import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Slider from '@radix-ui/react-slider';
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconChevronRight,
  IconCircleCheckFilled,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconSettingsFilled,
  IconVolume,
  IconVolume2,
  IconVolumeOff
} from '@tabler/icons-react';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ContextProvider } from '../player';
import screenfull from 'screenfull';

export const Controls = ({
  player,
  showFullscreenOnIOS,
  container
}: {
  player: any;
  showFullscreenOnIOS: boolean;
  container: React.RefObject<HTMLDivElement>;
}) => {
  const timeoutControls = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeControls, setActiveControls] = useState<boolean>(false);

  const { started, state, currentTime, duration, isIOS, volume, muted, playbackRate } =
    useContext(ContextProvider);

  const [fullscreen, setFullscreen] = useState<boolean>(false);

  const paused = useMemo(() => state === 'paused', [state]);

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

  const togglePlay = useCallback(() => {
    if (paused) {
      player.current.play();
    } else {
      player.current.pause();
    }
  }, [paused, player]);

  useEffect(() => {
    const main = container.current;

    // Handle fullscreen state changes
    const onFullscreenChange = () => {
      setFullscreen(screenfull.isFullscreen);
    };

    // Show controls on user interaction and hide after timeout
    const onScreenEvent = () => {
      if (timeoutControls.current) clearTimeout(timeoutControls.current);
      setActiveControls(true);
      timeoutControls.current = setTimeout(() => {
        setActiveControls(false);
      }, 2000);
    };

    if (!main) return;

    // Add event listeners
    main.addEventListener('fullscreenchange', onFullscreenChange);

    main.addEventListener('mouseenter', onScreenEvent);
    main.addEventListener('mousemove', onScreenEvent);
    main.addEventListener('touchstart', onScreenEvent);
    main.addEventListener('touchmove', onScreenEvent);

    // Cleanup event listeners
    return () => {
      if (!main) return;
      main.removeEventListener('fullscreenchange', onFullscreenChange);

      main.removeEventListener('mouseenter', onScreenEvent);
      main.removeEventListener('mousemove', onScreenEvent);
      main.removeEventListener('touchstart', onScreenEvent);
      main.removeEventListener('touchmove', onScreenEvent);
    };
  }, [container, player]);

  useEffect(() => {
    // Keyboard shortcuts for player control
    const onKeydown = (e: KeyboardEvent) => {
      if (player.current && currentTime >= 1) {
        switch (e.code) {
          case 'Space': {
            e.preventDefault();
            togglePlay();
            break;
          }
          case 'ArrowRight': {
            e.preventDefault();
            player.current.seekTo(currentTime + 10 >= duration ? duration : currentTime + 10);
            break;
          }
          case 'ArrowLeft': {
            e.preventDefault();
            player.current.seekTo(currentTime - 10 <= 0 ? 0 : currentTime - 10);
            break;
          }
          case 'ArrowUp': {
            e.preventDefault();
            player.current.setVolume(volume >= 0.9 ? 1 : volume + 0.1);
            break;
          }
          case 'ArrowDown': {
            e.preventDefault();
            player.current.setVolume(volume <= 0.1 ? 0 : volume - 0.1);
            break;
          }
          case 'KeyM': {
            e.preventDefault();
            player.current.setMuted(!muted);
            break;
          }
          default:
            break;
        }
      }
    };

    document.body.addEventListener('keydown', onKeydown);
    return () => document.body.removeEventListener('keydown', onKeydown);
  }, [togglePlay, currentTime, duration, volume, muted, player]);

  return (
    <div
      className="controls"
      style={{
        opacity: started && (activeControls || paused) ? 100 : 0,
        pointerEvents: started && (activeControls || paused) ? 'auto' : 'none'
      }}
    >
      <button onClick={togglePlay}>
        {paused ? <IconPlayerPlayFilled /> : <IconPlayerPauseFilled />}
      </button>

      <div className="seekbar">
        <Slider.Root
          className="SliderRoot"
          value={[currentTime]}
          max={duration}
          step={1}
          onValueChange={(v) => {
            player.current.seekTo(v[0]);
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
            data-seeking={state === 'buffering' ? 'true' : 'false'}
          >
            <Slider.Range className="SliderRange" />
          </Slider.Track>
          <Slider.Thumb className="SliderThumb" aria-label="Volume" />
        </Slider.Root>
        <span className="time">-{remainingTime}</span>
      </div>

      <button
        style={{ marginRight: isIOS ? '-.4rem' : undefined }}
        onClick={() => {
          if (volume <= 0) {
            player.current.setMuted(false);
            player.current.setVolume(0.1);
          } else {
            player.current.setMuted(!muted);
          }
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
      {!isIOS && (
        <div className="seekbar" style={{ maxWidth: '5rem' }}>
          <Slider.Root
            className="SliderRoot"
            value={[volume]}
            max={1}
            step={0.1}
            onValueChange={(v) => {
              player.current.setMuted(false);
              player.current.setVolume(v[0]);
            }}
          >
            <Slider.Track className="SliderTrack">
              <Slider.Range className="SliderRange" />
            </Slider.Track>
            <Slider.Thumb className="SliderThumb" aria-label="Volume" />
          </Slider.Root>
        </div>
      )}
      <div className="group-btn-controls">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button>
              <IconSettingsFilled />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal container={container.current}>
            <DropdownMenu.Content className="DropdownMenuContent" side="top" sideOffset={5}>
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger className="DropdownMenuSubTrigger">
                  Speed
                  <div className="RightSlot">
                    <IconChevronRight />
                  </div>
                </DropdownMenu.SubTrigger>
                <DropdownMenu.Portal container={container.current}>
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
                        onCheckedChange={() => player.current.setPlaybackRate(v.value)}
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

        {(!isIOS || showFullscreenOnIOS) && (
          <button
            onClick={() => {
              if (isIOS) {
                const videoEl = player.current.instance();

                if (!videoEl) return;

                const enter =
                  videoEl.requestFullscreen?.bind(videoEl) ??
                  (videoEl as any).webkitEnterFullscreen?.bind(videoEl);
                if (enter) {
                  enter();
                } else {
                  console.warn('Fullscreen API is not available on this device.');
                }
              } else {
                if (screenfull.isFullscreen) {
                  screenfull.exit();
                } else {
                  screenfull.request(container.current as any);
                }
              }
            }}
          >
            {fullscreen ? <IconArrowsMinimize /> : <IconArrowsMaximize />}
          </button>
        )}
      </div>
    </div>
  );
};
