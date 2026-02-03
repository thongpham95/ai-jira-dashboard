import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Info, LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: LucideIcon;
    className?: string;
    trend?: {
        value: number;
        label: string;
        positive?: boolean;
    };
    infoText?: string;
}

export function StatCard({ title, value, description, icon: Icon, className, trend, infoText }: StatCardProps) {
    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {title}
                    {infoText && (
                        <span title={infoText} className="cursor-help">
                            <Info className="h-3 w-3 text-muted-foreground/70" />
                        </span>
                    )}
                </CardTitle>
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {(description || trend) && (
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                        {trend && (
                            <span className={cn("mr-2 font-medium", trend.positive ? "text-green-500" : "text-red-500")}>
                                {trend.positive ? "+" : ""}{trend.value}%
                            </span>
                        )}
                        {description}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
