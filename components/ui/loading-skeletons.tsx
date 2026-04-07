"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Skeleton for StatCard component
 */
export function StatCardSkeleton() {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-md" />
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Skeleton for multiple StatCards in a grid
 */
export function StatCardsGridSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <StatCardSkeleton key={i} />
            ))}
        </div>
    );
}

/**
 * Skeleton for chart components
 */
export function ChartSkeleton({ height = 300 }: { height?: number }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-60 mt-1" />
            </CardHeader>
            <CardContent>
                <Skeleton className="w-full" style={{ height }} />
            </CardContent>
        </Card>
    );
}

/**
 * Skeleton for table rows
 */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
    return (
        <tr className="border-b">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="p-3">
                    <Skeleton className="h-4 w-full" />
                </td>
            ))}
        </tr>
    );
}

/**
 * Skeleton for full table
 */
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                {Array.from({ length: columns }).map((_, i) => (
                                    <th key={i} className="p-3 text-left">
                                        <Skeleton className="h-4 w-20" />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: rows }).map((_, i) => (
                                <TableRowSkeleton key={i} columns={columns} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Skeleton for list items (e.g., task lists)
 */
export function ListItemSkeleton() {
    return (
        <div className="flex items-center gap-3 p-3 border-b">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
        </div>
    );
}

/**
 * Skeleton for list
 */
export function ListSkeleton({ items = 5 }: { items?: number }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="p-0">
                {Array.from({ length: items }).map((_, i) => (
                    <ListItemSkeleton key={i} />
                ))}
            </CardContent>
        </Card>
    );
}

/**
 * Skeleton for AI-generated content
 */
export function AIContentSkeleton() {
    return (
        <Card className="border-dashed">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-10 w-36 mb-4" />
                <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Full dashboard skeleton
 */
export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-48" />
                <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-[180px]" />
                    <Skeleton className="h-9 w-[180px]" />
                    <Skeleton className="h-9 w-[100px]" />
                </div>
            </div>

            {/* Stat cards */}
            <StatCardsGridSkeleton count={4} />

            {/* AI Summary */}
            <AIContentSkeleton />

            {/* Charts grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-1 md:col-span-2 lg:col-span-4">
                    <ChartSkeleton height={400} />
                </div>
                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                    <ListSkeleton items={6} />
                </div>
            </div>

            {/* Workload chart */}
            <ChartSkeleton height={300} />
        </div>
    );
}
