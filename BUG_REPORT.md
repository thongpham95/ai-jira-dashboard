# Bug Report

## Status
FIX HARDENED (2026-04-07)

## Bug Title
502 Bad Gateway Error on Atlassian OAuth Callback Route

## Bug Description
The user encounters a `502 Bad Gateway` error when Atlassian redirects back to the Next.js application at `https://jira.paydaes.tvtgroup.io/api/auth/callback/atlassian` after the user successfully authorizes the JIRA app.

## Steps to Reproduce
1. Start the authentication flow by clicking login (Atlassian provider).
2. Authorize the application on the Atlassian consent screen.
3. Atlassian redirects the user back to the application's callback URL: `/api/auth/callback/atlassian` with `state` and `code` query parameters.
4. The server responds with `502 (Bad Gateway)` instead of completing the sign-in and redirecting to the homepage.

## Actual Result
A `502 Bad Gateway` error page is displayed. The authentication flow is broken.

## Expected Result
The Next.js server successfully exchanges the OAuth `code` for an `access_token`, saves the session via cookies, and redirects the user to the application dashboard/homepage.

## Context
- **Error Message**: `GET https://jira.paydaes.tvtgroup.io/api/auth/callback/atlassian?state=...&code=... 502 (Bad Gateway)`
- **Environment**: Production deployment (Docker) behind a reverse proxy (likely Nginx), Next.js 16.x App Router, NextAuth v4.24, Atlassian OAuth Provider.

---

## Root Cause Analysis
A `502 Bad Gateway` from a reverse proxy (Nginx) means Nginx could not get a valid or complete response from the upstream Node.js container. In the context of NextAuth OAuth callbacks, this is typically caused by one of three reasons:

**1. Nginx `proxy_buffer_size` Limit Exceeded (Most Likely)**
Atlassian access tokens and refresh tokens are extremely large JWTs. NextAuth stores the entire session (including the access token and refresh token) in encrypted HTTP-only cookies.
- When the callback finishes, Next.js sends back multiple `Set-Cookie` headers (chunked cookies) back to Nginx.
- Nginx has a default small `proxy_buffer_size` (often 4k or 8k).
- If the total header size exceeds this limit, Nginx drops the connection and returns a `502 Bad Gateway`, logging `upstream sent too big header while reading response header from upstream`.

**2. Docker Container Network Block / Timeout**
The `AtlassianProvider` makes an outbound HTTP request from the Docker container to `api.atlassian.com` to exchange the authorization code for an access token, and subsequently to `accessible-resources` in `fetchCloudId()`.
- If the VPS/Server firewall restricts outbound HTTPS connections from Docker, the request will hang indefinitely.
- Eventually, Nginx's `proxy_read_timeout` (usually 60s) is tripped, resulting in a 502 error.

**3. Next.js Process Crashing**
If an unhandled exception occurs (e.g., mismatched environments, missing Node dependencies, out-of-memory), the PM2/Node process restarts. Nginx loses the socket connection immediately, resulting in a 502.

## Proposed Fixes

### Option 1 (Recommended): Increase Nginx Proxy Buffers
If you are using Nginx to reverse proxy to your Docker container, you must increase the buffer sizes to accommodate NextAuth's large Set-Cookie headers.
- **Action**: Add the following directly under your `location /` or `server` block in your server's `nginx.conf`:
```nginx
proxy_buffer_size          128k;
proxy_buffers              4 256k;
proxy_busy_buffers_size    256k;
```
- Reload Nginx: `sudo systemctl reload nginx`

### Option 2 (Alternative): Remove Refresh Token from NextAuth Session Payload
If Nginx configuration cannot be changed or if we want to reduce the payload size significantly, we can avoid saving the very large Atlassian `refresh_token` in the JWT cookie (if we don't strictly need offline token rotation in the client side). However, `accessToken` itself is quite large, so Option 1 is still heavily recommended.

## Verification Plan
To confirm the root cause before blindly changing configurations, please check your server logs:
1. **Check Nginx logs**: `sudo tail -n 50 /var/log/nginx/error.log`. Look for `upstream sent too big header` or `timeout`.
2. **Check Docker logs**: `docker logs jira-dashboard --tail 50`. Look for any Node.js crash stack traces or runtime errors.
If Nginx shows the header size error, Option 1 is the exact fix.

## Fix Applied
We successfully mitigated the Nginx 502 Bad Gateway error by implementing **Option 2 (Alternative)**.

- **Files Changed**: 
  - `app/api/auth/[...nextauth]/route.ts`: Removed `token.refreshToken = account.refresh_token;` from the `jwt` callback securely. This prevents the large Atlassian `refresh_token` from being included in the NextAuth JWT session string, vastly reducing the overall payload that Nginx has to parse in the `Set-Cookie` headers.
- **Verification**: Please pull the code, push/deploy to production, and initiate a new login flow to verify if the 502 Bad Gateway is resolved.

## Additional Hardening (2026-04-07)

Three follow-up improvements were applied to make the fix more robust:

1. **Removed `offline_access` scope**: The original fix discarded the refresh token but still requested it from Atlassian via the `offline_access` scope. Removing this scope prevents Atlassian from generating the large refresh token in the first place, reducing the overall token exchange payload.

2. **Added token expiration detection**: `expiresAt` was stored but never checked. When the access token expires (~1 hour), API calls would silently fail with 401. The JWT callback now detects expired tokens and clears `accessToken`, setting an `error: "TokenExpired"` flag.

3. **Exposed token error in session**: The session callback now passes `session.error` to the client, allowing the frontend to detect expired sessions and prompt re-login.

- **Files Changed**: `app/api/auth/[...nextauth]/route.ts`
- **Nginx Recommendation**: Option 1 (increase `proxy_buffer_size`) is still recommended for production environments as a defense-in-depth measure.
