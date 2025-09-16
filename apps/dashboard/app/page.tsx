import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { OverviewPage } from "@/components/dashboard/overview-page";

export default function HomePage() {
  return (
    <DashboardLayout>
      <OverviewPage />
    </DashboardLayout>
  );
}
