import { useEffect, useMemo, useRef, useState } from 'react';
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

const ReactPlayer = ({ thumbnail, src, service, onTimeUpdate, onTitleChange }) => {
  const player = useRef(null);
  const playerContainer = useRef(null);

  const timeoutControls = useRef(null);
  const [activeControls, setActiveConrols] = useState(false);

  const [fullscreen, setFullscreen] = useState(false);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const [seeking, setSeeking] = useState(false);

  const remainingTime = useMemo(() => {
    let remaining = Math.max(0, Math.floor(duration - currentTime));
    const days = Math.floor(remaining / 86400);
    remaining %= 86400;
    const hours = Math.floor(remaining / 3600);
    remaining %= 3600;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

    let parts = [];
    if (days > 0) parts.push(days);
    if (days > 0 || hours > 0) parts.push(hours);
    parts.push(minutes);
    parts.push(seconds.toString().padStart(2, '0'));

    return parts.join(':');
  }, [currentTime, duration]);

  const isIOS = () => {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  };

  const toggleFullscreen = () => {
    const ios = isIOS();
    if ((ios && fullscreen) || screenfull.isFullscreen) {
      if (ios) {
        playerContainer.current.style.position = 'relative';
        playerContainer.current.style.zIndex = '10';
      } else {
        screenfull.exit(playerContainer.current);
      }
      setFullscreen(false);
    } else {
      if (ios) {
        playerContainer.current.style.position = 'fixed';
        playerContainer.current.style.zIndex = '100000000';
      } else {
        screenfull.request(playerContainer.current);
      }
      setFullscreen(true);
    }
  };

  useEffect(() => {
    const container = playerContainer.current;

    const onFullscreenChange = () => {
      if (!screenfull.isFullscreen) setFullscreen(false);
    };

    const onScreenEvent = () => {
      clearTimeout(timeoutControls.current);
      setActiveConrols(true);
      timeoutControls.current = setTimeout(() => {
        setActiveConrols(false);
      }, 2000);
    };

    const onKeydown = (e) => {
      if (player.current.currentTime >= 1) {
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

    container.addEventListener('fullscreenchange', onFullscreenChange);

    container.addEventListener('mouseenter', onScreenEvent);
    container.addEventListener('mousemove', onScreenEvent);
    container.addEventListener('touchstart', onScreenEvent);
    container.addEventListener('touchmove', onScreenEvent);

    document.body.addEventListener('keydown', onKeydown);

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
      <OrgReactPlayer
        ref={player}
        className="react-player"
        slot="media"
        playsInline={true}
        src={src}
        controls={false}
        style={{
          '--controls': 'none'
        }}
        volume={muted ? 0 : volume}
        playing={!paused}
        playbackRate={playbackRate}
        onReady={() => {
          const interval = setInterval(() => {
            const iframe = player.current.shadowRoot?.querySelector('iframe');

            if (iframe) {
              iframe.style.cssText = `
              height: 1000%;
              vertical-align: middle;
              display: block;
              position: relative;
              `;
              clearInterval(interval);
            }
          }, 100);
        }}
        onTimeUpdate={(e) => {
          setCurrentTime(e.target.currentTime);
          if (typeof onTimeUpdate === 'function')
            onTimeUpdate({
              current: e.target.currentTime,
              duration: e.target.duration
            });
        }}
        onDurationChange={(e) => setDuration(e.target.duration)}
        onPause={() => setPaused(true)}
        onSeeking={() => setSeeking(true)}
        onSeeked={() => setSeeking(false)}
        onLoadedMetadata={(e) => {
          if (e.target.api?.videoTitle) onTitleChange?.(e.target.api.videoTitle);
        }}
      />
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
            onValueChange={(v) => (player.current.currentTime = v[0])}
          >
            <Slider.Track
              className="SliderTrack"
              style={{
                '--react-player-seekbar-progress-loaded-percentage': `${
                  (currentTime / duration) * 100
                }%`
              }}
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
};

export default ReactPlayer;
