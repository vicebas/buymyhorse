"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AdminTrendPoint } from "@/lib/admin/analytics";

interface AdminTrendChartProps {
  data: AdminTrendPoint[];
  color?: string;
  gradientId: string;
}

export default function AdminTrendChart({
  data,
  color = "#1A3B5A",
  gradientId,
}: AdminTrendChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.36} />
              <stop offset="100%" stopColor={color} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(15,42,68,0.08)" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#718096", fontSize: 12 }}
            minTickGap={20}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tick={{ fill: "#718096", fontSize: 12 }}
            width={34}
          />
          <Tooltip
            cursor={{ stroke: color, strokeOpacity: 0.18 }}
            contentStyle={{
              borderRadius: 16,
              border: "1px solid rgba(15,42,68,0.12)",
              background: "rgba(255,255,255,0.98)",
              boxShadow: "0 16px 40px rgba(15,42,68,0.12)",
            }}
            labelStyle={{ color: "#102A43", fontWeight: 700 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
