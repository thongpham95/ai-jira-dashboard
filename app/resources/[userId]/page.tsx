"use client";

import { use } from "react";
import { useSearchParams } from 'next/navigation';
import { MemberReportView } from "@/components/reports/MemberReportView";

export default function MemberReportPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId: rawUserId } = use(params);
    const userId = decodeURIComponent(rawUserId);
    const searchParams = useSearchParams();
    const userName = searchParams.get('name') || userId;
    const projectFilter = searchParams.get('project');

    return (
        <MemberReportView
            userId={userId}
            userName={userName}
            projectFilter={projectFilter}
        />
    );
}
