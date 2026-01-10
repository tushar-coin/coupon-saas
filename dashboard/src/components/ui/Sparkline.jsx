import { LineChart, Line, ResponsiveContainer } from "recharts";

export default function Sparkline({ data, color = "#4F46E5" }) {
  // Generate mock 7-day trend data if not provided
  const chartData = data || Array.from({ length: 7 }, (_, i) => ({
    value: Math.floor(Math.random() * 100) + 50
  }));

  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={chartData}>
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color}
          strokeWidth={2}
          dot={false}
          animationDuration={1000}
          animationEasing="ease-in-out"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
