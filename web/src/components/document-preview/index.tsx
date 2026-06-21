import { memo } from 'react';

import { ImagePreviewer } from './image-preview';
import { PdfPreviewer } from './pdf-preview';
import { TxtPreviewer } from './txt-preview';
import { UnsupportedPreviewer } from './unsupported-preview';

type PreviewProps = {
  fileType: string;
  className?: string;
  url: string;
};

function DocumentPreview({ fileType, className, url }: PreviewProps) {
  const normalizedFileType = fileType.toLowerCase();

  return (
    <>
      {normalizedFileType === 'pdf' && <PdfPreviewer className={className} url={url} />}
      {isTextPreview(normalizedFileType) && <TxtPreviewer className={className} url={url} />}
      {isImagePreview(normalizedFileType) && <ImagePreviewer className={className} url={url} />}
      {!isSupportedPreview(normalizedFileType) && (
        <UnsupportedPreviewer className={className} url={url} />
      )}
    </>
  );
}

function isTextPreview(fileType: string) {
  return ['txt', 'md', 'mdx', 'py', 'js', 'ts', 'json', 'csv', 'log', 'sql', 'sh'].includes(
    fileType,
  );
}

function isImagePreview(fileType: string) {
  return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(fileType);
}

function isSupportedPreview(fileType: string) {
  return fileType === 'pdf' || isTextPreview(fileType) || isImagePreview(fileType);
}

export default memo(DocumentPreview);
