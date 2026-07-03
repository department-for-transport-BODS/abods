import { useId, useMemo } from "react";
import type { TimeSeriesData } from "@/services/on-time/on-time.service";

interface OperatorSparklineProps {
  data: TimeSeriesData[];
  width?: number;
  height?: number;
  title?: string;
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

export const OperatorSparkline = ({
  data,
  width = 220,
  height = 44,
  title = "On time stats for the selected duration",
}: OperatorSparklineProps) => {
  const gradientId = useId().replace(/:/g, "");
  const points = useMemo(() => {
    if (data.length === 0) return [];

    return data
      .map((point) => clamp(point.onTimeRatio ?? 0))
      .map((value, index, array) => {
        const x =
          array.length > 1 ? (index / (array.length - 1)) * width : width / 2;
        const y = height - value * height;
        return { x, y };
      });
  }, [data, width, height]);

  if (points.length === 0) {
    return <span className="govuk-body">-</span>;
  }

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");

  const areaPath = `${path} L${width},${height} L0,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={title}
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient
          id={`operator-sparkline-gradient-${gradientId}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor="#6A3D9A" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={areaPath}
        fill={`url(#operator-sparkline-gradient-${gradientId})`}
      />
      <path d={path} fill="none" stroke="#6A3D9A" strokeWidth="1.5" />
      {points.map((point, index) => (
        <circle
          key={`${point.x}-${point.y}-${index}`}
          cx={point.x}
          cy={point.y}
          r="1.7"
          fill="#6A3D9A"
        />
      ))}
    </svg>
  );
};
