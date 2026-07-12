interface Pt {
  income: number;
  rate: number; // fraction 0..1
  label: string;
}

interface Props {
  ordinary: [number, number][]; // [income, rate fraction]
  user: Pt | null;
  billionaire: Pt;
}

const W = 460;
const H = 300;
const M = { top: 16, right: 20, bottom: 44, left: 44 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;

const X_MIN = 12_500;
const X_MAX = 100_000_000;
const Y_MAX = 0.45;

const lx = (v: number) =>
  M.left + ((Math.log10(v) - Math.log10(X_MIN)) / (Math.log10(X_MAX) - Math.log10(X_MIN))) * PW;
const ly = (r: number) => M.top + (1 - r / Y_MAX) * PH;

const X_TICKS = [
  [12_500, "£12.5k"],
  [100_000, "£100k"],
  [1_000_000, "£1m"],
  [10_000_000, "£10m"],
  [100_000_000, "£100m"],
] as const;
const Y_TICKS = [0, 0.1, 0.2, 0.3, 0.4];

export default function TaxRateChart({ ordinary, user, billionaire }: Props) {
  const line = ordinary.map(([inc, r]) => `${lx(inc)},${ly(r)}`).join(" ");

  return (
    <svg
      className="taxchart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Effective tax rate as a share of income across the population, with markers for you and a billionaire."
      preserveAspectRatio="xMidYMid meet"
    >
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

      {/* ordinary households (ONS, all taxes % of gross income) */}
      <polyline className="tc-line" points={line} />
      {ordinary.map(([inc, r], i) => (
        <circle key={i} className="tc-dot" cx={lx(inc)} cy={ly(r)} r={3} />
      ))}

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
    </svg>
  );
}
