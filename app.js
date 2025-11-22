// ==================== DATA MANAGEMENT ====================
class SocialMediaApp {
    constructor() {
        this.posts = [];
        this.currentUser = null;
        this.currentFilter = 'latest';
        this.editingPostId = null;
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.checkAuthStatus();
        this.applyTheme();
    }

    // ==================== AUTHENTICATION ====================
    setupEventListeners() {
        // Auth events
        document.getElementById('toggle-signup').addEventListener('click', () => this.toggleAuthForm());
        document.getElementById('toggle-login').addEventListener('click', () => this.toggleAuthForm());
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('signup-form').addEventListener('submit', (e) => this.handleSignup(e));

        // Feed events
        document.getElementById('post-btn').addEventListener('click', () => this.createPost());
        document.getElementById('post-text').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) this.createPost();
        });

        // Search and filter
        document.getElementById('search-input').addEventListener('input', (e) => this.searchPosts(e.target.value));
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter, e.target));
        });

        // Emoji buttons
        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const emoji = e.target.dataset.emoji;
                const textarea = document.getElementById('post-text');
                textarea.value += emoji;
                textarea.focus();
            });
        });

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());

        // Modal
        document.querySelector('.modal-close').addEventListener('click', () => this.closeEditModal());
        document.getElementById('cancel-edit').addEventListener('click', () => this.closeEditModal());
        document.getElementById('save-edit').addEventListener('click', () => this.saveEdit());
    }

    toggleAuthForm() {
        document.getElementById('login-form').classList.toggle('active');
        document.getElementById('signup-form').classList.toggle('active');
    }

    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (!email || !password) {
            alert('Please fill all fields');
            return;
        }

        // Simulate login
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            alert('Invalid credentials! Try email: test@test.com, password: 123456');
            return;
        }

        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.showFeed();
        this.clearAuthForms();
    }

    handleSignup(e) {
        e.preventDefault();
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value.trim();

        if (!name || !email || !password) {
            alert('Please fill all fields');
            return;
        }

        if (password.length < 4) {
            alert('Password must be at least 4 characters');
            return;
        }

        // Store user
        let users = JSON.parse(localStorage.getItem('users')) || [];
        if (users.find(u => u.email === email)) {
            alert('Email already registered!');
            return;
        }

        const newUser = { id: Date.now(), name, email, password };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        alert('✅ Signup successful! Please login.');
        this.toggleAuthForm();
        this.clearAuthForms();
    }

    clearAuthForms() {
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('signup-name').value = '';
        document.getElementById('signup-email').value = '';
        document.getElementById('signup-password').value = '';
    }

    checkAuthStatus() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showFeed();
        } else {
            this.showAuth();
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showAuth();
        this.clearAuthForms();
        document.getElementById('login-form').classList.add('active');
        document.getElementById('signup-form').classList.remove('active');
    }

    // ==================== UI DISPLAY ====================
    showAuth() {
        document.getElementById('auth-container').classList.add('active');
        document.querySelector('.feed-screen').classList.remove('active');
    }

    showFeed() {
        document.getElementById('auth-container').classList.remove('active');
        document.querySelector('.feed-screen').classList.add('active');
        document.getElementById('welcome-user').textContent = `Welcome, ${this.currentUser.name}`;
        this.renderFeed();
    }

    // ==================== POST MANAGEMENT ====================
    createPost() {
        const text = document.getElementById('post-text').value.trim();
        const imageUrl = document.getElementById('post-image').value.trim();

        if (!text) {
            alert('Please write something to post!');
            return;
        }

        const post = {
            id: Date.now(),
            author: this.currentUser.name,
            text,
            image: imageUrl,
            likes: 0,
            liked: false,
            timestamp: new Date(),
            reactions: {}
        };

        this.posts.unshift(post);
        this.saveToStorage();
        this.renderFeed();

        // Clear inputs
        document.getElementById('post-text').value = '';
        document.getElementById('post-image').value = '';

        console.log('[v0] Post created successfully');
    }

    deletePost(postId) {
        if (confirm('Are you sure you want to delete this post?')) {
            this.posts = this.posts.filter(p => p.id !== postId);
            this.saveToStorage();
            this.renderFeed();
            console.log('[v0] Post deleted:', postId);
        }
    }

    toggleLike(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
            post.liked = !post.liked;
            post.likes = post.liked ? post.likes + 1 : post.likes - 1;
            this.saveToStorage();
            this.renderFeed();
        }
    }

    openEditModal(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        this.editingPostId = postId;
        document.getElementById('edit-text').value = post.text;
        document.getElementById('edit-image').value = post.image;
        document.getElementById('edit-modal').classList.add('active');
    }

    closeEditModal() {
        this.editingPostId = null;
        document.getElementById('edit-modal').classList.remove('active');
    }

    saveEdit() {
        const post = this.posts.find(p => p.id === this.editingPostId);
        if (!post) return;

        const newText = document.getElementById('edit-text').value.trim();
        if (!newText) {
            alert('Post cannot be empty!');
            return;
        }

        post.text = newText;
        post.image = document.getElementById('edit-image').value.trim();
        this.saveToStorage();
        this.renderFeed();
        this.closeEditModal();
        console.log('[v0] Post updated:', this.editingPostId);
    }

    // ==================== SEARCH & FILTER ====================
    searchPosts(query) {
        this.renderFeed(query);
    }

    setFilter(filter, element) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        element.classList.add('active');
        this.renderFeed();
    }

    getFilteredAndSortedPosts(searchQuery = '') {
        let filtered = this.posts;

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(p =>
                p.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.author.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Sorting
        const sorted = [...filtered];
        switch (this.currentFilter) {
            case 'latest':
                sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                break;
            case 'oldest':
                sorted.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                break;
            case 'popular':
                sorted.sort((a, b) => b.likes - a.likes);
                break;
            case 'trending':
                // Posts with likes from today
                sorted.sort((a, b) => {
                    const today = new Date().toDateString();
                    const aToday = new Date(a.timestamp).toDateString() === today ? 1 : 0;
                    const bToday = new Date(b.timestamp).toDateString() === today ? 1 : 0;
                    return (bToday * b.likes) - (aToday * a.likes);
                });
                break;
        }

        return sorted;
    }

    // ==================== RENDERING ====================
    renderFeed(searchQuery = '') {
        const feed = document.getElementById('posts-feed');
        const posts = this.getFilteredAndSortedPosts(searchQuery);

        if (posts.length === 0) {
            feed.innerHTML = '<div class="empty-state"> No posts found. Try searching differently!</div>';
            return;
        }

        feed.innerHTML = posts.map(post => this.createPostHTML(post)).join('');

        // Attach event listeners
        posts.forEach(post => {
            const likeBtn = document.querySelector(`[data-post-id="${post.id}"] .like-btn`);
            const deleteBtn = document.querySelector(`[data-post-id="${post.id}"] .delete-btn`);
            const editBtn = document.querySelector(`[data-post-id="${post.id}"] .edit-btn`);

            if (likeBtn) likeBtn.addEventListener('click', () => this.toggleLike(post.id));
            if (deleteBtn) deleteBtn.addEventListener('click', () => this.deletePost(post.id));
            if (editBtn) editBtn.addEventListener('click', () => this.openEditModal(post.id));
        });
    }

    createPostHTML(post) {
    const timeAgo = this.getTimeAgo(post.timestamp);
    const liked = post.liked ? 'liked' : '';

    return `
        <div class="post-card" data-post-id="${post.id}">
            <div class="post-header">
                <div class="post-user">
                    <div class="post-avatar">👤</div>
                    <div class="post-info">
                        <h3>${this.escapeHtml(post.author)}</h3>
                        <span class="post-time">${timeAgo}</span>
                    </div>
                </div>
                <button class="post-menu">⋮</button>
            </div>

            <div class="post-content">
                <p class="post-text">${this.escapeHtml(post.text)}</p>
                ${post.image ? `<img src="${this.escapeHtml(post.image)}" alt="Post image" class="post-image" onerror="this.style.display='none'">` : ''}
            </div>

            <div class="post-actions">

                <!-- Reaction Wrapper + Popup -->
                <div class="reaction-wrapper">
                    <button class="action-btn like-btn ${liked}" title="Like">
                        ❤️ <span>${post.likes}</span>
                    </button>

                    <div class="reaction-popup">
                        <span class="reaction" data-react="like">👍</span>
                        <span class="reaction" data-react="love">❤️</span>
                        <span class="reaction" data-react="haha">😆</span>
                        <span class="reaction" data-react="wow">😮</span>
                        <span class="reaction" data-react="sad">😢</span>
                        <span class="reaction" data-react="angry">😡</span>
                    </div>
                </div>

                <button class="action-btn edit-btn" title="Edit">✏️ Edit</button>
                <button class="action-btn delete-btn" title="Delete">🗑️ Delete</button>
            </div>
            <div class="post-reaction-counts">
            ${this.renderReactionCounts(post.reactions)}
            </div>
        </div>
    `;
}

    getTimeAgo(timestamp) {
        const now = new Date();
        const postTime = new Date(timestamp);
        const diffMs = now - postTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return postTime.toLocaleDateString();
    }



    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

     renderReactionCounts(reactions) {
    if (!reactions) return "";

    const icons = {
        like: "👍",
        love: "❤️",
        haha: "😆",
        wow: "😮",
        sad: "😢",
        angry: "😡"
    };

    return Object.entries(reactions)
        .filter(([type, count]) => count > 0)
        .map(([type, count]) => `
            <span class="reaction-count-item">${icons[type]} ${count}</span>
        `)
        .join(" ");
}

    // ==================== THEME ====================
    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
        this.updateThemeButton();
    }

    applyTheme() {
        const theme = localStorage.getItem('theme') || 'light';
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        }
        this.updateThemeButton();
    }

    updateThemeButton() {
        const isDark = document.body.classList.contains('dark-mode');
        document.getElementById('theme-toggle').textContent = isDark ? '☀️' : '🌙';
    }

    // ==================== STORAGE ====================
    saveToStorage() {
        localStorage.setItem('socialmedia_posts', JSON.stringify(this.posts));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('socialmedia_posts');
        if (saved) {
            this.posts = JSON.parse(saved).map(p => ({
                ...p,
                timestamp: new Date(p.timestamp)
            }));
        } else {
            // Default demo posts
            this.posts = [
                {
                    id: Date.now() - 3600000,
                    author: 'Akif Mehmood',
                    text: ' Welcome to SocialHub! This is a demo post. Try creating your own!',
                    image: 'https://avatars.mds.yandex.net/get-mpic/5138384/img_id4799653528162045160.jpeg/orig',
                    likes: 28,
                    liked: false,
                    timestamp: new Date(Date.now() - 3600000),
                    reactions: {}
                },
                {
                    id: Date.now() - 1800000,
                    author: 'Muzammil Qurban',
                    text: ' Like, edit, delete, search, and filter posts. Dark mode is available too!',
                    image: 'https://resizer.mail.ru/p/7d71d79f-413d-5d14-9cf5-3e7054edccd3/AQABtQN6Z62XEJ7nWFXkDJhp2M-xCTNhobZqjJpdjay5uLDUj_B8cO7VJrLtTwk4q2xp46oyZNJ6VpalxxSsTdebXZM.jpg',
                    likes: 63,
                    liked: false,
                    timestamp: new Date(Date.now() - 1800000),
                    reactions: {}
                },
                {
                    id: Date.now() - 3800000,
                    author: 'Ak',
                    text: 'Welcome to SocialHub!',
                    image: 'https://img.freepik.com/free-photo/photorealistic-wintertime-scene-with-people-snowboarding_23-2151472636.jpg?semt=ais_hybrid&w=740&q=80',
                    likes: 68,
                    liked: false,
                    timestamp: new Date(Date.now() - 3800000),
                    reactions: {}
                }
            ];
            this.saveToStorage();
        }
    }

}

// Reaction popup event
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("reaction")) {

        const reaction = e.target.dataset.react;
        const postCard = e.target.closest(".post-card");
        const postId = Number(postCard.dataset.postId);

        const post = app.posts.find(p => p.id === postId);

        if (!post.reactions) post.reactions = {};

        post.reactions[reaction] = (post.reactions[reaction] || 0) + 1;

        app.saveToStorage();
        app.renderFeed();
    }
});


// ==================== INITIALIZATION ====================
const app = new SocialMediaApp();


// Demo login credentials
console.log('%c SocialHub - Demo Credentials', 'font-size: 14px; font-weight: bold; color: #FF1493;');
console.log('%cEmail: test@test.com\nPassword: 123456', 'font-size: 12px; color: #00CED1;');