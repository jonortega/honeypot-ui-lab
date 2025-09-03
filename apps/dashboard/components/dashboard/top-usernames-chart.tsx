"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSummaryStats } from "@/hooks/use-api";

export function TopUsernamesChart() {
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

  if (error || !stats?.topUsernames) {
    return (
      <Card className='border-destructive'>
        <CardHeader>
          <CardTitle>Top Usernames</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-destructive'>Failed to load chart data</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = stats.topUsernames.slice(0, 8).map((item) => ({
    username: item.username.length > 15 ? `${item.username.substring(0, 15)}...` : item.username,
    fullUsername: item.username,
    attempts: item.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Usernames</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--border))' />
            <XAxis
              dataKey='username'
              stroke='hsl(var(--muted-foreground))'
              fontSize={12}
              angle={-45}
              textAnchor='end'
              height={80}
            />
            <YAxis stroke='hsl(var(--muted-foreground))' fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                color: "hsl(var(--popover-foreground))",
              }}
              formatter={(value, name, props) => [value, "Attempts", props.payload?.fullUsername]}
            />
            <Bar dataKey='attempts' fill='hsl(var(--chart-3))' radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
