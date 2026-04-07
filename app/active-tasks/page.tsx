"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { EnhancedActiveTasks } from "@/components/dashboard/EnhancedActiveTasks";
import { LoadingAnimation } from "@/components/ui/loading-animation";

export default function ActiveTasksPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <LoadingAnimation />
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return <EnhancedActiveTasks />;
}
