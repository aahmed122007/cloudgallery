/**
 * Shared UI helpers used across all pages.
 */

const UI = {
    toast(message, type = "info") {
        let el = document.querySelector(".toast");
        if (!el) {
            el = document.createElement("div");
            el.className = "toast";
            document.body.appendChild(el);
        }
        el.textContent = message;
        el.className = `toast ${type} show`;
        setTimeout(() => el.classList.remove("show"), 3000);
    },

    initials(name) {
        return (name || "?")
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    },

    formatDate(iso) {
        if (!iso) return "";
        const d = new Date(iso);
        const now = Date.now();
        const diff = (now - d.getTime()) / 1000;
        if (diff < 60) return "just now";
        if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
        return d.toLocaleDateString();
    },

    renderSidebar(active) {
        const user = Auth.user();
        const html = `
            <div class="logo">☁️ CloudGallery</div>
            <a href="dashboard.html" class="nav-item ${active === 'home' ? 'active' : ''}">🏠 Home</a>
            <a href="upload.html" class="nav-item ${active === 'upload' ? 'active' : ''}">⬆️ Upload</a>
            <a href="feed.html" class="nav-item ${active === 'feed' ? 'active' : ''}">📰 Feed</a>
            <a href="profile.html" class="nav-item ${active === 'profile' ? 'active' : ''}">👤 Profile</a>
            <a href="#" class="nav-item" onclick="Auth.logout(); return false;">🚪 Logout</a>
        `;
        document.querySelector(".sidebar").innerHTML = html;
    },

    renderTopbar(title) {
        const user = Auth.user();
        const el = document.querySelector(".topbar");
        if (!el) return;
        el.innerHTML = `
            <h1>${title}</h1>
            <div class="search">
                <input type="text" id="global-search" placeholder="Search by title, description, or tag..." />
            </div>
            <div class="user-chip">
                <div class="avatar">${this.initials(user?.name)}</div>
                <span>${user?.name || ""}</span>
            </div>
        `;
        const input = document.getElementById("global-search");
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && input.value.trim()) {
                window.location.href = `feed.html?q=${encodeURIComponent(input.value.trim())}`;
            }
        });
    },

    mediaCard(media, onClick) {
        const isImage = media.type === "image" || (media.blobUrl || "").match(/\.(jpg|jpeg|png|gif|webp)$/i);
        const card = document.createElement("div");
        card.className = "media-card";
        card.onclick = () => onClick(media);
        card.innerHTML = `
            ${isImage
                ? `<img class="thumb" src="${media.blobUrl}" alt="${media.title}" loading="lazy" onerror="this.style.background='#eee';this.src='';" />`
                : `<video class="thumb" src="${media.blobUrl}" muted></video>`
            }
            <div class="body">
                <div class="title">${this.escape(media.title)}</div>
                <div class="meta">
                    <span>@${this.escape(media.userName || "user")}</span>
                    <span>❤️ ${media.likes || 0}</span>
                </div>
                <div class="tags">
                    ${(media.tags || []).slice(0, 3).map(t => `<span class="tag">${this.escape(t)}</span>`).join("")}
                    ${(media.aiTags || []).slice(0, 2).map(t => `<span class="tag ai-tag">AI: ${this.escape(t)}</span>`).join("")}
                </div>
            </div>
        `;
        return card;
    },

    escape(s) {
        const div = document.createElement("div");
        div.textContent = s == null ? "" : String(s);
        return div.innerHTML;
    },

    showModal(media) {
        const me = Auth.user();
        const liked = (media.likedBy || []).includes(me?.userId);
        const backdrop = document.getElementById("modal-backdrop");
        backdrop.classList.add("show");
        backdrop.innerHTML = `
            <div class="modal">
                <button class="close" onclick="document.getElementById('modal-backdrop').classList.remove('show')">✕</button>
                <img src="${media.blobUrl}" alt="${media.title}" />
                <div class="details">
                    <h2>${this.escape(media.title)}</h2>
                    <div class="author">by @${this.escape(media.userName)} · ${this.formatDate(media.uploadTime)}</div>
                    <p>${this.escape(media.description || "")}</p>
                    <div class="tags" style="margin-top:12px;">
                        ${(media.tags || []).map(t => `<span class="tag">${this.escape(t)}</span>`).join("")}
                        ${(media.aiTags || []).map(t => `<span class="tag ai-tag">AI: ${this.escape(t)}</span>`).join("")}
                    </div>
                    <div class="action-bar">
                        <button class="${liked ? 'liked' : ''}" onclick="handleLike('${media.mediaId}')">
                            ${liked ? '❤️' : '🤍'} ${media.likes || 0}
                        </button>
                        ${media.userId === me?.userId
                            ? `<button onclick="handleDelete('${media.mediaId}')" style="color:var(--danger)">🗑️ Delete</button>`
                            : ""}
                    </div>
                    <div id="comments">
                        ${(media.comments || []).map(c => `
                            <div class="comment">
                                <div class="author">${this.escape(c.user)}</div>
                                <div class="text">${this.escape(c.text)}</div>
                            </div>
                        `).join("")}
                    </div>
                    <div class="form-group" style="margin-top:12px;">
                        <input id="new-comment" placeholder="Add a comment..." />
                    </div>
                    <button class="btn btn-primary" onclick="handleComment('${media.mediaId}')">Post comment</button>
                </div>
            </div>
        `;
    }
};

// Modal action handlers (global so inline onclick works)
async function handleLike(mediaId) {
    try {
        const updated = await API.toggleLike(mediaId);
        UI.showModal(updated);
        document.dispatchEvent(new CustomEvent("media-updated"));
    } catch (err) { UI.toast(err.message, "error"); }
}

async function handleComment(mediaId) {
    const input = document.getElementById("new-comment");
    const text = input?.value.trim();
    if (!text) return;
    try {
        const updated = await API.addComment(mediaId, text);
        UI.showModal(updated);
    } catch (err) { UI.toast(err.message, "error"); }
}

async function handleDelete(mediaId) {
    if (!confirm("Delete this media permanently?")) return;
    try {
        await API.deleteMedia(mediaId);
        document.getElementById("modal-backdrop").classList.remove("show");
        UI.toast("Deleted", "success");
        document.dispatchEvent(new CustomEvent("media-updated"));
    } catch (err) { UI.toast(err.message, "error"); }
}
