"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { MemberReportView } from "@/components/reports/MemberReportView";
import { useLanguage } from "@/components/language-provider";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    async function checkPermissions() {
      if (status !== "authenticated") {
        setCheckingRole(false);
        return;
      }

      try {
        // Fetch permissions from our API
        // We check for 'ADMINISTER_PROJECTS' or 'BROWSE_PROJECTS' to distinguish capability
        // Ideally we check a specific project, but for 'Global' Dashboard role, we can pick a default or check 'permissions' endpoint generally
        // The /api/auth/permissions endpoint calls mypermissions. 
        // If we don't pass projectKey, it might return global permissions or error depending on Jira instance config.
        // Let's try fetching without projectKey first (Standard Jira Cloud often supports this for global context)
        // Or we fetch for the default project [TVT].

        // To be safe, we'll assume Everyone is 'USER' unless they have specific Admin permission.
        // Let's just fetch default list.
        const res = await fetch('/api/auth/permissions');
        const data = await res.json();

        if (data.permissions && data.permissions.ADMINISTER_PROJECTS) {
          // Check if they have the permission
          // Jira response: { permissions: { ADMINISTER_PROJECTS: { havePermission: true, ... } } }
          if (data.permissions.ADMINISTER_PROJECTS.havePermission) {
            setIsAdmin(true);
          }
        } else {
          // If API structure varies or we specifically need a project context to check admin:
          // We'll default to USER for safety.
          setIsAdmin(false);
        }

      } catch (e) {
        console.error("Failed to check permissions", e);
        // Default to Member view on error
        setIsAdmin(false);
      } finally {
        setCheckingRole(false);
      }
    }

    if (status === "authenticated") {
      checkPermissions();
    } else if (status === "unauthenticated") {
      setCheckingRole(false);
    }
  }, [status]);

  if (status === "loading" || checkingRole) {
    return <LoadingAnimation />;
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-6 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Jira Dashboard</h1>
          <p className="text-muted-foreground">
            {t.settings.description || "Please login to view your dashboard and reports."}
          </p>
          <Button size="lg" onClick={() => signIn("atlassian")}>
            {t.header.loginWithJira}
          </Button>
        </div>
      </div>
    );
  }

  // Authenticated
  if (isAdmin) {
    return <AdminDashboard />;
  }

  // User View (Member Report)
  // We use the session user's ID.
  // Note: session.user.id SHOULD be the accountId.
  // We'll assume the logged in user is the "Member" regarding the report.
  // We explicitly name arguments to ensure type safety.
  // @ts-ignore
  const userId = session?.user?.id;
  const userName = session?.user?.name || "User";

  if (!userId) {
    return (
      <div className="p-4 text-center text-red-500">
        Error: Unable to identify user account ID from session.
      </div>
    );
  }

  return (
    <MemberReportView
      userId={userId}
      userName={userName}
      hideBackButton={true}
    // We can optionally pass a projectFilter if we want to default them to a project
    // For now, let them see their global stats across all projects (standard for 'My' view)
    />
  );
}
