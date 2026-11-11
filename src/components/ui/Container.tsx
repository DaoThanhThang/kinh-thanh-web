import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

export type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  as?: 'div' | 'section' | 'main' | 'header' | 'footer';
};

/** Khung nội dung: rộng tối đa `--container-page`, lề responsive (tối thiểu 16px trên mobile). */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container(
  { as: Tag = 'div', className, ...rest },
  ref,
) {
  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      className={clsx('mx-auto w-full max-w-page px-gutter', className)}
      {...rest}
    />
  );
});
