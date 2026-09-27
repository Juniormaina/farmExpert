import { splitMoney, type KeyPoint } from "../insights";

export function HighlightedText({ text }: { text: string }) {
  return (
    <>
      {splitMoney(text).map((part, i) =>
        part.money ? (
          <strong key={i} className="hl-money">
            {part.text}
          </strong>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
}

export function KeyPoints({ points }: { points: KeyPoint[] }) {
  if (points.length === 0) return null;
  return (
    <div className="key-points">
      {points.map((p) => (
        <div key={p.id} className={`key-point ${p.tone}`}>
          <div className="key-point-label">{p.label}</div>
          <div className="key-point-value">{p.value}</div>
          {p.detail && <div className="key-point-detail">{p.detail}</div>}
        </div>
      ))}
    </div>
  );
}
