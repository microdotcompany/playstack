import { forwardRef, type LegacyRef } from 'react';

interface props {
  src: string;
}

/**
 * GDrive component for embedding Google Drive files
 *
 * This component creates an iframe wrapper for Google Drive content
 * with a hidden link overlay and fullscreen support.
 */
export const GDrive = forwardRef(({ src }: props, ref: LegacyRef<HTMLIFrameElement>) => {
  return (
    <>
      {/* Hidden overlay to prevent direct link access */}
      <div className="hide-link" />
      {/* Google Drive iframe with fullscreen support */}
      <iframe ref={ref} src={src} allowFullScreen />
    </>
  );
});

GDrive.displayName = 'GDrive';
