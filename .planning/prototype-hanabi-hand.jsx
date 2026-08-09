import { useState, useRef, useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  Hanabi — hint tracker                                              */
/*  Your own hand, face away from you. Record the hints you receive.   */
/* ------------------------------------------------------------------ */

const SUITS = [
  { key: "red",    label: "Red",    hex: "#d8443f", hi: "#ef6f66", lo: "#8e2723", ink: "#ffffff" },
  { key: "yellow", label: "Yellow", hex: "#edc23a", hi: "#f7dd7d", lo: "#a8830f", ink: "#33270a" },
  { key: "green",  label: "Green",  hex: "#23824c", hi: "#47b073", lo: "#12482a", ink: "#ffffff" },
  { key: "blue",   label: "Blue",   hex: "#3273cc", hi: "#5f9be8", lo: "#1c4685", ink: "#ffffff" },
  { key: "white",  label: "White",  hex: "#d8dfe6", hi: "#f2f6f9", lo: "#a9b3bd", ink: "#1b2027" },
];
const RANKS = [1, 2, 3, 4, 5];
const suitOf = (k) => SUITS.find((s) => s.key === k) || null;

const GAP = 10;
const KEY = "hanabi:hand";
const LIFT = 0.34; // fraction of card height you must drag up to arm the drop zone

let uid = 0;
const makeCard = () => ({ id: ++uid, rank: null, suit: null });
const freshHand = (n) => Array.from({ length: n }, makeCard);

export default function HanabiHand() {
  const [cards, setCards] = useState(() => freshHand(5));
  const [handSize, setHandSize] = useState(5);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [leaving, setLeaving] = useState(null); // card id dropped in the zone
  const [past, setPast] = useState([]);
  const [drag, setDrag] = useState(null);
  const [settling, setSettling] = useState(false);
  const [pop, setPop] = useState(0);
  const [box, setBox] = useState({ w: 0, h: 0 });

  const cardsRef = useRef(cards);
  useEffect(() => { cardsRef.current = cards; }, [cards]);
  const dragRef = useRef(null);
  const stageRef = useRef(null);

  /* --------------------------- persistence ------------------------ */

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await window.storage.get(KEY);
        const d = JSON.parse(r.value);
        if (alive && Array.isArray(d.cards)) {
          uid = d.cards.reduce((m, c) => Math.max(m, c.id), 0);
          setCards(d.cards);
          setHandSize(d.handSize || 5);
        }
      } catch (e) { /* nothing stored yet */ }
      if (alive) setLoaded(true);
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      try { window.storage.set(KEY, JSON.stringify({ cards, handSize })).catch(() => {}); }
      catch (e) {}
    }, 250);
    return () => clearTimeout(t);
  }, [cards, handSize, loaded]);

  /* ---------------------------- sizing ---------------------------- */

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) =>
      setBox({ w: e.contentRect.width, h: e.contentRect.height })
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const byW = ((box.w - GAP * (handSize - 1)) / handSize) * (7 / 5);
  const byH = (box.h - 20) / 1.55;
  const cardH = Math.max(84, Math.min(byW || 999, byH || 999, 270));
  const cardW = (cardH * 5) / 7;
  const zoneH = Math.round(cardH * 0.5);
  const step = cardW + GAP;

  /* ---------------------------- actions --------------------------- */

  const commit = (next) => {
    setPast((p) => [...p, cardsRef.current].slice(-30));
    setCards(next);
  };
  const undo = () => {
    if (!past.length) return;
    setSelectedId(null);
    setCards(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
  };
  const reset = () => { commit(freshHand(handSize)); setSelectedId(null); };

  const setHint = (field, value) => {
    commit(cardsRef.current.map((c) =>
      c.id === selectedId ? { ...c, [field]: c[field] === value ? null : value } : c
    ));
    setPop((n) => n + 1);
  };
  const clearHints = () =>
    commit(cardsRef.current.map((c) =>
      c.id === selectedId ? { ...c, rank: null, suit: null } : c
    ));
  const removeCard = (id) => {
    commit(cardsRef.current.filter((c) => c.id !== id));
    setLeaving(null);
  };
  const draw = () => {
    if (cardsRef.current.length >= handSize) return;
    commit([makeCard(), ...cardsRef.current]);
  };

  /* ------------------------------ drag ---------------------------- */

  const onDown = (e, i) => {
    if (selectedId !== null || leaving !== null) return;
    dragRef.current = { i, to: i, x0: e.clientX, y0: e.clientY, moved: false, out: false };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
  };

  const onMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.moved && Math.hypot(dx, dy) < 8) return;
    d.moved = true;
    d.out = dy < -cardH * LIFT;
    const n = cardsRef.current.length;
    d.to = d.out ? d.i : Math.max(0, Math.min(n - 1, d.i + Math.round(dx / step)));
    setDrag({ i: d.i, to: d.to, dx, dy, out: d.out });
  };

  const onUp = (e, i) => {
    const d = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    if (!d) return;
    if (!d.moved) { setSelectedId(cardsRef.current[i].id); return; }
    if (d.out) { setLeaving(cardsRef.current[d.i].id); return; }
    if (d.to !== d.i) {
      // the reorder changes layout, so kill transitions for one frame —
      // otherwise cards animate from their old offset to their new slot.
      setSettling(true);
      const next = cardsRef.current.slice();
      const [c] = next.splice(d.i, 1);
      next.splice(d.to, 0, c);
      commit(next);
      requestAnimationFrame(() => requestAnimationFrame(() => setSettling(false)));
    }
  };

  const transformFor = (i) => {
    if (settling) return { transform: "translate3d(0,0,0)", transition: "none", zIndex: 1 };
    if (!drag) return { transform: "translate3d(0,0,0)", zIndex: 1 };
    if (i === drag.i)
      return {
        transform: drag.out
          ? `translate3d(${drag.dx}px,${drag.dy}px,0) scale(1.07)`
          : `translate3d(${drag.dx}px,-14px,0) scale(1.05) rotate(1.5deg)`,
        transition: "none",
        zIndex: 40,
      };
    let s = 0;
    if (drag.i < drag.to && i > drag.i && i <= drag.to) s = -step;
    if (drag.i > drag.to && i >= drag.to && i < drag.i) s = step;
    return { transform: `translate3d(${s}px,0,0)`, zIndex: 1 };
  };

  const selected = cards.find((c) => c.id === selectedId) || null;
  const selectedIndex = cards.findIndex((c) => c.id === selectedId);
  const empty = Math.max(0, handSize - cards.length);
  const zoneArmed = !!drag && drag.out;

  /* ----------------------------- view ----------------------------- */

  return (
    <div style={S.app}>
      <style>{CSS}</style>

      <header style={S.header}>
        <div style={S.brand}>
          <span style={S.wordmark}>HANABI</span>
          <span style={S.subtitle}>hints on the back</span>
        </div>
        <div style={S.controls}>
          <div style={S.segment}>
            {[4, 5].map((n) => (
              <button key={n} onClick={() => setHandSize(n)}
                style={{ ...S.segBtn, ...(handSize === n ? S.segBtnOn : null) }}>{n}</button>
            ))}
          </div>
          <button onClick={undo} disabled={!past.length}
            style={{ ...S.chip, opacity: past.length ? 1 : 0.4 }}>Undo</button>
          <button onClick={reset} style={S.chip}>Reset</button>
        </div>
      </header>

      <main ref={stageRef} style={S.stage}>
        <div style={{ ...S.zone, height: zoneH,
          borderColor: zoneArmed ? "#ff5c5c" : "rgba(255,92,92,.28)",
          background: zoneArmed ? "rgba(255,60,60,.14)" : "transparent",
          transform: zoneArmed ? "scale(1.02)" : "scale(1)" }}>
          <span style={{ ...S.zoneLabel, color: zoneArmed ? "#ff8f8f" : "#5c6672" }}>
            {drag ? "Release to discard" : "Drag a card up here to discard"}
          </span>
        </div>

        <div style={{ ...S.row, height: cardH, visibility: loaded ? "visible" : "hidden" }}>
          {Array.from({ length: empty }).map((_, k) => (
            <button key={"slot" + k} onClick={draw} className="slot"
              style={{ ...S.slot, width: cardW, height: cardH }}>
              <span style={{ fontSize: cardH * 0.2, lineHeight: 1 }}>+</span>
              <span style={S.slotLabel}>Draw</span>
            </button>
          ))}

          {cards.map((c, i) => {
            const s = suitOf(c.suit);
            const dimmed = (selectedId !== null && c.id !== selectedId) ||
                           (leaving !== null && c.id !== leaving);
            const focus = c.id === selectedId || c.id === leaving;
            return (
              <div key={c.id} className="card"
                onPointerDown={(e) => onDown(e, i)}
                onPointerMove={onMove}
                onPointerUp={(e) => onUp(e, i)}
                onPointerCancel={() => { dragRef.current = null; setDrag(null); }}
                style={{
                  ...S.card, ...transformFor(i),
                  width: cardW, height: cardH,
                  borderRadius: Math.round(cardH * 0.09),
                  background: s
                    ? `linear-gradient(157deg, ${s.hi} 0%, ${s.hex} 46%, ${s.lo} 100%)`
                    : "linear-gradient(157deg, #5a626d 0%, #363d46 42%, #1e2229 100%)",
                  opacity: dimmed ? 0.3 : 1,
                  marginTop: focus ? -12 : 0,
                  boxShadow: focus
                    ? "0 18px 34px rgba(0,0,0,.6), 0 0 0 2px #e7ecf2"
                    : "0 10px 20px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.1)",
                }}>
                <Burst tint={s ? s.ink : "#c9d2dd"} />
                {c.rank && (
                  <span key={"r" + c.rank + pop} className="rank"
                    style={{ ...S.rank, fontSize: cardH * 0.46,
                      color: s ? s.ink : "#ffffff",
                      textShadow: s && s.ink === "#ffffff"
                        ? "0 2px 10px rgba(0,0,0,.35)" : "none" }}>
                    {c.rank}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* confirmation, after a card is dropped in the zone */}
      {leaving !== null && (
        <div style={S.scrim} onClick={() => setLeaving(null)}>
          <div className="sheet" style={{ ...S.sheet, ...S.chooser }} onClick={(e) => e.stopPropagation()}>
            <div style={S.chooserTitle}>Discard this card?</div>
            <div style={S.actions}>
              <button onClick={() => setLeaving(null)} style={{ ...S.action, ...S.actionGhost }}>Keep it</button>
              <button onClick={() => removeCard(leaving)} style={{ ...S.action, ...S.actionDiscard }}>Discard</button>
            </div>
          </div>
        </div>
      )}

      {/* hint sheet */}
      {selected && (
        <div style={S.scrim} onClick={() => setSelectedId(null)}>
          <div className="sheet" style={S.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={S.sheetHead}>
              <div>
                <div style={S.sheetEyebrow}>Card {selectedIndex + 1} from the left</div>
                <div style={S.sheetTitle}>
                  {selected.suit || selected.rank
                    ? [suitOf(selected.suit)?.label, selected.rank].filter(Boolean).join(" ")
                    : "No hints yet"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={clearHints} style={S.close}>Clear</button>
                <button onClick={() => setSelectedId(null)} style={{ ...S.close, ...S.closeMain }}>Done</button>
              </div>
            </div>

            <div className="groups">
              <div style={S.group}>
                <div style={S.groupLabel}>Number</div>
                <div style={S.pickRow}>
                  {RANKS.map((n) => (
                    <button key={n} onClick={() => setHint("rank", n)}
                      style={{ ...S.pick, ...(selected.rank === n ? S.pickOnRank : null) }}>{n}</button>
                  ))}
                </div>
              </div>
              <div style={S.group}>
                <div style={S.groupLabel}>Color</div>
                <div style={S.pickRow}>
                  {SUITS.map((s) => (
                    <button key={s.key} onClick={() => setHint("suit", s.key)} aria-label={s.label}
                      style={{ ...S.pick, background: s.hex, color: s.ink, border: "none",
                        boxShadow: selected.suit === s.key
                          ? `0 0 0 3px #12161c, 0 0 0 6px ${s.hi}`
                          : "0 2px 6px rgba(0,0,0,.4)" }}>
                      {selected.suit === s.key ? "✓" : ""}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* a quiet firework on every card */
function Burst({ tint }) {
  return (
    <svg viewBox="0 0 100 100" style={S.burst} aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI * 2) / 12;
        return (
          <line key={i}
            x1={50 + Math.cos(a) * 12} y1={50 + Math.sin(a) * 12}
            x2={50 + Math.cos(a) * (i % 2 ? 30 : 40)} y2={50 + Math.sin(a) * (i % 2 ? 30 : 40)}
            stroke={tint} strokeWidth="2" strokeLinecap="round" />
        );
      })}
    </svg>
  );
}

/* ----------------------------- styles ---------------------------- */

const FONT = "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, sans-serif";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap');
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
button { font-family: inherit; cursor: pointer; }
.card { transition: transform 170ms cubic-bezier(.2,.8,.3,1), opacity 160ms ease, margin-top 160ms ease, box-shadow 200ms ease; }
.slot:active { background: rgba(255,255,255,.06); }
.rank { animation: pop 220ms cubic-bezier(.2,1.4,.4,1); }
.sheet { animation: rise 200ms cubic-bezier(.2,.9,.3,1); }
@keyframes pop { from { transform: translate(-50%,-50%) scale(.5); opacity: 0 } to { transform: translate(-50%,-50%) scale(1); opacity: 1 } }
@keyframes rise { from { transform: translateY(16px); opacity: 0 } to { transform: none; opacity: 1 } }
button:focus-visible { outline: 2px solid #edc23a; outline-offset: 3px; }
.groups { display: flex; flex-direction: column; }
@media (max-height: 520px) {
  .groups { flex-direction: row; gap: 18px; }
  .groups > div { flex: 1; margin-bottom: 4px; }
}
@media (prefers-reduced-motion: reduce) {
  .card, .rank, .sheet { animation: none !important; transition: none !important; }
}
`;

const S = {
  app: { height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden",
    background: "radial-gradient(120% 80% at 50% 0%, #1b2029 0%, #0d1014 70%)",
    color: "#e7ecf2", fontFamily: FONT, userSelect: "none" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 14px 6px", flexShrink: 0 },
  brand: { display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 },
  wordmark: { fontSize: 17, fontWeight: 700, letterSpacing: "0.22em" },
  subtitle: { fontSize: 11, color: "#7f8a99", letterSpacing: "0.1em", whiteSpace: "nowrap" },
  controls: { display: "flex", alignItems: "center", gap: 8 },
  segment: { display: "flex", background: "#1a1f27", borderRadius: 10, padding: 3,
    border: "1px solid rgba(255,255,255,.06)" },
  segBtn: { width: 30, height: 28, borderRadius: 8, border: "none", background: "transparent",
    color: "#7f8a99", fontSize: 14, fontWeight: 500 },
  segBtnOn: { background: "#2c3441", color: "#e7ecf2" },
  chip: { height: 34, padding: "0 13px", borderRadius: 10, background: "#1a1f27",
    color: "#c3ccd8", border: "1px solid rgba(255,255,255,.08)", fontSize: 14 },
  stage: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 14, padding: "6px 12px 14px" },
  zone: { width: "94%", maxWidth: 620, flexShrink: 0, borderRadius: 14,
    border: "2px dashed", display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 160ms ease, border-color 160ms ease, transform 160ms ease" },
  zoneLabel: { fontSize: 12, letterSpacing: "0.08em", transition: "color 160ms ease" },
  row: { display: "flex", gap: GAP, alignItems: "flex-start", flexShrink: 0 },
  card: { position: "relative", flexShrink: 0, touchAction: "none", overflow: "hidden" },
  rank: { position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
    fontWeight: 700, lineHeight: 1, zIndex: 2 },
  burst: { position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.16 },
  slot: { flexShrink: 0, borderRadius: 14, border: "1.5px dashed rgba(255,255,255,.2)",
    background: "transparent", color: "#8b95a3", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 2 },
  slotLabel: { fontSize: 11, letterSpacing: "0.1em" },
  scrim: { position: "fixed", inset: 0, background: "rgba(6,8,11,.65)",
    display: "flex", alignItems: "flex-end", zIndex: 50 },
  sheet: { width: "100%", background: "#12161c", borderTop: "1px solid rgba(255,255,255,.09)",
    borderRadius: "20px 20px 0 0", padding: "12px 16px calc(16px + env(safe-area-inset-bottom))",
    boxShadow: "0 -20px 50px rgba(0,0,0,.5)" },
  sheetHead: { display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    marginBottom: 12 },
  sheetEyebrow: { fontSize: 11, color: "#7f8a99", letterSpacing: "0.12em" },
  sheetTitle: { fontSize: 18, fontWeight: 500, marginTop: 3 },
  close: { height: 34, padding: "0 13px", borderRadius: 10, background: "#222932",
    color: "#c3ccd8", border: "none", fontSize: 14 },
  closeMain: { background: "#2f3a49", color: "#e7ecf2" },
  group: { marginBottom: 12 },
  groupLabel: { fontSize: 11, color: "#7f8a99", letterSpacing: "0.14em",
    textTransform: "uppercase", marginBottom: 7 },
  pickRow: { display: "flex", gap: 10 },
  pick: { flex: 1, height: 52, borderRadius: 12, background: "#1c222b", color: "#e7ecf2",
    border: "1px solid rgba(255,255,255,.08)", fontSize: 20, fontWeight: 500 },
  pickOnRank: { background: "#0b0d10", color: "#ffffff", fontWeight: 700,
    border: "1.5px solid rgba(255,255,255,.55)" },
  chooser: { paddingTop: 16 },
  chooserTitle: { fontSize: 15, color: "#c3ccd8", marginBottom: 12 },
  actions: { display: "flex", gap: 10 },
  action: { flex: 1, height: 48, borderRadius: 12, fontSize: 14.5, fontWeight: 500 },
  actionGhost: { background: "transparent", color: "#9aa4b1", border: "1px solid rgba(255,255,255,.12)" },
  actionDiscard: { background: "#3a1e22", color: "#ef8c8c", border: "1px solid #6a3038" },
};
