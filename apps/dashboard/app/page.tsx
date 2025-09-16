import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { OverviewPage } from "@/components/dashboard/overview-page";
import { DashboardDataProvider } from "@/components/dashboard/dashboard-data-provider";

export default function HomePage() {
  return (
    <DashboardDataProvider>
      <DashboardLayout>
        <OverviewPage />
      </DashboardLayout>
    </DashboardDataProvider>
  );
}
