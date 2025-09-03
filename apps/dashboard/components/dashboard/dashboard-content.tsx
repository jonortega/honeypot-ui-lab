"use client";

import { StatsOverview } from "./stats-overview";
import { AttacksChart } from "./attacks-chart";
import { TopSourcesChart } from "./top-sources-chart";
import { TopUsernamesChart } from "./top-usernames-chart";
import { TopPathsChart } from "./top-paths-chart";
import { RecentEventsTable } from "./recent-events-table";

export function DashboardContent() {
  return (
    <div className='max-w-6xl mx-auto space-y-6 px-4'>
      <StatsOverview />

      <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6'>
        <AttacksChart />
        <TopSourcesChart />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6'>
        <TopUsernamesChart />
        <TopPathsChart />
      </div>

      <RecentEventsTable />
    </div>
  );
}
