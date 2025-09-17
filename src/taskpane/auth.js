
export async function authorizedFetch(url, options = {}) {
    const token = await OfficeRuntime.auth.getAccessToken({ allowSignInPrompt: true, allowConsentPrompt: true });
    const headers = new Headers(options.headers || {});

    headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");

    let resp = await fetch(url, { ...options, headers });

    if (resp.status === 401) {
        const newToken = await getAuthToken();
        headers.set("Authorization", `Bearer ${newToken}`);
        resp = await fetch(url, { ...options, headers });
    }

    return resp;
}

export function clearAuthTokenCache() {
    cachedToken = null;
    tokenExpiresAt = 0;
}
