"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityStreamProps {
    projectId?: string;
}

export function ActivityStream({ projectId }: ActivityStreamProps) {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchActivity() {
            setLoading(true);
            try {
                let jql = 'updated >= -7d ORDER BY updated DESC';
                if (projectId && projectId !== 'all') {
                    jql = `project = "${projectId}" ORDER BY updated DESC`;
                }

                const res = await fetch('/api/issues', {
                    method: 'POST',
                    body: JSON.stringify({
                        jql,
                        maxResults: 6,
                        fields: ['summary', 'status', 'assignee', 'updated', 'issuetype', 'project']
                    })
                });
                const data = await res.json();

                if (data.issues) {
                    const mapped = data.issues.map((issue: any) => ({
                        user: issue.fields.assignee?.displayName || 'Unassigned',
                        action: 'updated', // Generic action for now
                        target: `${issue.key}: ${issue.fields.summary}`,
                        status: issue.fields.status?.name,
                        time: new Date(issue.fields.updated).toLocaleDateString(),
                        avatar: issue.fields.assignee?.avatarUrls?.['48x48'],
                        initials: issue.fields.assignee?.displayName?.substring(0, 2).toUpperCase() || 'NA',
                        key: issue.key
                    }));
                    setActivities(mapped);
                }
            } catch (e) {
                console.error("Failed to fetch activity", e);
            } finally {
                setLoading(false);
            }
        }
        fetchActivity();
    }, [projectId]);

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader>
                <CardTitle>Recent Activity {projectId && projectId !== 'all' ? `(${projectId})` : ''}</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="flex gap-4"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-[200px]" /><Skeleton className="h-4 w-[150px]" /></div></div>)}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {activities.length === 0 ? <div className="text-sm text-muted-foreground">No recent activity.</div> :
                            activities.map((activity, index) => (
                                <div key={index} className="flex items-start">
                                    <Avatar className="h-9 w-9 mt-1">
                                        <AvatarImage src={activity.avatar} alt={activity.user} />
                                        <AvatarFallback>{activity.initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            <span className="font-bold">{activity.user}</span>
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            <span className="text-primary">
                                                {activity.target}
                                            </span>
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs bg-muted px-2 py-0.5 rounded">{activity.status}</span>
                                            <span className="text-xs text-muted-foreground">{activity.time}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
