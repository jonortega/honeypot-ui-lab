"use client";

import { Shield, Globe, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSummaryStats } from "@/hooks/use-api";
import { formatNumber } from "@/lib/utils";

export function StatsOverview() {
  const { data: stats, isLoading, error } = useSummaryStats();

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className='animate-pulse'>
            <CardHeader className='pb-2'>
              <div className='h-4 bg-muted rounded w-3/4' />
            </CardHeader>
            <CardContent>
              <div className='h-8 bg-muted rounded w-1/2' />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className='border-destructive'>
        <CardContent className='pt-6'>
          <p className='text-destructive'>Failed to load statistics</p>
        </CardContent>
      </Card>
    );
  }

  const totalEvents = stats?.totalEvents || 0;
  const todayEvents = stats?.byDay?.[stats.byDay.length - 1]?.count || 0;
  const topIP = stats?.topIPs?.[0];
  const topUsername = stats?.topUsernames?.[0];

  const statCards = [
    {
      title: "Total Events",
      value: formatNumber(totalEvents),
      icon: Shield,
      color: "text-accent",
    },
    {
      title: "Today's Events",
      value: formatNumber(todayEvents),
      icon: TrendingUp,
      color: "text-chart-2",
    },
    {
      title: "Top Source IP",
      value: topIP?.ip || "N/A",
      subtitle: topIP ? `${formatNumber(topIP.count)} attempts` : "",
      icon: Globe,
      color: "text-chart-3",
    },
    {
      title: "Top Username",
      value: topUsername?.username || "N/A",
      subtitle: topUsername ? `${formatNumber(topUsername.count)} attempts` : "",
      icon: AlertTriangle,
      color: "text-chart-4",
    },
  ];

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      {statCards.map((stat) => (
        <Card
          key={stat.title}
          className='hover:shadow-lg hover:shadow-accent/5 hover:border-accent/20 transition-smooth cursor-pointer group'
        >
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground group-hover:text-accent transition-smooth'>
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color} group-hover:scale-110 transition-smooth`} />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-card-foreground'>{stat.value}</div>
            {stat.subtitle && <p className='text-xs text-muted-foreground mt-1'>{stat.subtitle}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
