import type { EvaluatedPerson, TraitDefinition } from '../types/ranking';

interface RadarChartProps {
  primary: EvaluatedPerson;
  secondary?: EvaluatedPerson | null;
  traits: TraitDefinition[];
  primaryColor?: string;
  secondaryColor?: string;
}

export function RadarChart({
  primary,
  secondary,
  traits,
  primaryColor = '#2563EB',
  secondaryColor = '#0EA5E9',
}: RadarChartProps) {
  const axes = traits.slice(0, 8);
  const count = axes.length;
  if (count < 3) return null;

  const size = 280;
  const center = size / 2;
  const maxRadius = 86;
  const levels = [25, 50, 75, 100];

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const r = (Math.max(0, Math.min(100, value)) / 100) * maxRadius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const buildPolygon = (person: EvaluatedPerson) =>
    axes
      .map((trait, idx) => {
        const score = person.scores[trait.id]?.score ?? 0;
        const pt = getPoint(idx, score);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      })
      .join(' ');

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[270px] h-auto overflow-visible"
        role="img"
        aria-label={`Trait profile radar chart for ${primary.fullName}`}
      >
        {levels.map((level) => {
          const ringPoints = axes
            .map((_, idx) => {
              const pt = getPoint(idx, level);
              return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
            })
            .join(' ');
          return (
            <polygon
              key={level}
              points={ringPoints}
              fill="none"
              stroke="#D9E4F2"
              strokeWidth={level === 100 ? 1.2 : 0.8}
              strokeDasharray={level === 100 ? undefined : '2 3'}
            />
          );
        })}

        {axes.map((trait, idx) => {
          const outer = getPoint(idx, 100);
          const labelPt = getPoint(idx, 124);
          const anchor =
            Math.abs(labelPt.x - center) < 10
              ? 'middle'
              : labelPt.x > center
                ? 'start'
                : 'end';

          return (
            <g key={trait.id}>
              <line
                x1={center}
                y1={center}
                x2={outer.x}
                y2={outer.y}
                stroke="#D9E4F2"
                strokeWidth={0.9}
              />
              <text
                x={labelPt.x}
                y={labelPt.y}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="fill-[#475569] text-[10.5px] font-medium"
              >
                {trait.shortLabel}
              </text>
            </g>
          );
        })}

        {secondary && (
          <polygon
            points={buildPolygon(secondary)}
            fill={secondaryColor}
            fillOpacity={0.16}
            stroke={secondaryColor}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        )}

        <polygon
          points={buildPolygon(primary)}
          fill={primaryColor}
          fillOpacity={0.18}
          stroke={primaryColor}
          strokeWidth={2.2}
          strokeLinejoin="round"
        />

        {axes.map((trait, idx) => {
          const pt = getPoint(idx, primary.scores[trait.id]?.score ?? 0);
          return (
            <circle
              key={`dot-${trait.id}`}
              cx={pt.x}
              cy={pt.y}
              r={3}
              fill={primaryColor}
              stroke="#FFFFFF"
              strokeWidth={1.2}
            />
          );
        })}

        {secondary &&
          axes.map((trait, idx) => {
            const pt = getPoint(idx, secondary.scores[trait.id]?.score ?? 0);
            return (
              <circle
                key={`dot2-${trait.id}`}
                cx={pt.x}
                cy={pt.y}
                r={2.8}
                fill={secondaryColor}
                stroke="#FFFFFF"
                strokeWidth={1.2}
              />
            );
          })}
      </svg>
    </div>
  );
}
