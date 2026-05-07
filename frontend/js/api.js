/**
 * Thin REST client for the CloudGallery API.
 * All methods return parsed JSON or throw on error.
 */

const API = (() => {
    const base = () => window.CG_CONFIG.API_BASE.replace(/\/$/, "");

    function token() {
        return localStorage.getItem("cg_token");
    }

    function authHeaders() {
        const t = token();
        return t ? { Authorization: `Bearer ${t}` } : {};
    }

    async function request(path, options = {}) {
        const url = `${base()}${path}`;
        const res = await fetch(url, {
            ...options,
            headers: {
                ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
                ...authHeaders(),
                ...(options.headers || {})
            }
        });
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
        return data;
    }

    return {
        // ---- Auth ----
        register: (name, email, password) =>
            request("/users/register", {
                method: "POST",
                body: JSON.stringify({ name, email, password })
            }),

        login: (email, password) =>
            request("/users/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            }),

        // ---- Users ----
        getUser: (id) => request(`/users/${id}`),
        updateUser: (id, data) =>
            request(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
        deleteUser: (id) => request(`/users/${id}`, { method: "DELETE" }),

        // ---- Media ----
        listMedia: (userId = null, limit = 50) => {
            const q = new URLSearchParams();
            if (userId) q.set("userId", userId);
            q.set("limit", limit);
            return request(`/media?${q}`);
        },
        getMedia: (id) => request(`/media/${id}`),
        uploadMedia: (file, title, description, tags) => {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("title", title);
            fd.append("description", description || "");
            fd.append("tags", tags || "");
            return request("/media", { method: "POST", body: fd });
        },
        updateMedia: (id, data) =>
            request(`/media/${id}`, { method: "PUT", body: JSON.stringify(data) }),
        deleteMedia: (id) => request(`/media/${id}`, { method: "DELETE" }),
        toggleLike: (id) =>
            request(`/media/${id}`, { method: "PUT", body: JSON.stringify({ action: "toggleLike" }) }),
        addComment: (id, comment) =>
            request(`/media/${id}`, {
                method: "PUT",
                body: JSON.stringify({ action: "addComment", comment })
            }),
        searchMedia: ({ tag, q }) => {
            const qs = new URLSearchParams();
            if (tag) qs.set("tag", tag);
            if (q) qs.set("q", q);
            return request(`/media/search/by-tag?${qs}`);
        }
    };
})();
