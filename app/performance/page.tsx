"use client";

import { useSession } from "next-auth/react";
import { PerformanceDashboard } from "@/components/performance/PerformanceDashboard";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { useLanguage } from "@/components/language-provider";

export default function PerformancePage() {
    const { data: session, status } = useSession();
    const { language } = useLanguage();

    if (status === "loading") {
        return <LoadingAnimation />;
    }

    if (!session) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-muted-foreground">
                    {language === "vi" ? "Vui lòng đăng nhập để xem đánh giá hiệu suất." : "Please login to view performance evaluation."}
                </p>
            </div>
        );
    }

    return <PerformanceDashboard />;
}
