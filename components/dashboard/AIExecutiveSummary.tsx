"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, RefreshCw, AlertTriangle, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { motion, AnimatePresence } from "framer-motion";

interface AIExecutiveSummaryProps {
    projectKey: string;
    projectName?: string;
}

export function AIExecutiveSummary({ projectKey, projectName }: AIExecutiveSummaryProps) {
    const { t, language } = useLanguage();
    const [summary, setSummary] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [model, setModel] = useState<string>("gemini-2.5-flash");
    const [expanded, setExpanded] = useState(true);

    const generateSummary = useCallback(async () => {
        if (!projectKey || projectKey === "all") {
            setError(language === "vi"
                ? "Vui lòng chọn một dự án cụ thể để tạo báo cáo AI."
                : "Please select a specific project to generate AI report.");
            return;
        }

        setLoading(true);
        setError(null);
        setSummary(null);

        try {
            const res = await fetch("/api/ai/summary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectKey,
                    model,
                    language,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to generate summary");
            }

            setSummary(data.summary);
            setMetadata(data.metadata);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [projectKey, model, language]);

    // Simple markdown renderer
    const renderMarkdown = (text: string) => {
        const lines = text.split("\n");
        return lines.map((line, i) => {
            // Headers
            if (line.startsWith("### ")) {
                return (
                    <h3 key={i} className="text-lg font-semibold mt-5 mb-2 flex items-center gap-2 text-foreground">
                        {line.replace("### ", "")}
                    </h3>
                );
            }
            if (line.startsWith("## ")) {
                return (
                    <h2 key={i} className="text-xl font-bold mt-6 mb-3 text-foreground">
                        {line.replace("## ", "")}
                    </h2>
                );
            }
            // Bold
            if (line.startsWith("- **")) {
                const parts = line.replace("- **", "").split("**");
                return (
                    <div key={i} className="flex items-start gap-2 py-1 pl-2">
                        <span className="text-primary mt-1.5 text-xs">●</span>
                        <p className="text-sm text-muted-foreground">
                            <strong className="text-foreground">{parts[0]}</strong>
                            {parts.slice(1).join("")}
                        </p>
                    </div>
                );
            }
            // List items
            if (line.startsWith("- ")) {
                return (
                    <div key={i} className="flex items-start gap-2 py-1 pl-2">
                        <span className="text-primary mt-1.5 text-xs">●</span>
                        <p className="text-sm text-muted-foreground">{line.replace("- ", "")}</p>
                    </div>
                );
            }
            // Numbered items
            if (/^\d+\.\s/.test(line)) {
                return (
                    <div key={i} className="flex items-start gap-2 py-1 pl-2">
                        <span className="text-primary font-semibold text-sm min-w-[1.25rem]">
                            {line.match(/^(\d+)\./)?.[1]}.
                        </span>
                        <p className="text-sm text-muted-foreground">
                            {line.replace(/^\d+\.\s/, "")}
                        </p>
                    </div>
                );
            }
            // Separators
            if (line.startsWith("---")) {
                return <hr key={i} className="my-4 border-border" />;
            }
            // Empty lines
            if (line.trim() === "") {
                return <div key={i} className="h-2" />;
            }
            // Regular text
            return (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                    {line}
                </p>
            );
        });
    };

    return (
        <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">
                                {language === "vi" ? "AI Executive Summary" : "AI Executive Summary"}
                            </CardTitle>
                            <CardDescription>
                                {language === "vi"
                                    ? `Phân tích tổng quan dự án bằng Google Gemini`
                                    : `AI-powered project analysis using Google Gemini`}
                            </CardDescription>
                        </div>
                    </div>
                    {summary && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {/* Controls */}
                <div className="flex items-center gap-3 mb-4">
                    <Select value={model} onValueChange={setModel}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="gemini-2.5-flash">
                                ⚡ Gemini 2.5 Flash
                            </SelectItem>
                            <SelectItem value="gemini-2.5-pro">
                                🧠 Gemini 2.5 Pro
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        onClick={generateSummary}
                        disabled={loading || !projectKey || projectKey === "all"}
                        className="gap-2"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                {language === "vi" ? "Đang phân tích..." : "Analyzing..."}
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                {language === "vi" ? "Tạo báo cáo AI" : "Generate AI Report"}
                            </>
                        )}
                    </Button>

                    {!projectKey || projectKey === "all" ? (
                        <span className="text-xs text-muted-foreground">
                            {language === "vi"
                                ? "← Chọn dự án cụ thể"
                                : "← Select a specific project"}
                        </span>
                    ) : null}
                </div>

                {/* Loading Animation */}
                <AnimatePresence>
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 py-4"
                        >
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <div className="relative">
                                    <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium text-foreground">
                                        {language === "vi" ? "Đang thu thập dữ liệu Jira..." : "Collecting Jira data..."}
                                    </p>
                                    <p className="text-xs">
                                        {language === "vi"
                                            ? "Epics, Bugs, Workload, Overdue Tasks → Gemini AI"
                                            : "Epics, Bugs, Workload, Overdue Tasks → Gemini AI"}
                                    </p>
                                </div>
                            </div>
                            {/* Skeleton lines */}
                            {[...Array(4)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-3 rounded bg-muted animate-pulse"
                                    style={{ width: `${80 - i * 12}%`, animationDelay: `${i * 150}ms` }}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20"
                    >
                        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-destructive">
                                {language === "vi" ? "Lỗi" : "Error"}
                            </p>
                            <p className="text-sm text-destructive/80 mt-1">{error}</p>
                        </div>
                    </motion.div>
                )}

                {/* Summary Result */}
                <AnimatePresence>
                    {summary && expanded && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="prose prose-sm dark:prose-invert max-w-none mt-2"
                        >
                            <div className="p-4 rounded-lg bg-card border">
                                {renderMarkdown(summary)}
                            </div>
                            {/* Metadata footer */}
                            {metadata && (
                                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(metadata.generatedAt).toLocaleString()}
                                    </span>
                                    <span>Model: {metadata.model}</span>
                                    <span>
                                        {metadata.dataPoints.epics} Epics ·{" "}
                                        {metadata.dataPoints.criticalBugs} Bugs ·{" "}
                                        {metadata.dataPoints.overdueTasks} Overdue ·{" "}
                                        {metadata.dataPoints.teamMembers} Members
                                    </span>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
