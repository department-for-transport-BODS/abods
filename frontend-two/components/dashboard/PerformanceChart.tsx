import { PerformanceCategories, PunctualityOverview } from "@/types/dashboard";

interface PerformanceChartProps {
  data: PunctualityOverview;
}

const labels: Record<PerformanceCategories, string> = {
  OnTime: "On-Time",
  Late: "Late",
  Early: "Early",
};

const hints: Record<PerformanceCategories, string> = {
  OnTime: "",
  Late: "(> 5:59 minutes)",
  Early: "(> 1 minute)",
};

const categories: PerformanceCategories[] = ["OnTime", "Late", "Early"];

export const PerformanceChart = ({ data }: PerformanceChartProps) => {
  const total = (data.onTime ?? 0) + (data.late ?? 0) + (data.early ?? 0);

  const values = categories.map((category) => {
    const value =
      data[
        category === "OnTime"
          ? "onTime"
          : (category.toLowerCase() as "late" | "early")
      ] ?? 0;
    const pct = total > 0 ? (value / total) * 100 : 0;
    return {
      category,
      pct,
    };
  });

  return (
    <div className="performance-chart">
      <div className="performance-chart__bars" aria-hidden="true">
        {values.map(({ category, pct }) => (
          <div
            key={category}
            className={`performance-chart__bar performance-chart__bar--${category.toLowerCase()}`}
          >
            <span className="performance-chart__value">{pct.toFixed(1)}%</span>
            <div
              className="performance-chart__fill"
              style={{ height: `${pct}%` }}
            />
          </div>
        ))}
      </div>
      <div className="performance-chart__legend">
        {categories.map((category) => (
          <div key={category} className="performance-chart__legend-item">
            <span
              className={`performance-chart__legend-swatch performance-chart__legend-swatch--${category.toLowerCase()}`}
            />
            <span className="performance-chart__legend-label">
              <strong>{labels[category]}</strong> {hints[category]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
