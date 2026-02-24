"use client";

import * as React from "react";
import { Moon, Sun, Search, Globe, Sparkles, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/language-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
    const { setTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [searchQuery, setSearchQuery] = React.useState("");
    const [aiMode, setAiMode] = React.useState(false);
    const [aiLoading, setAiLoading] = React.useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        if (aiMode) {
            // AI mode: convert natural language to JQL
            setAiLoading(true);
            try {
                const res = await fetch("/api/ai/jql", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        query: searchQuery.trim(),
                        language,
                    }),
                });
                const data = await res.json();
                if (data.jql) {
                    router.push(`/search?query=${encodeURIComponent(data.jql)}&ai=1&original=${encodeURIComponent(searchQuery.trim())}`);
                } else {
                    router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
                }
            } catch {
                router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
            } finally {
                setAiLoading(false);
            }
        } else {
            router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const aiTooltip = aiMode
        ? (language === "vi" ? "Tắt AI Search — Quay lại JQL" : "Disable AI Search — Back to JQL")
        : (language === "vi" ? "Bật AI Search — Tìm kiếm bằng tiếng Việt" : "Enable AI Search — Search in natural language");

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-4 border-b bg-background px-6 shadow-sm">
            <div className="flex flex-1 items-center gap-4">
                <form onSubmit={handleSearch} className="relative w-full max-w-lg flex items-center gap-2">
                    <div className="relative flex-1">
                        {aiLoading ? (
                            <Loader2 className="absolute left-2.5 top-2.5 h-4 w-4 text-primary animate-spin" />
                        ) : aiMode ? (
                            <Sparkles className="absolute left-2.5 top-2.5 h-4 w-4 text-primary" />
                        ) : (
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        )}
                        <Input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={aiMode
                                ? (language === "vi" ? "Mô tả bằng tiếng Việt... VD: tìm bug critical tuần này" : "Describe in English... e.g. find critical bugs this week")
                                : t.header.searchPlaceholder}
                            className={`w-full pl-8 md:w-[300px] lg:w-[400px] ${aiMode ? 'border-primary/50 bg-primary/5' : 'bg-background'}`}
                            disabled={aiLoading}
                        />
                    </div>
                    <Button
                        type="button"
                        variant={aiMode ? "default" : "outline"}
                        size="icon"
                        className={`shrink-0 h-9 w-9 ${aiMode ? 'bg-primary text-primary-foreground' : ''}`}
                        onClick={() => setAiMode(!aiMode)}
                        title={aiTooltip}
                    >
                        <Sparkles className="h-4 w-4" />
                    </Button>
                </form>
            </div>
            <div className="flex items-center gap-2">
                {/* Language Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Globe className="h-[1.2rem] w-[1.2rem]" />
                            <span className="sr-only">{t.header.language}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() => setLanguage("vi")}
                            className={language === "vi" ? "bg-accent" : ""}
                        >
                            🇻🇳 Tiếng Việt
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setLanguage("en")}
                            className={language === "en" ? "bg-accent" : ""}
                        >
                            🇺🇸 English
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Theme Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">{t.header.toggleTheme}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                            {t.header.light}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                            {t.header.dark}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")}>
                            {t.header.system}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                {status === "authenticated" && session?.user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                                    <AvatarFallback>{session.user.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{session.user.name}</DropdownMenuLabel>
                            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{session.user.email}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => signOut()}>
                                {t.header.logout}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Button onClick={() => signIn("atlassian")}>{t.header.loginWithJira}</Button>
                )}
            </div>
        </header>
    );
}
