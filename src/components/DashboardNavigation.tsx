import { Link } from "@tanstack/react-router";
import { CalendarDays, Home, LayoutGrid, MoreHorizontal, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";

export const DASHBOARD_TABS = ["home", "players", "teams", "schedule", "more"] as const;
export type DashboardTab = (typeof DASHBOARD_TABS)[number];

const sections = [
  { id: "home", label: "sectionHome", icon: Home },
  { id: "players", label: "sectionPlayers", icon: Users },
  { id: "teams", label: "sectionTeams", icon: LayoutGrid },
  { id: "schedule", label: "sectionSchedule", icon: CalendarDays },
  { id: "more", label: "sectionMore", icon: MoreHorizontal },
] as const;

export function DashboardNavigation({ activeTab }: { activeTab: DashboardTab }) {
  const { t } = useI18n();
  return (
    <nav aria-label={t("clubSections")} className="dashboard-navigation fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-header text-header-foreground lg:inset-x-auto lg:bottom-auto lg:top-16 lg:sticky lg:h-[calc(100dvh-4rem)] lg:w-48 lg:shrink-0 lg:flex lg:flex-col lg:gap-2 lg:border-t-0 lg:border-r lg:bg-sidebar lg:p-3">
      {sections.map(({ id, label, icon: Icon }) => (
        <Button key={id} asChild variant="ghost" className={`h-16 min-w-0 flex-col gap-1 rounded-none px-1 text-[10px] sm:text-xs lg:h-12 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-md lg:px-3 lg:text-sm ${activeTab === id ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground"}`}>
          <Link to="/" search={(prev) => ({ ...prev, tab: id })} resetScroll aria-current={activeTab === id ? "page" : undefined}>
            <Icon className="size-5 shrink-0" />
            <span className="min-w-0 truncate">{t(label)}</span>
          </Link>
        </Button>
      ))}
    </nav>
  );
}