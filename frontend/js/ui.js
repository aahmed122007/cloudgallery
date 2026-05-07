const UI = {
    toast(message, type = "info") {
        let el = document.querySelector(".toast");
        if (!el) {
            el = document.createElement("div");
            el.className = "toast";
            document.body.appendChild(el);
        }
        const icons = { success: "✓", error: "✕", info: "ℹ" };
        el.innerHTML = `<span>${icons[type] || "ℹ"}</span> ${this.escape(message)}`;
        el.className = `toast ${type} show`;
        clearTimeout(el._t);
        el._t = setTimeout(() => el.classList.remove("show"), 3500);
    },

    initials(name) {
        return (name || "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    },

    formatDate(iso) {
        if (!iso) return "";
        const d = new Date(iso);
        const diff = (Date.now() - d.getTime()) / 1000;
        if (diff < 60) return "just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    },

    renderSidebar(active) {
        const user = Auth.user();
        const nav = [
            { id: "home",    href: "dashboard.html", icon: "🏠", label: "Dashboard" },
            { id: "feed",    href: "feed.html",      icon: "🌐", label: "Explore" },
            { id: "upload",  href: "upload.html",    icon: "⬆️",  label: "Upload" },
            { id: "profile", href: "profile.html",   icon: "👤", label: "Profile" },
        ];
        const navHtml = nav.map(n => `
            <a href="${n.href}" class="nav-item ${active === n.id ? "active" : ""}">
                <span class="nav-icon">${n.icon}</span> ${n.label}
            </a>
        `).join("");

        const sidebar = document.getElementById("sidebar") || document.querySelector(".sidebar");
        if (!sidebar) return;
        sidebar.innerHTML = `
            <div class="logo">
                <div class="logo-icon">☁️</div>
                CloudGallery
            </div>
            <div class="nav-section">
                <div class="nav-label">Menu</div>
                ${navHtml}
            </div>
            <div class="sidebar-footer">
                <div class="sidebar-user" onclick="Auth.logout()">
                    <div class="avatar-sm">${this.initials(user?.name)}</div>
                    <div class="user-info">
                        <div class="user-name">${this.escape(user?.name || "")}</div>
                        <div class="user-role">Sign out</div>
                    </div>
                </div>
            </div>
        `;
    },

    renderTopbar(title, subtitle) {
        const slot = document.getElementById("topbar-slot");
        if (!slot) return;
        slot.innerHTML = `
            <div class="topbar">
                <div class="topbar-left">
                    <h1>${title}</h1>
                    ${subtitle ? `<p>${subtitle}</p>` : ""}
                </div>
                <div class="search-box">
                    <span class="search-icon">🔍</span>
                    <input type="text" id="global-search" placeholder="Search photos, tags..." />
                </div>
                <div class="topbar-right">
                    <a href="upload.html" class="upload-btn">⬆️ Upload</a>
                </div>
            </div>
        `;
        const input = document.getElementById("global-search");
        if (input) {
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && input.value.trim()) {
                    window.location.href = `feed.html?q=${encodeURIComponent(input.value.trim())}`;
                }
            });
        }
    },

    mediaCard(media, onClick) {
        const isImage = media.type === "image" || (media.blobUrl || "").match(/\.(jpg|jpeg|png|gif|webp)$/i);
        const card = document.createElement("div");
        card.className = "media-card";
        card.onclick = () => onClick(media);
        const allTags = [
            ...(media.tags || []).slice(0, 2).map(t => `<span class="tag">${this.escape(t)}</span>`),
            ...(media.aiTags || []).slice(0, 1).map(t => `<span class="tag ai-tag">🤖 ${this.escape(t)}</span>`)
        ].join("");
        card.innerHTML = `
            <div class="thumb-wrap">
                ${isImage
                    ? `<img class="thumb" src="${media.blobUrl}" alt="${this.escape(media.title)}" loading="lazy" onerror="this.parentElement.style.background='#e2e8f0'" />`
                    : `<video class="thumb" src="${media.blobUrl}" muted></video>`
                }
                <div class="thumb-overlay">
                    <div class="overlay-likes">❤️ ${media.likes || 0}</div>
                </div>
            </div>
            <div class="body">
                <div class="title">${this.escape(media.title)}</div>
                <div class="meta">
                    <span>@${this.escape(media.userName || "user")}</span>
                    <span style="color:var(--text-muted)">${this.formatDate(media.uploadTime)}</span>
                </div>
                <div class="tags">${allTags}</div>
            </div>
        `;
        return card;
    },

    escape(s) {
        const d = document.createElement("div");
        d.textContent = s == null ? "" : String(s);
        return d.innerHTML;
    },

    showModal(media) {
        const me = Auth.user();
        const liked = (media.likedBy || []).includes(me?.userId);
        const backdrop = document.getElementById("modal-backdrop");
        backdrop.classList.add("show");

        const allTags = [
            ...(media.tags || []).map(t => `<span class="tag">${this.escape(t)}</span>`),
            ...(media.aiTags || []).map(t => `<span class="tag ai-tag">🤖 ${this.escape(t)}</span>`)
        ].join("");

        const commentsHtml = (media.comments || []).map(c => `
            <div class="comment">
                <div class="c-avatar">${this.initials(c.user)}</div>
                <div class="c-body">
                    <div class="c-author">${this.escape(c.user)}</div>
                    <div class="c-text">${this.escape(c.text)}</div>
                </div>
            </div>
        `).join("") || `<p style="color:var(--text-muted);font-size:13px;padding:8px 0">No comments yet.</p>`;

        const isImage = media.type === "image" || (media.blobUrl || "").match(/\.(jpg|jpeg|png|gif|webp)$/i);

        backdrop.innerHTML = `
            <div class="modal">
                <button class="close" onclick="document.getElementById('modal-backdrop').classList.remove('show')">✕</button>
                <div class="modal-media">
                    ${isImage
                        ? `<img src="${media.blobUrl}" alt="${this.escape(media.title)}" />`
                        : `<video src="${media.blobUrl}" controls style="width:100%;max-height:92vh"></video>`
                    }
                </div>
                <div class="modal-info">
                    <div class="modal-header">
                        <h2>${this.escape(media.title)}</h2>
                        <div class="author">
                            <span>by <strong>@${this.escape(media.userName)}</strong></span>
                            <span>· ${this.formatDate(media.uploadTime)}</span>
                        </div>
                    </div>
                    <div class="modal-body">
                        ${media.description ? `<p class="description">${this.escape(media.description)}</p>` : ""}
                        <div class="tags" style="gap:5px">${allTags}</div>
                    </div>
                    <div class="action-bar">
                        <button class="action-btn ${liked ? "liked" : ""}" onclick="handleLike('${media.mediaId}')">
                            ${liked ? "❤️" : "🤍"} ${media.likes || 0} ${media.likes === 1 ? "like" : "likes"}
                        </button>
                        <button class="action-btn" onclick="document.getElementById('new-comment').focus()">
                            💬 ${(media.comments || []).length}
                        </button>
                        ${media.userId === me?.userId ? `
                            <button class="action-btn" onclick="toggleEditForm()">✏️ Edit</button>
                            <button class="action-btn danger" onclick="handleDelete('${media.mediaId}')">🗑️ Delete</button>
                        ` : ""}
                    </div>
                    ${media.userId === me?.userId ? `
                    <div id="edit-form" style="display:none;padding:14px 0 6px;border-top:1px solid var(--border);margin-top:4px">
                        <div style="margin-bottom:8px">
                            <label style="font-size:12px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:4px">Title</label>
                            <input id="edit-title" value="${this.escape(media.title)}" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:6px;font-size:14px;box-sizing:border-box" />
                        </div>
                        <div style="margin-bottom:10px">
                            <label style="font-size:12px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:4px">Description</label>
                            <textarea id="edit-desc" rows="2" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:6px;font-size:14px;resize:vertical;box-sizing:border-box">${this.escape(media.description || "")}</textarea>
                        </div>
                        <button onclick="handleEdit('${media.mediaId}')" style="background:var(--primary);color:#fff;border:none;padding:7px 18px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600">Save Changes</button>
                        <button onclick="toggleEditForm()" style="background:none;border:1.5px solid var(--border);color:var(--text-muted);padding:7px 16px;border-radius:6px;cursor:pointer;font-size:13px;margin-left:8px">Cancel</button>
                    </div>
                    ` : ""}
                    <div class="comments-area">
                        <div class="comments-title">Comments</div>
                        <div id="comments-list">${commentsHtml}</div>
                    </div>
                    <div class="comment-input-row">
                        <input id="new-comment" placeholder="Write a comment…" onkeydown="if(event.key==='Enter')handleComment('${media.mediaId}')" />
                        <button onclick="handleComment('${media.mediaId}')">Post</button>
                    </div>
                </div>
            </div>
        `;

        backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.classList.remove("show"); };
    }
};

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
    if (!confirm("Delete this photo permanently?")) return;
    try {
        await API.deleteMedia(mediaId);
        document.getElementById("modal-backdrop").classList.remove("show");
        UI.toast("Photo deleted", "success");
        document.dispatchEvent(new CustomEvent("media-updated"));
    } catch (err) { UI.toast(err.message, "error"); }
}

function toggleEditForm() {
    const form = document.getElementById("edit-form");
    if (form) form.style.display = form.style.display === "none" ? "block" : "none";
}

async function handleEdit(mediaId) {
    const title = document.getElementById("edit-title")?.value.trim();
    const description = document.getElementById("edit-desc")?.value.trim();
    if (!title) { UI.toast("Title is required", "error"); return; }
    try {
        const updated = await API.updateMedia(mediaId, { title, description });
        UI.showModal(updated);
        UI.toast("Changes saved", "success");
        document.dispatchEvent(new CustomEvent("media-updated"));
    } catch (err) { UI.toast(err.message, "error"); }
}
