import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip as RTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { ChartCard } from "./ChartCard";

// Softer, modern color palette
const COLORS = [
  "#4F6BED", // blue
  "#5AC18E", // green
  "#F4C430", // gold
  "#F06A6A", // red
  "#9B6BDF", // purple
  "#FFA500", // orange
  "#40E0D0", // turquoise
];

const nf = (n) =>
  Intl.NumberFormat().format(Number.isFinite(n) ? n : 0);

export default function DashboardCharts({
  sentiments,
  emotions,
  triggerPieData,
  totalEvals,
  totalTriggers,
  chartHeight,
  downSm,
}) {
  const pieRadius = downSm ? 80 : 110;

  return (
    <>
      {/* Sentiment */}
      <ChartCard title="Sentiment Distribution" height={chartHeight}>
        <PieChart>
          <Pie
            data={sentiments}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={pieRadius}
            paddingAngle={3}
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
          >
            {sentiments.map((_, i) => (
              <Cell
                key={i}
                fill={COLORS[i % COLORS.length]}
                style={{ cursor: "pointer" }}
              />
            ))}
          </Pie>
          <Legend verticalAlign="bottom" iconType="circle" />
          <RTooltip formatter={(val, n) => [nf(val), n]} />
        </PieChart>
      </ChartCard>

      {/* Emotions */}
      <ChartCard title="Emotion Distribution" height={chartHeight}>
        <BarChart
          data={emotions}
          margin={{ top: 16, right: 20, left: 0, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {emotions.map((_, i) => (
              <Cell
                key={i}
                fill={COLORS[i % COLORS.length]}
                style={{ cursor: "pointer" }}
              />
            ))}
          </Bar>
          <Legend />
          <RTooltip formatter={(val, n) => [nf(val), n]} />
        </BarChart>
      </ChartCard>

      {/* Triggers */}
      <ChartCard
        title="Trigger Evaluations"
        subtitle={`${nf(totalEvals)} evals • ${nf(totalTriggers)} triggers`}
        height={chartHeight}
      >
        <PieChart>
          <Pie
            data={triggerPieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={pieRadius}
            paddingAngle={3}
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
          >
            {triggerPieData.map((_, i) => (
              <Cell
                key={i}
                fill={COLORS[i % COLORS.length]}
                style={{ cursor: "pointer" }}
              />
            ))}
          </Pie>
          <Legend verticalAlign="bottom" iconType="circle" />
          <RTooltip formatter={(val, n) => [nf(val), n]} />
        </PieChart>
      </ChartCard>
    </>
  );
}
