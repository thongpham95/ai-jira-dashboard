"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, RefreshCw, Moon, Sun, Globe } from "lucide-react";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/language-provider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const checkConnection = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings/status');
            const data = await res.json();
            setStatus(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkConnection();
    }, []);

    return (
        <div className="space-y-6 max-w-4xl">
            <h1 className="text-3xl font-bold tracking-tight">{t.settings.title}</h1>

            {/* Connection Status */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle>{t.settings.jiraConnection}</CardTitle>
                            <CardDescription>{t.settings.connectionStatus}</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={checkConnection} disabled={loading}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            {t.settings.checkConnection}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading ? <Skeleton className="h-20 w-full" /> : (
                        <div className={`flex items-center gap-4 p-4 rounded-lg border ${status?.connected ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900'}`}>
                            {status?.connected ? (
                                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                            ) : (
                                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            )}
                            <div>
                                <h4 className="font-semibold text-sm">{status?.connected ? t.settings.connected : t.settings.disconnected}</h4>
                                <p className="text-sm text-muted-foreground">{status?.message}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>{t.settings.jiraHost}</Label>
                            <Input value={status?.host || ''} disabled readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>{t.settings.email}</Label>
                            <Input value={status?.email || ''} disabled readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>{t.settings.apiToken}</Label>
                            <Input value="********************************" disabled readOnly className="bg-muted" />
                            <p className="text-xs text-muted-foreground mt-1">
                                {t.settings.credentialsNote} <code className="bg-muted px-1 rounded">.env.local</code> {t.settings.restartNote}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Separator />

            {/* Language Settings */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        <div className="space-y-1">
                            <CardTitle>{t.settings.language}</CardTitle>
                            <CardDescription>{t.settings.languageDesc}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Select value={language} onValueChange={(value) => setLanguage(value as 'vi' | 'en')}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="vi">
                                    <span className="flex items-center gap-2">
                                        🇻🇳 {t.settings.vietnamese}
                                    </span>
                                </SelectItem>
                                <SelectItem value="en">
                                    <span className="flex items-center gap-2">
                                        🇺🇸 {t.settings.english}
                                    </span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Separator />

            {/* Appearance */}
            <Card>
                <CardHeader>
                    <CardTitle>{t.settings.appearance}</CardTitle>
                    <CardDescription>{t.settings.appearanceDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Button
                            variant={theme === 'light' ? 'default' : 'outline'}
                            onClick={() => setTheme('light')}
                            className="w-[150px]"
                        >
                            <Sun className="mr-2 h-4 w-4" /> {t.settings.light}
                        </Button>
                        <Button
                            variant={theme === 'dark' ? 'default' : 'outline'}
                            onClick={() => setTheme('dark')}
                            className="w-[150px]"
                        >
                            <Moon className="mr-2 h-4 w-4" /> {t.settings.dark}
                        </Button>
                        <Button
                            variant={theme === 'system' ? 'default' : 'outline'}
                            onClick={() => setTheme('system')}
                            className="w-[150px]"
                        >
                            {t.settings.system}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

