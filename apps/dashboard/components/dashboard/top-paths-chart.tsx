"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSummaryStats } from "@/hooks/use-api";

export function TopPathsChart() {
  const { data: stats, isLoading, error } = useSummaryStats();

  if (isLoading) {
    return (
      <Card className='animate-pulse'>
        <CardHeader>
          <div className='h-6 bg-muted rounded w-1/3' />
        </CardHeader>
        <CardContent>
          <div className='h-64 bg-muted rounded' />
        </CardContent>
      </Card>
    );
  }

  if (error || !stats?.topPaths) {
    return (
      <Card className='border-destructive'>
        <CardHeader>
          <CardTitle>Top Attack Paths</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-destructive'>Failed to load chart data</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = stats.topPaths.slice(0, 8).map((item) => ({
    path: item.path.length > 20 ? `${item.path.substring(0, 20)}...` : item.path,
    fullPath: item.path,
    attempts: item.count,
  }));

  return (
    <Card className='hover:shadow-lg transition-shadow'>
      <CardHeader>
        <CardTitle className='text-foreground'>Top Attack Paths</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={300}>
          <BarChart data={chartData} layout='horizontal'>
            <CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--border))' opacity={0.3} />
            <XAxis
              type='number'
              stroke='hsl(var(--muted-foreground))'
              fontSize={12}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              type='category'
              dataKey='path'
              stroke='hsl(var(--muted-foreground))'
              fontSize={12}
              width={120}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--card-foreground))",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value, name, props) => [value, "Attempts", props.payload?.fullPath]}
              labelStyle={{ color: "hsl(var(--card-foreground))" }}
            />
            <Bar
              dataKey='attempts'
              fill='hsl(var(--chart-4))'
              radius={[0, 4, 4, 0]}
              className='hover:opacity-80 transition-opacity'
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
