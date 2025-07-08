import './style.css';
import getVideoId from 'get-video-id';
import Bunny from './bunny';
import ReactPlayer from './react-player';
import Gdrive from './gdrive';
import { useMemo } from 'react';

const Player = ({ src, bunnyId, onTimeUpdate, onTitleChange }) => {
  const video = useMemo(() => {
    if (src || bunnyId) {
      if (bunnyId)
        return {
          thumbnail: `https://vz-1e38bb53-4e6.b-cdn.net/${bunnyId}/thumbnail.jpg`,
          service: 'bunny',
          src,
          id: bunnyId
        };

      const videoData = getVideoId(src);

      if (!videoData.service && !videoData.id) {
        const pattern =
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

      const ytShorts = videoData.service === 'youtube' && src.includes('shorts');

      return {
        thumbnail:
          videoData.service === 'youtube' && `https://i.ytimg.com/vi/${videoData.id}/sddefault.jpg`,
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
  }, [src, bunnyId]);

  return (
    video &&
    (video.service === 'gdrive' ? (
      <Gdrive src={video.src} />
    ) : video.service === 'bunny' ? (
      <Bunny
        src={video.src}
        thumbnail={video.thumbnail}
        id={video.id}
        onTimeUpdate={onTimeUpdate}
      />
    ) : (
      <ReactPlayer
        src={video.src}
        thumbnail={video.thumbnail}
        service={video.service}
        onTimeUpdate={onTimeUpdate}
        onTitleChange={onTitleChange}
      />
    ))
  );
};

export default Player;
