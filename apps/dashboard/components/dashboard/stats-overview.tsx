"use client";

import { useMemo } from "react";
import { Shield, Globe, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSummaryStats } from "@/hooks/use-api";
import { formatNumber } from "@/lib/utils";

/**
 * Tipos mínimos defensivos para no romper el build si cambia el shape.
 * Si ya los tienes definidos en tu código, puedes eliminarlos y usar los tuyos.
 */
type StatsByDayItem = {
  day?: string; // e.g., "2025-09-16"
  date?: string; // alternativo
  count: number;
};

type StatsTopItem = {
  ip?: string;
  username?: string;
  value?: string; // por si el backend usa 'value' genérico
  count: number;
};

type SummaryStats = {
  totalEvents: number;
  byDay?: ReadonlyArray<StatsByDayItem>;
  topIPs?: ReadonlyArray<StatsTopItem>;
  topUsernames?: ReadonlyArray<StatsTopItem>;
};

/** Extrae YYYY-MM-DD en UTC */
function isoDayUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Intenta obtener el conteo de HOY de forma robusta. Fallback: último item del array. */
function getTodayCount(byDay?: ReadonlyArray<StatsByDayItem>): number {
  if (!byDay || byDay.length === 0) return 0;
  const today = isoDayUTC(new Date());
  const match =
    byDay.find((d) => {
      const k = (d.day ?? d.date ?? "").slice(0, 10);
      return k === today;
    }) ?? byDay[byDay.length - 1]; // fallback razonable
  return match?.count ?? 0;
}

/** Obtiene ip/username y cuenta desde estructuras flexibles */
function getTopIp(topIPs?: ReadonlyArray<StatsTopItem>) {
  if (!topIPs || topIPs.length === 0) return { label: "N/A", countText: "" };
  const first = topIPs[0];
  const label = first.ip ?? first.value ?? "N/A";
  const countText = typeof first.count === "number" ? `${formatNumber(first.count)} attempts` : "";
  return { label, countText };
}

function getTopUsername(topUsernames?: ReadonlyArray<StatsTopItem>) {
  if (!topUsernames || topUsernames.length === 0) return { label: "N/A", countText: "" };
  const first = topUsernames[0];
  const label = first.username ?? first.value ?? "N/A";
  const countText = typeof first.count === "number" ? `${formatNumber(first.count)} attempts` : "";
  return { label, countText };
}

export function StatsOverview() {
  const { data, isLoading, error } = useSummaryStats();

  // Normaliza datos con tipos defensivos
  const stats = (data ?? {}) as Partial<SummaryStats>;

  const totalEvents = useMemo(() => {
    return typeof stats.totalEvents === "number" ? stats.totalEvents : 0;
  }, [stats.totalEvents]);

  const todayEvents = useMemo(() => getTodayCount(stats.byDay), [stats.byDay]);

  const { label: topIpLabel, countText: topIpCountText } = useMemo(() => getTopIp(stats.topIPs), [stats.topIPs]);

  const { label: topUserLabel, countText: topUserCountText } = useMemo(
    () => getTopUsername(stats.topUsernames),
    [stats.topUsernames]
  );

  // if (isLoading) {
  //   return (
  //     <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
  //       {Array.from({ length: 4 }).map((_, i) => (
  //         <Card key={i} className='animate-pulse'>
  //           <CardHeader className='pb-2'>
  //             <div className='h-4 bg-muted rounded w-3/4' />
  //           </CardHeader>
  //           <CardContent>
  //             <div className='h-8 bg-muted rounded w-1/2' />
  //           </CardContent>
  //         </Card>
  //       ))}
  //     </div>
  //   );
  // }

  // if (error) {
  //   return (
  //     <Card className='border-destructive'>
  //       <CardContent className='pt-6'>
  //         <p className='text-destructive'>Failed to load statistics</p>
  //       </CardContent>
  //     </Card>
  //   );
  // }

  const statCards = [
    {
      title: "Total Events",
      value: formatNumber(totalEvents),
      icon: Shield,
      color: "text-accent",
      subtitle: "",
    },
    {
      title: "Events Today",
      value: formatNumber(todayEvents),
      icon: TrendingUp,
      color: "text-chart-2",
      subtitle: "",
    },
    {
      title: "Top Source IP",
      value: topIpLabel,
      icon: Globe,
      color: "text-chart-3",
      subtitle: topIpCountText,
      mono: true,
    },
    {
      title: "Top Username",
      value: topUserLabel,
      icon: AlertTriangle,
      color: "text-chart-4",
      subtitle: topUserCountText,
      mono: true,
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
            <div className={`text-2xl font-bold text-card-foreground ${stat.mono ? "font-mono" : ""}`}>
              {stat.value}
            </div>
            {stat.subtitle && <p className='text-xs text-muted-foreground mt-1'>{stat.subtitle}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
