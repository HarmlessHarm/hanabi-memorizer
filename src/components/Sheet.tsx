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
 * simply on a click landing there, so a drag that starts inside the sheet and
 * releases outside it does not dismiss.
 *
 * This gate used to carry a second job. A touchscreen emits a phantom mouse
 * click a few ms after every tap, aimed at whatever sits under the finger by
 * then — and a card tap that resolved on `pointerup` opened this sheet *before*
 * that click landed, so the phantom closed the sheet the tap had just opened.
 * Cards resolve on the click itself now (DEC-14), which means the sheet opens
 * after it and there is no phantom left to absorb. Verified by deleting this
 * gate and watching tests/phone/tap.spec.ts still pass.
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
