"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/language-provider";

export default function ResourcesPage() {
    const { t } = useLanguage();
    const [users, setUsers] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>("");
    const [loading, setLoading] = useState(true);

    // Fetch Projects for Filter
    useEffect(() => {
        fetch('/api/projects')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setProjects(data);
            })
            .catch(err => console.error(err));
    }, []);

    // Fetch Users (Filtered)
    useEffect(() => {
        async function fetchUsers() {
            setLoading(true);
            try {
                let url = '/api/users';
                if (selectedProject && selectedProject !== 'all') {
                    url += `?project=${selectedProject}`;
                } else {
                    // Default query if needed or handle logic
                    url += `?query=%`;
                }

                const res = await fetch(url);
                const data = await res.json();

                if (Array.isArray(data)) {
                    // Deduplicate based on accountId
                    const unique = data.filter((v, i, a) => a.findIndex(v2 => (v2.accountId === v.accountId)) === i);
                    // Filter out apps/bots if possible (usually no email)
                    setUsers(unique.filter((u: any) => u.accountType === 'atlassian'));
                } else {
                    setUsers([]);
                }
            } catch (error) {
                console.error("Failed to fetch resources", error);
            } finally {
                setLoading(false);
            }
        }
        fetchUsers();
    }, [selectedProject]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">{t.resources.title}</h1>
                <div className="w-[300px]">
                    <Select onValueChange={setSelectedProject} value={selectedProject}>
                        <SelectTrigger>
                            <SelectValue placeholder={t.common.filter} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t.resources.allProjects}</SelectItem>
                            {projects.map(p => (
                                <SelectItem key={p.key} value={p.key}>{p.name} ({p.key})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t.resources.description}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t.resources.name}</TableHead>
                                    <TableHead>{t.resources.email}</TableHead>
                                    <TableHead>{t.projects.tasks}</TableHead>
                                    <TableHead>{t.resources.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            {t.resources.noMembers}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.accountId}>
                                            <TableCell className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={user.avatarUrls?.['48x48']} />
                                                    <AvatarFallback>{user.displayName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{user.displayName}</span>
                                            </TableCell>
                                            <TableCell>{user.emailAddress || user.name || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{t.common.viewDetails}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/resources/${user.accountId}?name=${encodeURIComponent(user.displayName || '')}${selectedProject && selectedProject !== 'all' ? `&project=${selectedProject}` : ''}`}>
                                                        {t.common.viewReport}
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

