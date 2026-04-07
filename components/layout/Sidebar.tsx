"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, Users, Settings, BarChart3, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";

export function Sidebar() {
    const pathname = usePathname();
    const { t } = useLanguage();

    const navigation = [
        { name: t.nav.dashboard, href: "/", icon: LayoutDashboard },
        { name: t.nav.projects, href: "/projects", icon: FolderKanban },
        { name: t.nav.resources, href: "/resources", icon: Users },
        { name: t.nav.performance, href: "/performance", icon: BarChart3 },
        { name: t.nav.activeTasks, href: "/active-tasks", icon: Activity },
        { name: t.nav.settings, href: "/settings", icon: Settings },
    ];

    return (
        <div className="flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
            <div className="flex h-16 items-center border-b px-6">
                <span className="text-lg font-bold tracking-tight">JiraDash</span>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="flex-1 space-y-1 px-3">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                    isActive
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                        : "text-muted-foreground"
                                )}
                            >
                                <item.icon
                                    className={cn("mr-3 h-5 w-5 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="border-t p-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20" />
                    <div className="text-sm">
                        <p className="font-medium">{t.sidebar.user}</p>
                        <p className="text-xs text-muted-foreground">{t.sidebar.projectManager}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

