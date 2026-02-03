
"use client";

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";

interface WorklogEntry {
    id: string;
    date: string;
    issueKey: string;
    issueSummary: string;
    hours: number;
    comment: string;
}

interface WorklogHistoryTableProps {
    worklogs: WorklogEntry[];
    jiraHost?: string;
}

const ITEMS_PER_PAGE = 10;

export function WorklogHistoryTable({ worklogs, jiraHost }: WorklogHistoryTableProps) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(worklogs.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentWorklogs = worklogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(p => p + 1);
    };

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(p => p - 1);
    };

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">Thời gian</TableHead>
                            <TableHead className="w-[120px]">Task ID</TableHead>
                            <TableHead className="w-[300px]">Tiêu đề</TableHead>
                            <TableHead className="text-right w-[100px]">Giờ làm</TableHead>
                            <TableHead>Ghi chú</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentWorklogs.length > 0 ? (
                            currentWorklogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="text-muted-foreground whitespace-nowrap">
                                        {formatDate(log.date)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {jiraHost ? (
                                                <a
                                                    href={`${jiraHost}/browse/${log.issueKey}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                                >
                                                    {log.issueKey} <ExternalLink className="h-3 w-3" />
                                                </a>
                                            ) : (
                                                <span className="font-medium">{log.issueKey}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="truncate max-w-[300px]" title={log.issueSummary}>
                                        {log.issueSummary}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        <Badge variant="secondary">{log.hours}h</Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm truncate max-w-[300px]" title={log.comment}>
                                        {log.comment || "-"}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Không có dữ liệu log work.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Trước
                    </Button>
                    <div className="text-sm font-medium">
                        Trang {currentPage} / {totalPages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                    >
                        Tiếp theo
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
