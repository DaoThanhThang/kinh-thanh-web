'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { prefersReducedMotion } from '@/lib/utils/motion';
import {
  COMPLETION_MS,
  completionReducer,
  initialCompletion,
  type CompletionPhase,
} from '../../model/completion';

/**
 * Điều khiển bước hoàn tất theo `isFull`. `active` = đã hydrate xong (trước đó không phản ứng,
 * để hộp đã đầy từ lần ghé trước nhảy thẳng tới `ready`). prefers-reduced-motion: mọi pha chuyển
 * ngay, nắp/ruy băng không có hoạt ảnh (CSS cũng tắt chuyển tiếp).
 */
export function useCompletion(isFull: boolean, active: boolean) {
  const [state, dispatch] = useReducer(completionReducer, initialCompletion);

  // Lần đầu sau khi hydrate: nếu hộp đã đầy → ready ngay (onLoad). Sau đó phản ứng bình thường.
  const first = useRef(true);
  useEffect(() => {
    if (!active) return;
    if (isFull) dispatch({ type: 'full', onLoad: first.current });
    else dispatch({ type: 'notFull' });
    first.current = false;
  }, [isFull, active]);

  // Hẹn giờ cho các pha có hoạt ảnh.
  useEffect(() => {
    const reduce = prefersReducedMotion();
    let ms: number | null = null;
    let next: 'lidClosed' | 'ribbonTied' | 'lidOpened' | null = null;
    if (state.phase === 'closing') [next, ms] = ['lidClosed', COMPLETION_MS.lid];
    else if (state.phase === 'tying') [next, ms] = ['ribbonTied', COMPLETION_MS.ribbon];
    else if (state.phase === 'opening') [next, ms] = ['lidOpened', COMPLETION_MS.lid];
    if (next === null || ms === null) return;
    const type = next;
    const id = window.setTimeout(() => dispatch({ type }), reduce ? 0 : ms);
    return () => window.clearTimeout(id);
  }, [state.phase]);

  const reopen = useCallback(() => dispatch({ type: 'reopen' }), []);

  return { phase: state.phase as CompletionPhase, instant: state.instant, reopen };
}
