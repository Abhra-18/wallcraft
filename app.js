/* ===================================
   WALLCRAFT — Application Logic
   Powered by Pexels API
   =================================== */

const API_KEY = ''; // User must provide their Pexels API key
const BASE_URL = 'https://api.pexels.com/v1';
const PER_PAGE = 30;

// ── State ──
const state = {
    photos: [],
    page: 1,
    query: '',
    category: 'all',
    device: 'desktop',    // 'desktop' or 'mobile'
    color: '',
    orientation: 'landscape', // derived from device
    loading: false,
    hasMore: true,
    totalResults: 0,
};

// ── Category queries ──
const CATEGORY_QUERIES = {
    all: '',
    nature: 'nature landscape scenery',
    abstract: 'abstract colorful pattern',
    minimal: 'minimalist simple clean wallpaper',
    dark: 'dark moody night',
    space: 'space galaxy universe stars',
};

// ── Pastel avatar colors ──
const AVATAR_COLORS = [
    'linear-gradient(135deg, #a855f7, #6366f1)',
    'linear-gradient(135deg, #ec4899, #a855f7)',
    'linear-gradient(135deg, #06b6d4, #3b82f6)',
    'linear-gradient(135deg, #f97316, #ef4444)',
    'linear-gradient(135deg, #22c55e, #06b6d4)',
    'linear-gradient(135deg, #eab308, #f97316)',
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #ef4444, #ec4899)',
];

