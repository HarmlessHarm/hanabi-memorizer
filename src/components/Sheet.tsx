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
 * The two are siblings rather than parent and child so that the hand can sit
 * *between* them — above the dimming backdrop, so cards stay visible and
 * tappable while a hint is being picked, but under the sheet, which overlaps the
 * card row on a short screen. A single nested backdrop would put its whole
 * subtree on one layer and leave no room in the middle for the cards.
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
    <>
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
      />
      {/* Transparent to pointers, so a tap beside the sheet reaches the backdrop. */}
      <div className="sheet-layer">
        <div className={variant ? `sheet ${variant}` : 'sheet'}>{children}</div>
      </div>
    </>
  );
}
