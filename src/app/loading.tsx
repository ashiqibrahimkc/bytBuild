import { DashboardSkeleton } from "@/components/ui/page-skeletons";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 max-w-7xl mx-auto">
      <DashboardSkeleton />
    </div>
  );
}
