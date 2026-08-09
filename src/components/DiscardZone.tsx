interface Props {
  height: number;
  /** a drag is in progress */
  active: boolean;
  /** the card has cleared the threshold and releasing will discard (DEC-8) */
  armed: boolean;
}

// The only red in the product, and it only exists while a card is in the air
// (ux-design.md). It highlights once the card is far enough up to release.
export function DiscardZone({ height, active, armed }: Props) {
  return (
    <div
      className="zone"
      style={{
        height,
        borderColor: armed ? '#ff5c5c' : 'rgba(255,92,92,.28)',
        background: armed ? 'rgba(255,60,60,.14)' : 'transparent',
        transform: armed ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <span className="zone-label" style={{ color: armed ? '#ff8f8f' : '#5c6672' }}>
        {active ? 'Release to discard' : 'Drag a card up here to discard'}
      </span>
    </div>
  );
}
