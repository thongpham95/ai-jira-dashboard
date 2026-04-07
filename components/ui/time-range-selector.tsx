"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar, ChevronDown } from "lucide-react";
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

export type TimeRangePreset = "today" | "yesterday" | "week" | "month" | "quarter" | "custom";

export interface TimeRange {
    startDate: string;
    endDate: string;
    preset: TimeRangePreset;
    label: string;
}

interface TimeRangeSelectorProps {
    value: TimeRange;
    onChange: (range: TimeRange) => void;
    language?: "vi" | "en";
    className?: string;
}

const PRESETS = {
    vi: {
        today: "Hôm nay",
        yesterday: "Hôm qua",
        week: "7 ngày qua",
        month: "30 ngày qua",
        quarter: "90 ngày qua",
        custom: "Tùy chỉnh",
    },
    en: {
        today: "Today",
        yesterday: "Yesterday",
        week: "Last 7 days",
        month: "Last 30 days",
        quarter: "Last 90 days",
        custom: "Custom",
    },
};

export function getDefaultTimeRange(preset: TimeRangePreset = "week", language: "vi" | "en" = "en"): TimeRange {
    const today = new Date();
    const labels = PRESETS[language];

    switch (preset) {
        case "today":
            return {
                startDate: format(startOfDay(today), "yyyy-MM-dd"),
                endDate: format(endOfDay(today), "yyyy-MM-dd"),
                preset: "today",
                label: labels.today,
            };
        case "yesterday":
            const yesterday = subDays(today, 1);
            return {
                startDate: format(startOfDay(yesterday), "yyyy-MM-dd"),
                endDate: format(endOfDay(yesterday), "yyyy-MM-dd"),
                preset: "yesterday",
                label: labels.yesterday,
            };
        case "week":
            return {
                startDate: format(subDays(today, 7), "yyyy-MM-dd"),
                endDate: format(today, "yyyy-MM-dd"),
                preset: "week",
                label: labels.week,
            };
        case "month":
            return {
                startDate: format(subDays(today, 30), "yyyy-MM-dd"),
                endDate: format(today, "yyyy-MM-dd"),
                preset: "month",
                label: labels.month,
            };
        case "quarter":
            return {
                startDate: format(subDays(today, 90), "yyyy-MM-dd"),
                endDate: format(today, "yyyy-MM-dd"),
                preset: "quarter",
                label: labels.quarter,
            };
        default:
            return {
                startDate: format(subDays(today, 7), "yyyy-MM-dd"),
                endDate: format(today, "yyyy-MM-dd"),
                preset: "week",
                label: labels.week,
            };
    }
}

export function TimeRangeSelector({
    value,
    onChange,
    language = "en",
    className,
}: TimeRangeSelectorProps) {
    const [open, setOpen] = useState(false);
    const [customStart, setCustomStart] = useState(value.startDate);
    const [customEnd, setCustomEnd] = useState(value.endDate);

    const labels = PRESETS[language];

    const handlePresetClick = (preset: TimeRangePreset) => {
        if (preset === "custom") {
            return;
        }
        const newRange = getDefaultTimeRange(preset, language);
        onChange(newRange);
        setOpen(false);
    };

    const handleCustomApply = () => {
        onChange({
            startDate: customStart,
            endDate: customEnd,
            preset: "custom",
            label: `${customStart} → ${customEnd}`,
        });
        setOpen(false);
    };

    useEffect(() => {
        setCustomStart(value.startDate);
        setCustomEnd(value.endDate);
    }, [value.startDate, value.endDate]);

    const presetButtons: TimeRangePreset[] = ["today", "yesterday", "week", "month", "quarter"];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn("justify-between gap-2 min-w-[180px]", className)}
                >
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{value.label}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="end">
                <div className="space-y-3">
                    {/* Preset Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        {presetButtons.map((preset) => (
                            <Button
                                key={preset}
                                variant={value.preset === preset ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePresetClick(preset)}
                                className="justify-start"
                            >
                                {labels[preset]}
                            </Button>
                        ))}
                    </div>

                    {/* Custom Date Range */}
                    <div className="border-t pt-3">
                        <p className="text-xs text-muted-foreground mb-2">{labels.custom}</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-sm"
                            />
                            <span className="text-muted-foreground text-sm">→</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-sm"
                            />
                        </div>
                        <Button
                            size="sm"
                            onClick={handleCustomApply}
                            className="w-full mt-2"
                            variant={value.preset === "custom" ? "default" : "secondary"}
                        >
                            {language === "vi" ? "Áp dụng" : "Apply"}
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
