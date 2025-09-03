"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSummaryStats } from "@/hooks/use-api";

export function AttacksChart() {
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

  if (error || !stats?.byDay) {
    return (
      <Card className='border-destructive'>
        <CardHeader>
          <CardTitle>Attacks Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-destructive'>Failed to load chart data</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = stats.byDay.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    attacks: item.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attacks Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--border))' />
            <XAxis dataKey='date' stroke='hsl(var(--muted-foreground))' fontSize={12} />
            <YAxis stroke='hsl(var(--muted-foreground))' fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                color: "hsl(var(--popover-foreground))",
              }}
            />
            <Line
              type='monotone'
              dataKey='attacks'
              stroke='hsl(var(--chart-1))'
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "hsl(var(--chart-1))", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
