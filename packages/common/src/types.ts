export type StatsTopItem = Readonly<{ value: string; count: number }>;
export type StatsByDayItem = Readonly<{ date: string; count: number }>;
export type StatsSummary = Readonly<{
  totalEvents: number;
  byDay: ReadonlyArray<StatsByDayItem>;
  topIPs: ReadonlyArray<StatsTopItem>;
  topUsernames: ReadonlyArray<StatsTopItem>;
  topPaths: ReadonlyArray<StatsTopItem>;
}>;
