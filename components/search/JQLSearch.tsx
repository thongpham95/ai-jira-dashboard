"use client";

import * as React from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface JQLSearchProps {
    onSearch: (jql: string) => void;
    isLoading?: boolean;
    initialQuery?: string;
}

export function JQLSearch({ onSearch, isLoading, initialQuery }: JQLSearchProps) {
    const [query, setQuery] = React.useState(initialQuery || "");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
        }
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Enter JQL query (e.g. project = 'DEMO' AND status = 'In Progress')"
                        className="pl-8 w-full font-mono text-sm"
                    />
                </div>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Search
                </Button>
            </form>
            <div className="mt-1 text-xs text-muted-foreground">
                Hint: Use JQL syntax. Try <code>order by created DESC</code>
            </div>
        </div>
    );
}
