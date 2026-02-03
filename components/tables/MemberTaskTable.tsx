"use client";

import React, { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Circle,
    HelpCircle,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { Progress } from "@/components/ui/progress";

interface Task {
    key: string;
    fields: {
        summary: string;
        status: { name: string; statusCategory: { colorName: string } };
        priority: { name: string; iconUrl: string };
        issuetype: { name: string; iconUrl: string };
        parent?: { key: string; fields: { summary: string } };
        timespent?: number | null;
        timeoriginalestimate?: number | null;
    }
}
// note: imports need to be at top, I will handle that separately if needed, or put Progress import at usage.
// Actually I can't put import in middle. I'll use multi_replace.


interface MemberTaskTableProps {
    tasks: Task[];
    showTimeSpent?: boolean;
    jiraHost?: string;
}

type SortField = 'priority' | 'type' | 'key' | 'epic' | 'logged';
type SortDirection = 'asc' | 'desc';

function formatHours(seconds: number | null | undefined): string {
    if (!seconds) return '-';
    const hours = seconds / 3600;
    if (hours < 1) return `${Math.round(seconds / 60)}m`;
    return `${hours.toFixed(1)}h`;
}

export function MemberTaskTable({ tasks: initialTasks, showTimeSpent = false, jiraHost }: MemberTaskTableProps) {
    const [tasks, setTasks] = useState(initialTasks);
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Sync internal state when props change (e.g. parent filters tasks)
    React.useEffect(() => {
        setTasks(initialTasks);
        setSortField(null);
        setSortDirection('asc');
    }, [initialTasks]);

    const handleSort = (field: SortField) => {
        let direction: SortDirection = 'asc';
        if (sortField === field && sortDirection === 'asc') {
            direction = 'desc';
        }
        setSortField(field);
        setSortDirection(direction);

        const sorted = [...tasks].sort((a, b) => {
            let valA: any = '';
            let valB: any = '';

            switch (field) {
                case 'key':
                    const idA = parseInt(a.key.split('-')[1] || '0');
                    const idB = parseInt(b.key.split('-')[1] || '0');
                    valA = idA;
                    valB = idB;
                    break;
                case 'priority':
                    valA = a.fields.priority?.name || '';
                    valB = b.fields.priority?.name || '';
                    break;
                case 'type':
                    valA = a.fields.issuetype?.name || '';
                    valB = b.fields.issuetype?.name || '';
                    break;
                case 'epic':
                    valA = a.fields.parent?.key || '';
                    valB = b.fields.parent?.key || '';
                    break;
                case 'logged':
                    valA = a.fields.timespent || 0;
                    valB = b.fields.timespent || 0;
                    break;
            }

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        setTasks(sorted);
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
        return sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
    };

    const colSpan = showTimeSpent ? 7 : 6;

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">
                            <Button variant="ghost" onClick={() => handleSort('key')}>
                                ID <SortIcon field="key" />
                            </Button>
                        </TableHead>
                        <TableHead>
                            <Button variant="ghost" onClick={() => handleSort('type')}>
                                Loại <SortIcon field="type" />
                            </Button>
                        </TableHead>
                        <TableHead className="w-[400px]">Tiêu đề</TableHead>
                        <TableHead>
                            <Button variant="ghost" onClick={() => handleSort('priority')}>
                                Mức độ <SortIcon field="priority" />
                            </Button>
                        </TableHead>
                        <TableHead>Trạng thái</TableHead>
                        {showTimeSpent && (
                            <TableHead>
                                <Button variant="ghost" onClick={() => handleSort('logged')}>
                                    Thời gian <SortIcon field="logged" />
                                </Button>
                            </TableHead>
                        )}
                        <TableHead>
                            <Button variant="ghost" onClick={() => handleSort('epic')}>
                                Epic/Parent <SortIcon field="epic" />
                            </Button>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tasks.map((task) => (
                        <TableRow key={task.key}>
                            <TableCell className="font-medium">
                                {jiraHost ? (
                                    <a
                                        href={`${jiraHost}/browse/${task.key}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                                    >
                                        {task.key}
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                ) : (
                                    task.key
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2" title={task.fields.issuetype?.name}>
                                    <Avatar className="h-5 w-5 bg-transparent">
                                        <AvatarImage src={task.fields.issuetype?.iconUrl} />
                                        <AvatarFallback><HelpCircle className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm text-muted-foreground">{task.fields.issuetype?.name}</span>
                                </div>
                            </TableCell>
                            <TableCell>{task.fields.summary}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2" title={task.fields.priority?.name}>
                                    <Avatar className="h-5 w-5 bg-transparent">
                                        <AvatarImage src={task.fields.priority?.iconUrl} />
                                        <AvatarFallback><Circle className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{task.fields.priority?.name}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className={
                                    task.fields.status?.statusCategory?.colorName === 'blue-gray' ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200' :
                                        task.fields.status?.statusCategory?.colorName === 'yellow' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                            task.fields.status?.statusCategory?.colorName === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''
                                }>
                                    {task.fields.status?.name}
                                </Badge>
                            </TableCell>
                            {showTimeSpent && (
                                <TableCell>
                                    <div className="flex flex-col gap-1 w-24">
                                        <span className={`text-sm font-medium ${task.fields.timespent ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {formatHours(task.fields.timespent)}
                                        </span>
                                        {task.fields.timeoriginalestimate && task.fields.timespent && (
                                            <Progress
                                                value={Math.min(100, (task.fields.timespent / task.fields.timeoriginalestimate) * 100)}
                                                className="h-1"
                                            />
                                        )}
                                    </div>
                                </TableCell>
                            )}
                            <TableCell>
                                {task.fields.parent ? (
                                    <Badge variant="outline" className="text-xs">
                                        {task.fields.parent.key}
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground text-xs">-</span>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                    {tasks.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={colSpan} className="text-center h-24">No tasks found.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
