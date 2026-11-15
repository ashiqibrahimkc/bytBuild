import { ConstructionProvider } from "@/lib/store";
import AppShell from "@/components/layout/AppShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConstructionProvider>
      <AppShell>
        {children}
      </AppShell>
    </ConstructionProvider>
  );
}
