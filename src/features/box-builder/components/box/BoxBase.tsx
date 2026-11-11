import type { ReactNode } from 'react';

/**
 * Thân hộp: mặt trên (khung nâu cacao, chứa khay) và thành trước có độ dày nhìn thấy được.
 * `children` là khay (Tray). Nằm trong mặt phẳng z=0 của hộp 3D.
 */
export function BoxBase({ children }: { children?: ReactNode }) {
  return (
    <div className="gb-base">
      <div className="gb-base-top">{children}</div>
      <div className="gb-base-front" aria-hidden="true" />
    </div>
  );
}
