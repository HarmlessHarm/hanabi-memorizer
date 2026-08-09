interface Props {
  onKeep: () => void;
  onDiscard: () => void;
}

// Deliberate friction on the most destructive action (REQ-3.2.1, DEC-8): an
// accidental discard is unrecoverable at the table without Undo.
export function DiscardConfirm({ onKeep, onDiscard }: Props) {
  return (
    <div className="scrim" onClick={onKeep}>
      <div className="sheet chooser" onClick={(e) => e.stopPropagation()}>
        <div className="chooser-title">Discard this card?</div>
        <div className="actions">
          <button className="action action-ghost" onClick={onKeep}>
            Keep it
          </button>
          <button className="action action-discard" onClick={onDiscard}>
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
