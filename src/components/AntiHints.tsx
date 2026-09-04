import type { Rank, SuitKey } from '../lib/types';
import { SUITS, suitOf } from '../lib/suits';

interface Props {
  ranks: Rank[];
  suits: SuitKey[];
  /** diameter of one badge, in px */
  size: number;
}

/**
 * One near-black strike for every badge. A white stripe over the white numeral
 * of a number badge erases the very digit the badge is about, and two different
 * strike colours read as two different meanings when there is only one.
 */
const STRIKE = '#101419';

/** The disc a "not a 4" sits on — no suit owns a number, so it is plain grey. */
export const RANK_FILL = '#78828f';

/** "Not 3", "Not Red" — one phrasing, used on the card and in the sheet alike. */
export const notLabel = (field: 'rank' | 'suit', value: Rank | SuitKey): string =>
  field === 'rank' ? `Not ${value}` : `Not ${suitOf(value as SuitKey)?.label ?? value}`;

/**
 * What the card is *not*, along its bottom edge: the colour or number in a small
 * disc with a stripe through it. Deliberately a different visual language from a
 * positive hint — a hint is the whole card (DEC-6), a negative is a token you
 * have to lean in for. It is worth less at the table and should look like it.
 */
export function AntiHints({ ranks, suits, size }: Props) {
  if (!ranks.length && !suits.length) return null;

  const ordered = SUITS.filter((s) => suits.includes(s.key));

  return (
    <div className="antis" style={{ gap: Math.max(2, Math.round(size * 0.16)) }}>
      {[...ranks]
        .sort((a, b) => a - b)
        .map((r) => (
          <AntiBadge key={`r${r}`} size={size} label={notLabel('rank', r)} fill={RANK_FILL}>
            {r}
          </AntiBadge>
        ))}

      {ordered.map((s) => (
        <AntiBadge key={`s${s.key}`} size={size} label={notLabel('suit', s.key)} fill={s.hex} />
      ))}
    </div>
  );
}

interface BadgeProps {
  size: number;
  /** omitted when something around the badge already names it */
  label?: string;
  fill: string;
  children?: number;
}

/** One struck-through disc. Exported so the sheet can offer the same token back. */
export function AntiBadge({ size, label, fill, children }: BadgeProps) {
  return (
    <svg
      className="anti"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {/* The ring keeps a dark badge legible on a dark card and a light one on white. */}
      <circle cx="12" cy="12" r="10.4" fill={fill} stroke="rgba(0,0,0,.55)" strokeWidth="1.6" />
      {children !== undefined && (
        <text
          x="12"
          y="12"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="16"
          fontWeight="700"
          fill="#ffffff"
        >
          {children}
        </text>
      )}
      <line
        x1="4.8"
        y1="19.2"
        x2="19.2"
        y2="4.8"
        stroke={STRIKE}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
