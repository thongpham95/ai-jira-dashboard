"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, Copy, Check, Mic } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { motion, AnimatePresence } from "framer-motion";

interface AIStandupGeneratorProps {
    userId: string;
    userName: string;
    projectFilter?: string | null;
}

export function AIStandupGenerator({ userId, userName, projectFilter }: AIStandupGeneratorProps) {
    const { language } = useLanguage();
    const [standup, setStandup] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(true);
    const [copied, setCopied] = useState(false);

    const generateStandup = useCallback(async () => {
        setLoading(true);
        setError(null);
        setStandup(null);

        try {
            const res = await fetch("/api/ai/standup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    userName,
                    projectKey: projectFilter || "all",
                    language,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to generate standup");
            }

            setStandup(data.standup);
            setMetadata(data.metadata);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId, userName, projectFilter, language]);

    const copyToClipboard = async () => {
        if (standup) {
            await navigator.clipboard.writeText(standup);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Simple markdown rendering
    const renderMarkdown = (text: string) => {
        const lines = text.split("\n");
        return lines.map((line, i) => {
            if (line.startsWith("### ")) {
                return <h3 key={i} className="font-semibold text-base mt-4 mb-2">{line.replace("### ", "")}</h3>;
            }
            if (line.startsWith("## ")) {
                return <h2 key={i} className="font-bold text-lg mt-3 mb-2">{line.replace("## ", "")}</h2>;
            }
            if (line.startsWith("- ") || line.startsWith("* ")) {
                const content = line.replace(/^[-*]\s/, "");
                return (
                    <div key={i} className="flex gap-2 ml-2 mb-1">
                        <span className="text-muted-foreground">•</span>
                        <span dangerouslySetInnerHTML={{
                            __html: content
                                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                .replace(/\[(.*?)\]/g, '<code class="bg-muted px-1 rounded text-xs">$1</code>')
                        }} />
                    </div>
                );
            }
            if (line.startsWith("---")) {
                return <hr key={i} className="my-3 border-border" />;
            }
            if (line.trim() === "") return <div key={i} className="h-1" />;
            return <p key={i} className="mb-1 text-sm" dangerouslySetInnerHTML={{
                __html: line
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\[(.*?)\]/g, '<code class="bg-muted px-1 rounded text-xs">$1</code>')
            }} />;
        });
    };

    return (
        <Card className="border-dashed border-primary/20">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                            <Mic className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">
                                {language === "vi" ? "AI Daily Standup" : "AI Daily Standup"}
                            </CardTitle>
                            <CardDescription>
                                {language === "vi"
                                    ? "Tự động sinh báo cáo standup từ worklog 24h"
                                    : "Auto-generate standup report from 24h worklogs"}
                            </CardDescription>
                        </div>
                    </div>
                    {standup && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-3 mb-4">
                    <Button
                        onClick={generateStandup}
                        disabled={loading}
                        className="gap-2"
                        variant="outline"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                {language === "vi" ? "Đang tạo..." : "Generating..."}
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                {language === "vi" ? "Tạo Standup Report" : "Generate Standup"}
                            </>
                        )}
                    </Button>
                    {standup && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={copyToClipboard}
                            className="gap-2 text-muted-foreground"
                        >
                            {copied ? (
                                <>
                                    <Check className="h-3.5 w-3.5 text-green-500" />
                                    {language === "vi" ? "Đã sao chép!" : "Copied!"}
                                </>
                            ) : (
                                <>
                                    <Copy className="h-3.5 w-3.5" />
                                    {language === "vi" ? "Sao chép" : "Copy"}
                                </>
                            )}
                        </Button>
                    )}
                </div>

                {/* Loading skeleton */}
                {loading && (
                    <div className="space-y-3 animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-full" style={{ animationDelay: "0.1s" }} />
                        <div className="h-4 bg-muted rounded w-5/6" style={{ animationDelay: "0.2s" }} />
                        <div className="h-4 bg-muted rounded w-2/3" style={{ animationDelay: "0.3s" }} />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-md text-sm border border-red-200 dark:border-red-800">
                        ⚠️ {error}
                    </div>
                )}

                {/* Standup report */}
                <AnimatePresence>
                    {standup && expanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 rounded-lg p-4 border text-sm overflow-hidden"
                        >
                            {renderMarkdown(standup)}

                            {metadata && (
                                <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground flex items-center gap-4 flex-wrap">
                                    <span>🕐 {new Date(metadata.generatedAt).toLocaleString()}</span>
                                    <span>🤖 {metadata.model}</span>
                                    <span>📊 {metadata.dataPoints?.worklogs || 0} worklogs, {metadata.dataPoints?.statusChanges || 0} transitions</span>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
