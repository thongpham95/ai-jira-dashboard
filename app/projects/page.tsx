"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/language-provider";

export default function ProjectsPage() {
    const { t } = useLanguage();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchProjects() {
            try {
                const res = await fetch('/api/projects');
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                if (Array.isArray(data)) {
                    setProjects(data);
                }
            } catch (e) {
                setError(t.dashboard.loadError);
            } finally {
                setLoading(false);
            }
        }
        fetchProjects();
    }, [t.dashboard.loadError]);

    if (loading) {
        return <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-[150px] w-full" />)}</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">{t.projects.title} ({projects.length})</h1>
            </div>

            {error ? <div className="text-red-500">{error}</div> : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <Card key={project.id} className="hover:bg-muted/50 transition-colors">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10 bg-muted border">
                                        <AvatarImage src={project.avatarUrls?.['48x48']} alt={project.name} />
                                        <AvatarFallback>{project.key.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Link href={`/projects/${project.id}`} className="hover:underline">
                                                <CardTitle className="text-base">{project.name}</CardTitle>
                                            </Link>
                                            <Badge variant="outline" className="text-xs">{project.key}</Badge>
                                        </div>
                                        <CardDescription className="text-xs">ID: {project.id}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between mt-2">
                                    <Button variant="ghost" size="sm" asChild className="w-full">
                                        <Link href={`/projects/${project.id}`}>{t.common.viewDetails}</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

