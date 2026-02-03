"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { MemberTaskTable } from "@/components/tables/MemberTaskTable";
import { Skeleton } from "@/components/ui/skeleton";
import { JQLSearch } from "@/components/search/JQLSearch";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";

function SearchResultsContent() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get("query") || "";
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [jiraHost, setJiraHost] = useState<string>("");

    useEffect(() => {
        fetch('/api/settings/jira-host').then(r => r.json()).then(d => setJiraHost(d.host || '')).catch(() => { });
    }, []);

    useEffect(() => {
        async function fetchResults() {
            if (!query) return;
            setLoading(true);
            setError("");
            try {
                const res = await fetch('/api/issues', {
                    method: 'POST',
                    body: JSON.stringify({
                        jql: query,
                        maxResults: 50,
                        fields: ['summary', 'status', 'priority', 'issuetype', 'parent', 'updated', 'assignee', 'reporter', 'created']
                    })
                });
                const data = await res.json();
                if (data.error) {
                    setError(data.error);
                } else if (data.issues) {
                    setTasks(data.issues);
                }
            } catch (e) {
                setError(t.dashboard.loadError);
            } finally {
                setLoading(false);
            }
        }
        fetchResults();
    }, [query, t.dashboard.loadError]);

    const handleSearch = (newQuery: string) => {
        router.push(`/search?query=${encodeURIComponent(newQuery)}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">{t.search.results}</h1>
                <div className="w-[500px]">
                    <JQLSearch onSearch={handleSearch} isLoading={loading} initialQuery={query} />
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-md border border-red-200 dark:border-red-900">
                    {t.common.error}: {error}
                </div>
            )}

            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
            ) : (
                <>
                    {query && <p className="text-muted-foreground">{t.search.results} JQL: <code className="bg-muted px-1 rounded">{query}</code></p>}
                    {tasks.length === 0 && query && (
                        <p className="text-muted-foreground text-center py-8">{t.search.noResults}</p>
                    )}
                    <MemberTaskTable tasks={tasks} jiraHost={jiraHost} />
                </>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
            <SearchResultsContent />
        </Suspense>
    );
}

