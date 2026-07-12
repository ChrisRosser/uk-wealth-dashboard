interface Marker {
  p: number; // population share 0..1
  y: number; // wealth share 0..1
  label: string;
}

interface Props {
  points: [number, number][];
  marker?: Marker | null;
}

// Plot geometry (SVG user units).
const W = 440;
const H = 384;
const M = { top: 16, right: 16, bottom: 46, left: 50 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;

const sx = (s: number) => M.left + s * PW;
const sy = (s: number) => M.top + (1 - s) * PH; // invert: 0 at bottom

const ticks = [0, 0.25, 0.5, 0.75, 1];

export default function LorenzCurve({ points, marker }: Props) {
  const line = points.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ");

  // Inequality gap: diagonal (equality) down to the Lorenz curve.
  const area =
    `M ${sx(0)},${sy(0)} L ${sx(1)},${sy(1)} ` +
    points
      .slice()
      .reverse()
      .map(([x, y]) => `L ${sx(x)},${sy(y)}`)
      .join(" ") +
    " Z";

  return (
    <svg
      className="lorenz"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Lorenz curve of UK household wealth. The further the curve bows below the line of equality, the more unequal the distribution."
      preserveAspectRatio="xMidYMid meet"
    >
      {/* gridlines + tick labels */}
      {ticks.map((t) => (
        <g key={`gx${t}`}>
          <line className="lorenz-grid" x1={sx(t)} y1={sy(0)} x2={sx(t)} y2={sy(1)} />
          <text className="lorenz-tick" x={sx(t)} y={sy(0) + 18} textAnchor="middle">
            {t * 100}
          </text>
        </g>
      ))}
      {ticks.map((t) => (
        <g key={`gy${t}`}>
          <line className="lorenz-grid" x1={sx(0)} y1={sy(t)} x2={sx(1)} y2={sy(t)} />
          <text className="lorenz-tick" x={sx(0) - 8} y={sy(t) + 4} textAnchor="end">
            {t * 100}
          </text>
        </g>
      ))}

      {/* inequality gap */}
      <path className="lorenz-area" d={area} />

      {/* line of perfect equality */}
      <line
        className="lorenz-diagonal"
        x1={sx(0)}
        y1={sy(0)}
        x2={sx(1)}
        y2={sy(1)}
      />

      {/* the Lorenz curve */}
      <polyline className="lorenz-line" points={line} />

      {/* user marker */}
      {marker && (
        <g>
          <line
            className="lorenz-guide"
            x1={sx(marker.p)}
            y1={sy(0)}
            x2={sx(marker.p)}
            y2={sy(marker.y)}
          />
          <line
            className="lorenz-guide"
            x1={sx(0)}
            y1={sy(marker.y)}
            x2={sx(marker.p)}
            y2={sy(marker.y)}
          />
          <circle className="lorenz-marker" cx={sx(marker.p)} cy={sy(marker.y)} r={6} />
          <text
            className="lorenz-marker-label"
            x={sx(marker.p) - 10}
            y={sy(marker.y) - 10}
            textAnchor="end"
          >
            {marker.label}
          </text>
        </g>
      )}

      {/* axis titles */}
      <text className="lorenz-axis" x={M.left + PW / 2} y={H - 6} textAnchor="middle">
        Households, poorest → wealthiest (%)
      </text>
      <text
        className="lorenz-axis"
        transform={`translate(14 ${M.top + PH / 2}) rotate(-90)`}
        textAnchor="middle"
      >
        Share of total wealth (%)
      </text>
    </svg>
  );
}
