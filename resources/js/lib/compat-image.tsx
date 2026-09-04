import React from 'react';

export default function Image({
  src,
  alt = '',
  fill,
  priority,
  sizes,
  style,
  className = '',
  width,
  height,
  loading,
  ...props
}: any) {
  const combinedStyle: React.CSSProperties = {
    ...(fill
      ? {
          position: 'absolute',
          height: '100%',
          width: '100%',
          inset: 0,
          objectFit: (style?.objectFit as any) || 'cover',
        }
      : {}),
    ...style,
  };

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : (loading || 'lazy')}
      className={className}
      width={width}
      height={height}
      style={combinedStyle}
      {...props}
    />
  );
}
export { Image };
