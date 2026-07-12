interface Pt {
  income: number;
  rate: number; // fraction 0..1
  label: string;
}

interface Props {
  /** [income, rate fraction] across the whole range, sorted by income. */
  curve: [number, number][];
  user: Pt | null;
  billionaire: Pt;
}

const W = 460;
const H = 300;
const M = { top: 16, right: 20, bottom: 44, left: 58 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;

const X_MIN = 12_500;
const X_MAX = 100_000_000;
const Y_MAX = 0.45;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const lx = (v: number) =>
  clamp(
    M.left +
      ((Math.log10(v) - Math.log10(X_MIN)) / (Math.log10(X_MAX) - Math.log10(X_MIN))) * PW,
    M.left,
    M.left + PW
  );
const ly = (r: number) => M.top + (1 - r / Y_MAX) * PH;

const X_TICKS = [
  [12_500, "£12.5k"],
  [100_000, "£100k"],
  [1_000_000, "£1m"],
  [10_000_000, "£10m"],
  [100_000_000, "£100m"],
] as const;
const Y_TICKS = [0, 0.1, 0.2, 0.3, 0.4];

export default function TaxRateChart({ curve, user, billionaire }: Props) {
  const pts = [...curve].sort((a, b) => a[0] - b[0]);
  const last = pts[pts.length - 1];
  // extend the band flat to the right edge if the last point falls short
  const full: [number, number][] =
    last[0] < X_MAX ? [...pts, [X_MAX, last[1]]] : pts;

  const line = full.map(([x, r], i) => `${i ? "L" : "M"} ${lx(x)},${ly(r)}`).join(" ");
  const area = [
    `M ${lx(full[0][0])},${ly(0)}`,
    ...full.map(([x, r]) => `L ${lx(x)},${ly(r)}`),
    `L ${lx(full[full.length - 1][0])},${ly(0)}`,
    "Z",
  ].join(" ");

  return (
    <svg
      className="taxchart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Effective tax rate as a share of income from £12,500 to £100 million, shaded green for low incomes fading to red at the very top."
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient
          id="rateBand"
          gradientUnits="userSpaceOnUse"
          x1={M.left}
          y1="0"
          x2={M.left + PW}
          y2="0"
        >
          <stop offset="0" stopColor="#34d399" />
          <stop offset="0.5" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#ff6b8a" />
        </linearGradient>
      </defs>

      {Y_TICKS.map((t) => (
        <g key={`y${t}`}>
          <line className="tc-grid" x1={lx(X_MIN)} y1={ly(t)} x2={lx(X_MAX)} y2={ly(t)} />
          <text className="tc-tick" x={M.left - 8} y={ly(t) + 4} textAnchor="end">
            {Math.round(t * 100)}%
          </text>
        </g>
      ))}
      {X_TICKS.map(([v, lbl]) => (
        <text key={lbl} className="tc-tick" x={lx(v)} y={ly(0) + 18} textAnchor="middle">
          {lbl}
        </text>
      ))}

      {/* effective-rate band: green (low income) -> red (very top) */}
      <path d={area} fill="url(#rateBand)" fillOpacity={0.4} />
      <path d={line} fill="none" stroke="url(#rateBand)" strokeWidth={2.5} strokeLinejoin="round" />

      {/* billionaire */}
      <g>
        <circle className="tc-bill" cx={lx(billionaire.income)} cy={ly(billionaire.rate)} r={6} />
        <text
          className="tc-bill-label"
          x={lx(billionaire.income)}
          y={ly(billionaire.rate) - 12}
          textAnchor="end"
        >
          {billionaire.label}
        </text>
      </g>

      {/* user */}
      {user && (
        <g>
          <line className="tc-guide" x1={lx(user.income)} y1={ly(0)} x2={lx(user.income)} y2={ly(user.rate)} />
          <circle className="tc-user" cx={lx(user.income)} cy={ly(user.rate)} r={6} />
          <text className="tc-user-label" x={lx(user.income)} y={ly(user.rate) - 12} textAnchor="middle">
            {user.label}
          </text>
        </g>
      )}

      <text className="tc-axis" x={M.left + PW / 2} y={H - 6} textAnchor="middle">
        Annual income (log scale)
      </text>
      <text
        className="tc-axis"
        transform={`translate(15 ${M.top + PH / 2}) rotate(-90)`}
        textAnchor="middle"
      >
        Effective tax rate
      </text>
    </svg>
  );
}