function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ── DOM Elements ──
const dom = {
    navbar: document.getElementById('navbar'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    searchTags: document.getElementById('search-tags'),
    grid: document.getElementById('masonry-grid'),
    loading: document.getElementById('loading-container'),
    noResults: document.getElementById('no-results'),
    loadMore: document.getElementById('load-more-container'),
    loadMoreBtn: document.getElementById('load-more-btn'),
    galleryTitle: document.getElementById('gallery-title'),
    galleryCount: document.getElementById('gallery-count'),
    modalOverlay: document.getElementById('modal-overlay'),
    modalClose: document.getElementById('modal-close'),
    modalImage: document.getElementById('modal-image'),
    modalImageLoader: document.getElementById('modal-image-loader'),
    modalSidebar: document.getElementById('modal-sidebar'),
    photographerAvatar: document.getElementById('photographer-avatar'),
    photographerName: document.getElementById('photographer-name'),
    detailResolution: document.getElementById('detail-resolution'),
    detailAspect: document.getElementById('detail-aspect'),
    paletteSwatch: document.getElementById('palette-swatch'),
    downloadOptions: document.getElementById('download-options'),
    pexelsLink: document.getElementById('pexels-link'),
    backToTop: document.getElementById('back-to-top'),
    navLinks: document.getElementById('nav-links'),
    navMenuBtn: document.getElementById('nav-menu-btn'),
    colorFilters: document.getElementById('color-filters'),
    deviceToggle: document.getElementById('device-toggle'),
};

// ── API Key Prompt ──
function ensureApiKey() {
    if (API_KEY) return true;
    
    // Check if key exists in localStorage
    const storedKey = localStorage.getItem('pexels_api_key');
    if (storedKey) {
        window.PEXELS_KEY = storedKey;
        return true;
    }

    // Show prompt
    showApiKeyModal();
    return false;
}

function showApiKeyModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'api-key-overlay';
    overlay.style.zIndex = '3000';
    overlay.innerHTML = `
        <div class="modal" style="max-width: 520px;">
            <div style="padding: 40px; text-align: center;">
                <svg width="56" height="56" viewBox="0 0 32 32" fill="none" style="margin-bottom: 24px;">
                    <defs><linearGradient id="keyGrad" x1="0" y1="0" x2="32" y2="32"><stop offset="0%" stop-color="#a855f7"/><stop offset="100%" stop-color="#6366f1"/></linearGradient></defs>
                    <rect width="32" height="32" rx="8" fill="url(#keyGrad)"/>
                    <path d="M8 22L12 10L16 18L20 12L24 22" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <h2 style="font-family: var(--font-display); font-size: 1.5rem; margin-bottom: 12px;">Welcome to Wallcraft</h2>
                <p style="color: var(--text-secondary); margin-bottom: 28px; line-height: 1.6;">
                    Enter your free <a href="https://www.pexels.com/api/" target="_blank" rel="noopener" style="color: var(--accent-purple); text-decoration: underline;">Pexels API key</a> to start browsing thousands of stunning wallpapers.
                </p>
                <div style="display: flex; gap: 10px; max-width: 400px; margin: 0 auto;">
                    <input type="text" id="api-key-input" placeholder="Paste your Pexels API key" 
                        style="flex: 1; padding: 14px 18px; background: var(--bg-elevated); border: 1px solid var(--border-glass); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.95rem; font-family: var(--font-primary); outline: none;"
                    >
                    <button id="api-key-submit" style="padding: 14px 24px; background: var(--gradient-primary); border-radius: var(--radius-md); font-weight: 600; color: white; transition: var(--transition-base); font-size: 0.95rem;">
                        Start
                    </button>
                </div>
                <p style="color: var(--text-muted); font-size: 0.8rem; margin-top: 16px;">
                    Your key is stored locally and never shared.
                </p>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const input = document.getElementById('api-key-input');
    const submit = document.getElementById('api-key-submit');

    function handleSubmit() {
        const key = input.value.trim();
        if (key.length < 10) {
            input.style.borderColor = '#ef4444';
            input.focus();
            return;
        }
        localStorage.setItem('pexels_api_key', key);
        window.PEXELS_KEY = key;
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
        fetchPhotos();
    }

    submit.addEventListener('click', handleSubmit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSubmit();
    });
    input.focus();
}

function getApiKey() {
    return API_KEY || window.PEXELS_KEY || localStorage.getItem('pexels_api_key') || '';
}

// ── API Calls ──
async function fetchPhotos(append = false) {
    const key = getApiKey();
    if (!key) {
        ensureApiKey();
        return;
    }

    if (state.loading) return;
    state.loading = true;

    if (!append) {
        state.page = 1;
        state.photos = [];
        dom.grid.innerHTML = '';
    }

    dom.loading.style.display = 'flex';
    dom.noResults.style.display = 'none';
    dom.loadMore.style.display = 'none';

    // Determine orientation
    state.orientation = state.device === 'mobile' ? 'portrait' : 'landscape';

    // Build query
    let searchQuery = state.query || CATEGORY_QUERIES[state.category] || '';
    if (!searchQuery && state.category === 'all') {
        searchQuery = 'wallpaper';
    }

    // Construct URL
    let url;
    if (searchQuery) {
        url = `${BASE_URL}/search?query=${encodeURIComponent(searchQuery)}&per_page=${PER_PAGE}&page=${state.page}&orientation=${state.orientation}`;
    } else {
        url = `${BASE_URL}/curated?per_page=${PER_PAGE}&page=${state.page}`;
    }

    if (state.color) {
        url += `&color=${state.color}`;
    }

    try {
        const res = await fetch(url, {
            headers: { Authorization: key }
        });

        if (!res.ok) {
            throw new Error(`API Error: ${res.status}`);
        }

        const data = await res.json();
        state.totalResults = data.total_results || 0;
        state.hasMore = !!data.next_page;

        const newPhotos = data.photos || [];
        state.photos = [...state.photos, ...newPhotos];

        updateGalleryInfo();

        if (newPhotos.length === 0 && !append) {
            dom.noResults.style.display = 'block';
        } else {
            renderCards(newPhotos, append);
        }

        dom.loadMore.style.display = state.hasMore ? 'block' : 'none';
    } catch (err) {
        console.error('Fetch error:', err);
        if (!append && state.photos.length === 0) {
            dom.noResults.style.display = 'block';
            dom.noResults.querySelector('h3').textContent = 'Something went wrong';
            dom.noResults.querySelector('p').textContent = 'Please check your API key and try again.';
        }
    } finally {
        state.loading = false;
        dom.loading.style.display = 'none';
    }
}

function updateGalleryInfo() {
    const labels = {
        all: 'Trending Wallpapers',
        nature: 'Nature Wallpapers',
        abstract: 'Abstract Wallpapers',
        minimal: 'Minimal Wallpapers',
        dark: 'Dark Wallpapers',
        space: 'Space Wallpapers',
    };

    if (state.query) {
        dom.galleryTitle.textContent = `Results for \"${state.query}\"`;
    } else {
        dom.galleryTitle.textContent = labels[state.category] || 'Wallpapers';
    }

    const deviceLabel = state.device === 'mobile' ? 'Mobile' : 'Desktop';
    if (state.totalResults > 0) {
        dom.galleryCount.textContent = `${state.totalResults.toLocaleString()} ${deviceLabel} wallpapers found`;
    } else {
        dom.galleryCount.textContent = '';
    }
}

