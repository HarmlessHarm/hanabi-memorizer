import { usePress } from '@react-aria/interactions';
import { mergeProps } from '@react-aria/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
  onPress: () => void;
  children?: ReactNode;
};

/**
 * Every button in the app, on one press model (DEC-14).
 *
 * `usePress` normalises mouse, touch, keyboard and screen-reader activation into
 * a single event, and — the reason it is here rather than a bare `onClick` —
 * it owns the browser's emulated-mouse behaviour on a touchscreen instead of
 * leaving each call site to cope with it. A press resolves on the real click
 * when the browser sends one, and on a synthetic click ~80ms after release when
 * it doesn't (iOS and Android skip the click after a long press), so a slow
 * press and a quick tap now do the same thing.
 */
export function PressButton({ onPress, disabled, children, ...rest }: Props) {
  const { pressProps } = usePress({ onPress, isDisabled: disabled });

  return (
    <button type="button" disabled={disabled} {...mergeProps(pressProps, rest)}>
      {children}
    </button>
  );
}
