import { useRef } from 'react';
import type { ReactNode } from 'react';

interface Props {
  /** tap-outside-to-close; the sheet body itself never dismisses */
  onDismiss: () => void;
  /** extra class on the sheet body */
  variant?: string;
  children: ReactNode;
}

/**
 * The shared backdrop + bottom sheet.
 *
 * Dismissal is gated on the press having *started* on the backdrop rather than
 * simply on a click landing there. A touchscreen emits a phantom mouse click a
 * few ms after every tap, aimed at whatever is under the finger by then — for a
 * tap that opens a sheet, that is this backdrop. A plain onClick would treat
 * that phantom as "tap outside" and close the sheet the tap just opened. It also
 * means a drag that starts inside the sheet and releases outside no longer
 * closes it, which is the behaviour you want anyway.
 */
export function Sheet({ onDismiss, variant, children }: Props) {
  const pressedBackdrop = useRef(false);

  return (
    <div
      className="scrim"
      onPointerDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target !== e.currentTarget || !pressedBackdrop.current) return;
        pressedBackdrop.current = false;
        onDismiss();
      }}
    >
      <div className={variant ? `sheet ${variant}` : 'sheet'}>{children}</div>
    </div>
  );
}