// ── Render Cards ──
function renderCards(photos, append) {
    const fragment = document.createDocumentFragment();

    photos.forEach((photo, index) => {
        const card = document.createElement('div');
        card.className = 'wallpaper-card';
        card.style.animationDelay = `${(index % 10) * 0.06}s`;

        const imgSrc = state.device === 'mobile' ? photo.src.large : photo.src.large2x;
        const thumbSrc = photo.src.medium;
        const avatarColor = getAvatarColor(photo.photographer);
        const initials = getInitials(photo.photographer);

        card.innerHTML = `
            <img src="${thumbSrc}" 
                 alt="Photo by ${photo.photographer}" 
                 loading="lazy"
                 style="aspect-ratio: ${photo.width}/${photo.height}; background-color: ${photo.avg_color};"
            >
            <div class="card-overlay">
                <div class="card-actions">
                    <button class="card-action-btn card-download-quick" data-id="${photo.id}" title="Quick download">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>
                    <button class="card-action-btn card-expand" data-id="${photo.id}" title="Preview">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                    </button>
                </div>
                <div class="card-info">
                    <div class="card-photographer">
                        <div class="card-photographer-avatar" style="background: ${avatarColor};">${initials}</div>
                        ${photo.photographer}
                    </div>
                    <span class="card-resolution">${photo.width}×${photo.height}</span>
                </div>
            </div>
        `;

        // Card click → open modal
        card.addEventListener('click', (e) => {
            if (e.target.closest('.card-download-quick')) {
                e.stopPropagation();
                downloadImage(photo.src.original, `wallcraft-${photo.id}`);
                return;
            }
            openModal(photo);
        });

        fragment.appendChild(card);
    });

    dom.grid.appendChild(fragment);
}

// ── Modal ──
function openModal(photo) {
    const avatarColor = getAvatarColor(photo.photographer);
    const initials = getInitials(photo.photographer);

    dom.photographerAvatar.style.background = avatarColor;
    dom.photographerAvatar.textContent = initials;
    dom.photographerName.textContent = photo.photographer;

    dom.detailResolution.textContent = `${photo.width} × ${photo.height}`;
    
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const d = gcd(photo.width, photo.height);
    dom.detailAspect.textContent = `${photo.width / d}:${photo.height / d} aspect ratio`;

    dom.paletteSwatch.style.background = photo.avg_color;

    dom.pexelsLink.href = photo.url;

    // Download options
    const sizes = [
        { label: 'Original', dims: `${photo.width}×${photo.height}`, url: photo.src.original, primary: true },
        { label: 'Large', dims: '2x', url: photo.src.large2x, primary: false },
        { label: 'Large', dims: '1x', url: photo.src.large, primary: false },
        { label: 'Medium', dims: 'Optimized', url: photo.src.medium, primary: false },
    ];

    dom.downloadOptions.innerHTML = sizes.map(s => `
        <a href="${s.url}" download="wallcraft-${photo.id}" target="_blank" rel="noopener noreferrer"
           class="download-btn ${s.primary ? 'download-btn-primary' : ''}"
           onclick="event.preventDefault(); downloadImage('${s.url}', 'wallcraft-${photo.id}');">
            <span class="size-label">${s.label}</span>
            <span class="size-dims">${s.dims}</span>
        </a>
    `).join('');

    // Show modal
    dom.modalImageLoader.classList.remove('loaded');
    dom.modalImage.src = '';
    
    const previewSrc = photo.src.large2x;
    dom.modalImage.onload = () => {
        dom.modalImageLoader.classList.add('loaded');
    };
    dom.modalImage.src = previewSrc;

    dom.modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    dom.modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// ── Download ──
async function downloadImage(url, filename) {
    try {
        const res = await fetch(url, {
            headers: { Authorization: getApiKey() }
        });
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename + '.jpg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
    } catch (err) {
        // Fallback: open in new tab
        window.open(url, '_blank');
    }
}

// ── Event Listeners ──

// Search
function performSearch() {
    const query = dom.searchInput.value.trim();
    if (!query) return;
    state.query = query;
    state.category = 'all';
    updateActiveNavLink('all');
    fetchPhotos();
    
    // Scroll to gallery
    document.getElementById('gallery-section').scrollIntoView({ behavior: 'smooth' });
}

dom.searchBtn.addEventListener('click', performSearch);
dom.searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performSearch();
});

