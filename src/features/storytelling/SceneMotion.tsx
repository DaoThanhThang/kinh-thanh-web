'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { RefObject } from 'react';

// Đăng ký một lần (module chỉ được tải một lần ở client).
gsap.registerPlugin(useGSAP, ScrollTrigger);
// iOS: thanh địa chỉ co giãn không làm tính lại vị trí; không dùng normalizeScroll.
ScrollTrigger.config({ ignoreMobileResize: true });

/**
 * Đảo (island) điều khiển chuyển động: bật `data-motion="on"` trên cảnh, rồi tween biến CSS `--open`
 * (0 → 1) theo cuộn. Không ghim bằng JS (CSS sticky), không bắt wheel, không snap.
 * prefers-reduced-motion: không làm gì, giữ hộp mở sẵn.
 */
export default function SceneMotion({ scope }: { scope: RefObject<HTMLElement | null> }) {
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        root.dataset.motion = 'on';
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
        // Nắp lật 0 → 1 trong 80% đầu, 20% cuối giữ nguyên để nhìn khay.
        tl.fromTo(root, { '--open': 0 }, { '--open': 1, duration: 0.8, ease: 'power2.inOut' });
        tl.to({}, { duration: 0.2 });
        return () => {
          delete root.dataset.motion;
          root.style.removeProperty('--open');
        };
      });
      return () => mm.revert();
    },
    { scope, dependencies: [] },
  );
  return null;
}
