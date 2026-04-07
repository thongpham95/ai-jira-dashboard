import NextAuth, { NextAuthOptions } from "next-auth";
import AtlassianProvider from "next-auth/providers/atlassian";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    providers: [
        AtlassianProvider({
            clientId: process.env.ATLASSIAN_CLIENT_ID!,
            clientSecret: process.env.ATLASSIAN_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: "read:jira-work read:jira-user read:me",
                },
            },
        }),
        // Dev Mode Login to bypass OAuth if needed
        ...(process.env.NODE_ENV === "development" ? [
            CredentialsProvider({
                name: "Dev Mode",
                credentials: {
                    username: { label: "Username", type: "text", placeholder: "admin" },
                    role: { label: "Role", type: "text", placeholder: "admin OR user" }
                },
                async authorize(credentials) {
                    const user = {
                        id: credentials?.role === "admin" ? "admin-id" : "user-id",
                        name: credentials?.role === "admin" ? "Admin User" : "Dev Member",
                        email: credentials?.role === "admin" ? "admin@example.com" : "member@example.com",
                        image: "https://github.com/shadcn.png"
                    };
                    return user;
                }
            })
        ] : []),
    ],
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;
                token.expiresAt = account.expires_at;
                token.cloudId = await fetchCloudId(account.access_token!);
            }
            // Force re-authentication when access token has expired
            if (token.expiresAt && Date.now() >= (token.expiresAt as number) * 1000) {
                return { ...token, accessToken: undefined, error: "TokenExpired" };
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                // @ts-ignore
                session.user.id = token.sub;
                // @ts-ignore
                session.accessToken = token.accessToken;
                // @ts-ignore
                session.cloudId = token.cloudId;
            }
            // @ts-ignore - expose token error so client can detect expired sessions
            if (token.error) session.error = token.error;
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/", // Redirect to home to trigger sign-in modal if needed, or use default
    },
};

// Helper to get the cloud ID (Site ID) for the user
// This is critical for Atlassian API calls as endpoints often require /ex/jira/{cloudId}/...
// However, jira-client usually handles host URLs.
// If we use the OAuth token, we might need to query the accessible resources to find the Cloud ID
// matching the configured JIRA_HOST's domain, OR just pick the first one.
async function fetchCloudId(accessToken: string) {
    try {
        const res = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/json",
            },
        });

        if (!res.ok) return null;

        const resources = await res.json();
        // For simplicity, we'll confirm against the configured host if possible,
        // or return the first Jira resource.
        // In a real multi-tenant app, we'd let the user choose.
        // Here we'll return the first one that has scopes.
        if (Array.isArray(resources) && resources.length > 0) {
            return resources[0].id;
        }
        return null;
    } catch (error) {
        console.error("Error fetching accessible resources:", error);
        return null;
    }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
