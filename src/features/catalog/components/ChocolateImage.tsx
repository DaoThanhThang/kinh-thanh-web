'use client';

import { useState } from 'react';

const FALLBACK = '/chocolates/fallback.svg';

type Props = {
  src: string;
  /** Bắt buộc: tên viên chocolate. */
  alt: string;
  width: number;
  height: number;
  className?: string;
  loading?: 'lazy' | 'eager';
};

/**
 * Dùng <img> thường thay vì next/image: ảnh tạm là SVG (không cần tối ưu/resize) và thay ảnh thật
 * chỉ bằng cách ghi đè file. width/height cố định chỗ để tránh CLS. Lỗi tải -> ảnh thay thế một lần.
 */
export function ChocolateImage({ src, alt, width, height, className, loading = 'lazy' }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const current = failedSrc === src ? FALLBACK : src;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding="async"
      className={className}
      onError={() => {
        if (current !== FALLBACK) setFailedSrc(src);
      }}
    />
  );
}