// Search tags
dom.searchTags.addEventListener('click', (e) => {
    const tag = e.target.closest('.search-tag');
    if (!tag) return;
    const query = tag.dataset.query;
    dom.searchInput.value = query;
    state.query = query;
    state.category = 'all';
    updateActiveNavLink('all');
    fetchPhotos();
    document.getElementById('gallery-section').scrollIntoView({ behavior: 'smooth' });
});

// Nav category links
dom.navLinks.addEventListener('click', (e) => {
    const link = e.target.closest('.nav-link');
    if (!link) return;
    e.preventDefault();

    const category = link.dataset.category;
    state.category = category;
    state.query = '';
    dom.searchInput.value = '';
    updateActiveNavLink(category);
    fetchPhotos();

    // Close mobile menu
    dom.navLinks.classList.remove('open');
    dom.navMenuBtn.classList.remove('active');

    document.getElementById('gallery-section').scrollIntoView({ behavior: 'smooth' });
});

function updateActiveNavLink(category) {
    dom.navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.category === category);
    });
}

// Device toggle
dom.deviceToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    
    const device = btn.dataset.device;
    state.device = device;
    
    dom.deviceToggle.querySelectorAll('.toggle-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.device === device);
    });

    fetchPhotos();
});

// Color filters
dom.colorFilters.addEventListener('click', (e) => {
    const dot = e.target.closest('.color-dot');
    if (!dot) return;

    dom.colorFilters.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');

    state.color = dot.dataset.color;
    fetchPhotos();
});

// Load more
dom.loadMoreBtn.addEventListener('click', () => {
    state.page++;
    fetchPhotos(true);
});

// Modal close
dom.modalClose.addEventListener('click', closeModal);
dom.modalOverlay.addEventListener('click', (e) => {
    if (e.target === dom.modalOverlay) closeModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// Mobile menu
dom.navMenuBtn.addEventListener('click', () => {
    dom.navMenuBtn.classList.toggle('active');
    dom.navLinks.classList.toggle('open');
});

// Navbar scroll
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    
    // Navbar background
    dom.navbar.classList.toggle('scrolled', scrollY > 50);
    
    // Back to top
    dom.backToTop.classList.toggle('visible', scrollY > 600);

    lastScroll = scrollY;
}, { passive: true });

// Back to top
dom.backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Infinite scroll
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && state.hasMore && !state.loading) {
            state.page++;
            fetchPhotos(true);
        }
    });
}, { rootMargin: '400px' });

observer.observe(dom.loadMore);

// ── Initialize ──
document.addEventListener('DOMContentLoaded', () => {
    if (ensureApiKey()) {
        fetchPhotos();
    }
});

// Make downloadImage global for inline onclick
window.downloadImage = downloadImage;