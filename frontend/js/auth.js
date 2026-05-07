/**
 * Session / auth helper functions.
 * Stores JWT and basic user info in localStorage.
 */

const Auth = {
    save(token, user) {
        localStorage.setItem("cg_token", token);
        localStorage.setItem("cg_user", JSON.stringify(user));
    },

    token() {
        return localStorage.getItem("cg_token");
    },

    user() {
        const raw = localStorage.getItem("cg_user");
        return raw ? JSON.parse(raw) : null;
    },

    isLoggedIn() {
        return !!this.token();
    },

    logout() {
        localStorage.removeItem("cg_token");
        localStorage.removeItem("cg_user");
        window.location.href = "index.html";
    },

    /** Redirect to login if not authenticated. Call on protected pages. */
    requireLogin() {
        if (!this.isLoggedIn()) {
            window.location.href = "index.html";
        }
    }
};
