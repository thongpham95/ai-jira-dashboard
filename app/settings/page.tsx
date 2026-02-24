"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Moon, Sun, Globe } from "lucide-react";
import { useTheme } from "next-themes";
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

    return (
        <div className="space-y-6 max-w-4xl">
            <h1 className="text-3xl font-bold tracking-tight">{t.settings.title}</h1>

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
