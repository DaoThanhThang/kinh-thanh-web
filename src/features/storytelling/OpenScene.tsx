'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { GiftBox } from '@/features/box-builder/components/box';
import { home } from '@/content/home';
import './story.css';

// GSAP và ScrollTrigger tải riêng, sau khi hero đã vẽ xong.
const SceneMotion = dynamic(() => import('./SceneMotion'), { ssr: false });

/**
 * Cảnh nắp mở theo thanh cuộn. Nội dung hiển thị sẵn (hộp mở); SceneMotion nâng cấp thành hoạt ảnh.
 */
export function OpenScene({ cols, rows }: { cols: number; rows: number }) {
  const ref = useRef<HTMLElement>(null);
  return (
    <section ref={ref} className="scene" data-scene>
      <div className="scene-stage" role="img" aria-label={home.sceneLabel}>
        <GiftBox cols={cols} rows={rows} />
      </div>
      <SceneMotion scope={ref} />
    </section>
  );
}
