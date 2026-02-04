import { NextResponse } from 'next/server';
import { getMyPermissions } from '@/lib/jira';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const projectKey = searchParams.get('projectKey') || undefined;

        const session = await getServerSession(authOptions);
        // @ts-ignore
        const accessToken = session?.accessToken;
        // @ts-ignore
        const cloudId = session?.cloudId;
        // @ts-ignore
        const userId = session?.user?.id;

        // Mock Permissions for Dev Mode
        if (userId === "user-id") {
            return NextResponse.json({
                permissions: {
                    ADMINISTER_PROJECTS: { havePermission: false },
                    BROWSE_PROJECTS: { havePermission: true }
                }
            });
        }
        if (userId === "admin-id") {
            return NextResponse.json({
                permissions: {
                    ADMINISTER_PROJECTS: { havePermission: true },
                    BROWSE_PROJECTS: { havePermission: true }
                }
            });
        }

        const permissions = await getMyPermissions({
            accessToken,
            cloudId,
            projectKey
        });

        return NextResponse.json(permissions);
    } catch (error: any) {
        console.error("Error fetching permissions:", error);
        return NextResponse.json({ error: error.message || 'Failed to fetch permissions' }, { status: 500 });
    }
}
