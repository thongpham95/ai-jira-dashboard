"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { LoadingAnimation } from '@/components/ui/loading-animation';
import { useLanguage } from '@/components/language-provider';

interface ActiveTask {
    issueKey: string;
    summary: string;
    project: { key: string; name: string; avatarUrl: string };
    issueType: { name: string; iconUrl: string };
    status: { name: string; category: string; colorName: string };
    assignee: { accountId: string; displayName: string; avatarUrl: string };
    updatedAt: string;
}

interface ComponentProps {
    projectKey?: string;
    refreshInterval?: number; // ms
}

export function RealTimeActiveTasks({ projectKey = 'all', refreshInterval = 30000 }: ComponentProps) {
    const { data: session, status } = useSession();
    const { t } = useLanguage();
    const [tasks, setTasks] = useState<ActiveTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const fetchTasks = async () => {
        if (status !== 'authenticated') return;
        
        try {
            const res = await fetch(`/api/reports/active-tasks?projectKey=${projectKey}`);
            if (!res.ok) throw new Error('Failed to fetch active tasks');
            
            const data = await res.json();
            setTasks(data.tasks || []);
            setLastUpdate(new Date());
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
        const interval = setInterval(fetchTasks, refreshInterval);
        return () => clearInterval(interval);
    }, [projectKey, status, refreshInterval]);

    // Group tasks by assignee
    const tasksByAssignee = tasks.reduce((acc, task) => {
        const id = task.assignee.accountId;
        if (!acc[id]) {
            acc[id] = {
                user: task.assignee,
                tasks: []
            };
        }
        acc[id].tasks.push(task);
        return acc;
    }, {} as Record<string, { user: any, tasks: ActiveTask[] }>);

    const assignees = Object.values(tasksByAssignee).sort((a, b) => b.tasks.length - a.tasks.length);

    if (loading && tasks.length === 0) {
        return (
            <Card className="h-full border border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Activity className="h-5 w-5 text-primary animate-pulse" />
                        {t.dashboard.activeTasks || "Real-time Active Tasks"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex flex-col items-center justify-center gap-4">
                    <LoadingAnimation />
                    <p className="text-sm text-muted-foreground">{t.common.loading || "Loading tasks..."}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full border border-border shadow-md overflow-hidden flex flex-col">
            <CardHeader className="bg-muted/30 pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Activity className="h-5 w-5 text-green-500 animate-pulse" />
                            {t.dashboard.activeTasks || "Real-time Active Tasks"}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                            {tasks.length} {t.dashboard.issuesInProgress || "issues currently in progress"}
                        </CardDescription>
                    </div>
                    {lastUpdate && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: vi })}
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
                <ScrollArea className="h-[350px]">
                    <div className="p-4 space-y-6">
                        {error ? (
                            <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-md">
                                {error}
                            </div>
                        ) : assignees.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                {t.dashboard.noActiveTasks || "No tasks currently in progress."}
                            </div>
                        ) : (
                            <AnimatePresence>
                                {assignees.map(({ user, tasks: userTasks }) => (
                                    <motion.div 
                                        key={user.accountId}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        layout
                                        className="space-y-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                                                <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                                                <AvatarFallback>{user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="font-medium text-sm">
                                                {user.displayName}
                                                <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 h-4">
                                                    {userTasks.length}
                                                </Badge>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2 pl-11">
                                            {userTasks.map(task => (
                                                <motion.div 
                                                    key={task.issueKey}
                                                    layoutId={task.issueKey}
                                                    className="group text-sm border border-border/50 bg-card rounded-md p-3 shadow-sm hover:shadow-md transition-all hover:border-primary/30 relative overflow-hidden"
                                                >
                                                    {/* Status indicator line */}
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                                                    
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <img src={task.issueType.iconUrl} alt={task.issueType.name} className="w-4 h-4" />
                                                                <a 
                                                                    href={`/projects/all#${task.issueKey}`} 
                                                                    className="font-medium text-primary hover:underline"
                                                                >
                                                                    {task.issueKey}
                                                                </a>
                                                                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800">
                                                                    {task.status.name}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-muted-foreground line-clamp-1 group-hover:line-clamp-none transition-all">
                                                                {task.summary}
                                                            </p>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground font-mono whitespace-nowrap bg-muted px-2 py-1 rounded">
                                                            {formatDistanceToNow(new Date(task.updatedAt), { locale: vi })}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </ScrollArea>
                
                {/* Gradient fade at bottom for scroll indicator */}
                <div className="absolute bottom-0 w-full h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            </CardContent>
        </Card>
    );
}
