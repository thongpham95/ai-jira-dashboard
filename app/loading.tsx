import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-[250px]" />
                <Skeleton className="h-9 w-[400px]" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-[120px] rounded-xl" />
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Skeleton className="col-span-1 md:col-span-2 lg:col-span-4 h-[300px] rounded-xl" />
                <Skeleton className="col-span-1 md:col-span-2 lg:col-span-3 h-[300px] rounded-xl" />
            </div>
        </div>
    );
}
