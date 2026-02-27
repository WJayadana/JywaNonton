document.addEventListener('DOMContentLoaded', () => {
    // --- PWA Service Worker & Install Logic ---
    let deferredPrompt;
    const installBtnDesktop = document.getElementById('pwa-install-desktop');
    const installBtnMobile = document.getElementById('pwa-install-mobile');

    // Premium Check: Don't show install buttons if already in Standalone Mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    
    // Icon Dictionary for Dynamic Circle
    const sectionIcons = {
        home: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
        history: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
        favorites: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>',
        search: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
        reels: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>',
        detail: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };

    const sectionLabels = {
        home: 'Home',
        history: 'Histori',
        favorites: 'Bookmark',
        search: 'Cari',
        reels: 'Reels',
        detail: 'Info'
    };

    if (isStandalone) {
        console.log('[PWA] Running in standalone mode - enabling Dynamic Sultan Nav');
        if (installBtnMobile) installBtnMobile.style.display = 'flex';
    }

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('[PWA] Service Worker registered', reg.scope))
                .catch(err => console.error('[PWA] Registration failed', err));
        });
    }

    // Handle Install Prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        // Only show if not already in standalone mode
        if (isStandalone) return;

        // Prevent default prompt
        e.preventDefault();
        // Save the event
        deferredPrompt = e;
        
        // Show our custom buttons with a smooth fade
        if (installBtnDesktop) installBtnDesktop.style.display = 'block';
        if (installBtnMobile) {
            installBtnMobile.style.display = 'flex';
            // Smoothly animate the appearance if needed
        }
    });

    const triggerInstall = async () => {
        if (!deferredPrompt) {
            // FALLBACK: Show help modal if native prompt is not available
            const helpModal = document.getElementById('pwa-help-modal');
            if (helpModal) {
                helpModal.style.display = 'flex';
                // Trigger animation reflow
                helpModal.offsetHeight;
                helpModal.classList.add('active');
            }
            return;
        }
        
        // Show the native prompt
        deferredPrompt.prompt();
        
        // Wait for user choice
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] Install choice: ${outcome}`);
        
        // Reset deferredPrompt
        deferredPrompt = null;
        
        // Hide our buttons
        if (installBtnDesktop) installBtnDesktop.style.display = 'none';
        if (installBtnMobile) installBtnMobile.style.display = 'none';
    };

    if (installBtnDesktop) installBtnDesktop.addEventListener('click', triggerInstall);
    if (installBtnMobile) installBtnMobile.addEventListener('click', triggerInstall);

    // Close Help Modal
    const helpCloseBtn = document.getElementById('pwa-help-close-btn');
    if (helpCloseBtn) {
        helpCloseBtn.addEventListener('click', () => {
            const helpModal = document.getElementById('pwa-help-modal');
            if (helpModal) helpModal.style.display = 'none';
        });
    }

    // Hide if already installed
    window.addEventListener('appinstalled', (evt) => {
        console.log('[PWA] App successfully installed');
        if (installBtnDesktop) installBtnDesktop.style.display = 'none';
        if (installBtnMobile) installBtnMobile.style.display = 'none';
    });

    // --- Utils ---
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    const throttle = (func, limit) => {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    // --- State Management ---
    const state = {
        currentDrama: null,
        episodesList: [],
        activeSection: 'home',
        caches: { home: false, history: false, favorites: false, popular: false },
        detailCache: {},
        carousel: {
            data: [],
            index: 0,
            interval: null
        },
        history: JSON.parse(localStorage.getItem('jywa_history') || '[]')
    };

    // --- Elements ---
    const elements = {
        loader: document.getElementById('loader'),
        header: document.getElementById('main-header'),
        hero: {
            container: document.querySelector('.hero'),
            bg: document.getElementById('hero-bg'),
            poster: document.getElementById('hero-poster'),
            title: document.getElementById('hero-title'),
            desc: document.getElementById('hero-desc'),
            eps: document.getElementById('hero-eps'),
            author: document.getElementById('hero-author'),
            playBtn: document.getElementById('hero-play-btn'),
            prevBtn: document.getElementById('hero-prev'),
            nextBtn: document.getElementById('hero-next'),
            dots: document.getElementById('hero-dots'),
            tags: document.getElementById('hero-tags')
        },
        grids: {
            trending: document.getElementById('trending-grid'),
            latest: document.getElementById('latest-grid'),
            recommended: document.getElementById('recommended-grid'),
            search: document.getElementById('search-grid'),
            popular: document.getElementById('popular-grid'),
            favorites: document.getElementById('favorites-grid')
        },
        views: {
            home: document.getElementById('home-view'),
            history: document.getElementById('history-view'),
            favorites: document.getElementById('favorites-view'),
            search: document.getElementById('search-view'),
            detail: document.getElementById('detail-view'),
            reels: document.getElementById('reels-view')
        },
        searchTitle: document.getElementById('search-results-title'),
        searchInput: document.getElementById('search-input'),
        searchBtn: document.getElementById('search-btn'),
        modals: {
            detail: document.getElementById('detail-modal'),
            player: document.getElementById('player-modal')
        },
        suggestions: document.getElementById('search-suggestions'),
        historyContainer: document.getElementById('history-container'),
        notice: {
            modal: document.getElementById('notice-modal'),
            title: document.getElementById('notice-title'),
            admin: document.getElementById('notice-admin'),
            message: document.getElementById('notice-message'),
            closeBtn: document.getElementById('notice-close-btn'),
            suppressCheckbox: document.getElementById('notice-suppress-checkbox')
        },
        theme: {
            toggle: document.getElementById('theme-toggle'),
            logo: document.getElementById('site-logo')
        }
    };

    // --- API Calls (Using Local Backend) ---
    const API = {
        async request(endpoint, params = {}) {
            try {
                const url = new URL(`${window.location.origin}${endpoint}`);
                Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return await res.json();
            } catch (err) {
                console.error(`API Error (${endpoint}):`, err);
                return null;
            }
        },
        getTrending: () => API.request('/api/trending').then(d => d?.data || []),
        getLatest: () => API.request('/api/latest').then(d => d?.data || []),
        getRecommended: () => API.request('/api/for-you').then(d => d?.data || []),
        getVIP: () => API.request('/api/vip').then(d => d?.data || []),
        getSearch: (query) => API.request('/api/search', { query }).then(d => d?.data || []),
        getPopularSearch: () => API.request('/api/popular-searches').then(d => d?.data || []),
        getDetail: (bookId) => API.request('/api/detail', { bookId }).then(d => d?.data),
        getEpisodes: (bookId) => API.request('/api/episodes', { bookId }).then(d => d?.data || []),
        getEpisode: (bookId, index) => API.request('/api/episode', { bookId, index }).then(d => d?.data)
    };

    // --- UI Utils ---
    const showLoader = (type = 'grid') => {
        if (!elements.loader) return;

        const skHeader = `
            <div class="sk-header-mock">
                <div class="sk-logo-mock sk-box"></div>
                <div class="sk-search-mock sk-box"></div>
                <div class="sk-nav-mock">
                    <div class="sk-nav-item-mock sk-box"></div>
                    <div class="sk-nav-item-mock sk-box"></div>
                    <div class="sk-nav-item-mock sk-box"></div>
                </div>
            </div>
        `;

        const templates = {
            grid: `
                ${skHeader}
                <div class="skeleton-grid" style="padding-top: 20px;">
                    ${Array(6).fill('<div class="skeleton-card"><div class="skeleton-thumb"></div><div class="skeleton-text"></div><div class="skeleton-text short"></div></div>').join('')}
                </div>
            `,
            home: `
                ${skHeader}
                <div style="width: 100%; max-width: 1200px;">
                    <div class="sk-home-hero sk-box">
                        <div class="sk-hero-content-mock">
                            <div class="sk-text" style="width: 300px; height: 40px;"></div>
                            <div class="sk-text" style="width: 500px; height: 20px;"></div>
                            <div class="sk-text" style="width: 400px; height: 20px;"></div>
                            <div class="sk-box" style="width: 180px; height: 45px; margin-top: 10px;"></div>
                        </div>
                    </div>
                    <div class="sk-row">
                        ${Array(6).fill('<div class="skeleton-card" style="flex:0 0 160px; height: 260px;"><div class="skeleton-thumb"></div><div class="skeleton-text"></div></div>').join('')}
                    </div>
                </div>
            `,
            detail: `
                ${skHeader}
                <div class="sk-detail-container" style="padding-top: 40px;">
                    <div class="sk-detail-poster sk-box"></div>
                    <div class="sk-detail-info">
                        <div class="sk-text" style="width: 80%; height: 50px; margin-bottom: 10px;"></div>
                        <div class="sk-text" style="width: 40%; height: 20px; margin-bottom: 30px;"></div>
                        <div class="sk-text" style="width: 90%; height: 120px;"></div>
                        <div style="margin-top: 50px;">
                            <div class="sk-text" style="width: 200px; height: 25px; margin-bottom: 20px;"></div>
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 15px;">
                                ${Array(10).fill('<div class="sk-box" style="height: 120px; border-radius: 16px;"></div>').join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `,
            reels: `
                <div class="sk-reels-bg">
                    <div class="reels-skeleton">
                        <div class="reels-skeleton-pulse"></div>
                        <div class="reels-skeleton-info">
                            <div class="skeleton-text" style="width:120px"></div>
                            <div class="skeleton-text short" style="width:80px"></div>
                        </div>
                    </div>
                </div>
            `
        };

        elements.loader.innerHTML = templates[type] || templates.grid;
        elements.loader.style.display = 'flex';
        // Force reflow for transition
        void elements.loader.offsetWidth;
        elements.loader.style.opacity = '1';
    };

    const hideLoader = () => {
        if (!elements.loader) return;
        elements.loader.style.opacity = '0';
        elements.loader.style.pointerEvents = 'none';

        const cleanup = () => {
            elements.loader.style.display = 'none';
            elements.loader.innerHTML = ''; // Clear content
            elements.loader.removeEventListener('transitionend', cleanup);
            elements.loader.removeEventListener('webkitTransitionEnd', cleanup);
        };

        elements.loader.addEventListener('transitionend', cleanup);
        elements.loader.addEventListener('webkitTransitionEnd', cleanup);

        setTimeout(cleanup, 600);
    };

    const renderDramaCard = (drama) => {
        const div = document.createElement('div');
        div.className = 'drama-card';
        // Handle different property names from different endpoints
        const cover = drama.cover || drama.coverWap || drama.bookCover || 'https://via.placeholder.com/200x300';
        const title = drama.bookName || 'Unknown';
        const eps = drama.chapterCount || drama.totalChapter || '?';
        const tag = drama.score || drama.hotCode || 'HD';

        div.innerHTML = `
            <div class="card-tag">${tag}</div>
            <img src="${cover}" class="card-img" alt="${title}" loading="lazy">
            <div class="card-content">
                <div class="card-title">${title}</div>
                <div class="card-meta">
                    <span>${eps} Episode</span>
                    <span>${drama.protagonist || ''}</span>
                </div>
            </div>
        `;
        
        const cardId = drama.bookId || drama.id;
        
        div.addEventListener('mouseenter', () => prefetchDrama(cardId));
        div.addEventListener('click', () => {
            console.log('Drama card clicked:', drama.bookName, 'ID:', cardId);
            if (!cardId) console.error('Error: No ID found for drama:', drama);
            openDetail(cardId);
        });
        return div;
    };

    // --- History System ---
    const saveHistory = (drama, epIndex, progress = 0) => {
        if (!drama) return;
        const bookId = drama.bookId || drama.id;

        // Smart Progress: If starting same episode, preserve old progress until updated
        const existing = state.history.find(h => h.bookId === bookId);
        let finalProgress = progress;
        if (progress === 0 && existing && existing.chapterIndex === epIndex && existing.progress > 0) {
            finalProgress = existing.progress;
        }

        const entry = {
            bookId: bookId,
            bookName: drama.bookName,
            cover: drama.cover || drama.coverWap || drama.bookCover,
            chapterIndex: epIndex,
            progress: finalProgress,
            timestamp: Date.now()
        };

        // Remove existing if any
        let history = state.history.filter(h => h.bookId !== entry.bookId);
        // Add to front
        history.unshift(entry);
        // Limit to 10
        state.history = history.slice(0, 10);
        localStorage.setItem('jywa_history', JSON.stringify(state.history));
        
        // Refresh history UI if on history view
        if (state.activeSection === 'history') updateHistorySection();
    };

    const updateHistorySection = () => {
        const container = elements.historyContainer;
        if (!container) return;

        if (state.history.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <section class="history-section">
                <div class="section-head">
                    <h2>Lanjutkan Menonton</h2>
                </div>
                <div class="history-scroll">
                    ${state.history.map(item => `
                        <div class="history-card" onclick="app.playEpisode('${item.bookId}', ${item.chapterIndex})">
                            <img src="${item.cover}" class="history-thumb">
                            ${item.progress > 0 ? `
                                <div class="history-progress-container">
                                    <div class="history-progress-bar" style="width: ${item.progress}%"></div>
                                </div>
                            ` : ''}
                            <div class="history-play-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                            </div>
                            <div class="history-info">
                                <div class="history-title">${item.bookName}</div>
                                <div class="history-ep">Episode ${item.chapterIndex} ${item.progress > 0 ? `(${item.progress}%)` : ''}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    };

    // --- Hero Carousel Logic ---
    const updateHero = (drama, index = -1) => {
        if (!drama) return;
        
        // Update content
        elements.hero.bg.style.opacity = '0';
        elements.hero.poster.style.opacity = '0';
        elements.hero.title.style.opacity = '0';
        elements.hero.desc.style.opacity = '0';

        setTimeout(() => {
            const cover = drama.cover || drama.coverWap || drama.bookCover;
            elements.hero.bg.src = cover;
            elements.hero.poster.src = cover;
            
            elements.hero.title.textContent = drama.bookName;
            elements.hero.desc.textContent = drama.introduction || drama.bookIntroduction || "Tonton drama terbaik secara gratis di JywaNonton.";
            elements.hero.eps.textContent = `${drama.chapterCount || drama.episodeCount || 0} Episode`;
            elements.hero.author.textContent = drama.author ? `Penulis: ${drama.author}` : '';
            
            // Render Tags
            if (elements.hero.tags) {
                const tags = drama.tags || (drama.bookTags ? drama.bookTags.split(',') : []);
                elements.hero.tags.innerHTML = tags.map(t => {
                    const name = t.tagName || t;
                    return `<span class="hero-tag-pill">${name}</span>`;
                }).slice(0, 3).join('');
            }

            elements.hero.bg.style.opacity = '1';
            elements.hero.poster.style.opacity = '1';
            elements.hero.title.style.opacity = '1';
            elements.hero.desc.style.opacity = '1';
        }, 400);

        elements.hero.playBtn.onclick = () => openDetail(drama.bookId || drama.id);

        // Update Dots if index provided
        if (index !== -1 && elements.hero.dots) {
            document.querySelectorAll('.dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }
    };

    const initCarousel = (dramas) => {
        if (!dramas || dramas.length === 0) return;
        state.carousel.data = dramas.slice(0, 5); // Max 5 items
        state.carousel.index = 0;

        // Render Dots
        elements.hero.dots.innerHTML = '';
        state.carousel.data.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = `dot ${i === 0 ? 'active' : ''}`;
            dot.onclick = () => goToSlide(i);
            elements.hero.dots.appendChild(dot);
        });

        // Event Listeners
        elements.hero.prevBtn.onclick = () => prevSlide();
        elements.hero.nextBtn.onclick = () => nextSlide();

        startCarousel();
        updateHero(state.carousel.data[0], 0);
    };

    const startCarousel = () => {
        clearInterval(state.carousel.interval);
        state.carousel.interval = setInterval(() => nextSlide(), 5000);
    };

    const nextSlide = () => {
        state.carousel.index = (state.carousel.index + 1) % state.carousel.data.length;
        updateHero(state.carousel.data[state.carousel.index], state.carousel.index);
        startCarousel(); // Reset timer
    };

    const prevSlide = () => {
        state.carousel.index = (state.carousel.index - 1 + state.carousel.data.length) % state.carousel.data.length;
        updateHero(state.carousel.data[state.carousel.index], state.carousel.index);
        startCarousel();
    };

    const goToSlide = (i) => {
        state.carousel.index = i;
        updateHero(state.carousel.data[i], i);
        startCarousel();
    };

    const switchView = async (section) => {
        state.activeSection = section;

        // Update Nav UI (Top & Bottom)
    document.querySelectorAll('nav li, .bottom-nav-item').forEach(li => {
        li.classList.toggle('active', li.dataset.section === section);
    });

        // Dynamic Title for SEO
        const titles = {
            home: "Premium Drama Streaming",
            history: "Riwayat Menonton",
            favorites: "Drama Favorit Anda",
            search: "Hasil Pencarian"
        };
        document.title = `JywaNonton - ${titles[section] || 'Nonton Drama'}`;

        // Hide all views, show target
        Object.keys(elements.views).forEach(key => {
            if (elements.views[key]) elements.views[key].style.display = 'none';
        });

        const targetViewKey = section.replace('-indo', '');
        const targetView = elements.views[targetViewKey];
        if (targetView) {
            targetView.style.display = 'block';
            // Cinematic Animation
            targetView.classList.remove('view-animate');
            void targetView.offsetWidth; // Force reflow
            targetView.classList.add('view-animate');
        }

        // Handle Hero Visibility
        elements.hero.container.style.display = (section === 'home') ? 'flex' : 'none';

        // Header visibility in reels
        elements.header.style.display = section === 'reels' ? 'none' : 'flex';
        window.scrollTo(0, 0);

        // Update Dynamic Sultan Circle if Standalone
        if (isStandalone && installBtnMobile) {
            const circle = installBtnMobile.querySelector('.install-circle');
            const label = installBtnMobile.querySelector('span');
            const idKey = section.replace('-view', ''); // normalize
            
            if (circle && sectionIcons[idKey]) {
                circle.innerHTML = sectionIcons[idKey];
            }
            if (label && sectionLabels[idKey]) {
                label.textContent = sectionLabels[idKey];
            }
            
            // Subtle "Pop" animation
            installBtnMobile.classList.remove('pop-anim');
            void installBtnMobile.offsetWidth;
            installBtnMobile.classList.add('pop-anim');
        }

        // Load data if needed
        if (section === 'home') {
            if (!state.caches.home) {
                try {
                    await loadHomeData();
                } catch (err) {
                    console.error(`Failed to load home data:`, err);
                    hideLoader();
                }
            }
        } else if (section === 'history') {
            updateHistorySection();
        } else if (section === 'search') {
            // Handled in handleSearch
        } else if (section === 'favorites') {
            try {
                await loadFavoritesData();
            } catch (err) {
                console.error(`Failed to load favorites data:`, err);
                hideLoader();
            }
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const prefetchDrama = async (bookId) => {
        if (!bookId || state.detailCache[bookId]) return;
        try {
            console.log(`Pre-fetching drama: ${bookId}`);
            const detail = await API.getDetail(bookId);
            if (detail) state.detailCache[bookId] = { detail };
        } catch (err) { /* silent fail */ }
    };

    const loadHomeData = async () => {
        if (state.caches.home) {
            return;
        }
        showLoader('home');
        const [trending, latest, recommended] = await Promise.all([
            API.getTrending(),
            API.getLatest(),
            API.getRecommended()
        ]);

        if (trending && trending.length > 0) initCarousel(trending);

        elements.grids.trending.innerHTML = '';
        trending?.slice(0, 10).forEach(d => elements.grids.trending.appendChild(renderDramaCard(d)));

        elements.grids.latest.innerHTML = '';
        latest?.slice(0, 10).forEach(d => elements.grids.latest.appendChild(renderDramaCard(d)));

        elements.grids.recommended.innerHTML = '';
        recommended?.slice(0, 15).forEach(d => elements.grids.recommended.appendChild(renderDramaCard(d)));

        state.caches.home = true;
        hideLoader();
    };


    const loadFavoritesData = async () => {
        showLoader('grid');
        const bookmarks = JSON.parse(localStorage.getItem('jywa_bookmarks') || '[]');
        const grid = document.getElementById('favorites-grid');
        const emptyState = document.getElementById('no-favorites');
        
        grid.innerHTML = '';
        
        if (bookmarks.length === 0) {
            emptyState.style.display = 'block';
            hideLoader();
            return;
        }

        emptyState.style.display = 'none';

        try {
            const dramaPromises = bookmarks.map(id => {
                if (state.detailCache[id]) return Promise.resolve(state.detailCache[id].detail);
                return API.getDetail(id);
            });

            const dramas = await Promise.all(dramaPromises);
            dramas.forEach(d => {
                if (d) {
                    // Cache it if not already
                    if (!state.detailCache[d.bookId]) state.detailCache[d.bookId] = { detail: d };
                    grid.appendChild(renderDramaCard(d));
                }
            });
        } catch (err) {
            console.error("Favorites Render Error:", err);
        } finally {
            hideLoader();
        }
    };

    const openDetail = async (bookId) => {
        if (!bookId) return;
        
        // Show loader
        showLoader('detail');

        try {
            // Load detail
            let drama;
            if (state.detailCache[bookId]) {
                drama = state.detailCache[bookId].detail;
            }

            if (!drama) drama = await API.getDetail(bookId);

            // Save to cache
            state.detailCache[bookId] = { detail: drama };
            
            state.currentDrama = drama;
            // No longer fetching all episodes upfront

            renderDetailView(drama);
            switchView('detail');

        } catch (err) {
            console.error("Detail Load Error:", err);
            alert("Maaf, gagal memuatkan butiran drama.");
        } finally {
            hideLoader();
        }
    };

    const renderDetailView = (drama) => {
        const view = elements.views.detail;
        const cover = drama.cover || drama.bookCover || drama.coverWap || 'https://via.placeholder.com/200x300';
        const title = drama.bookName || 'Unknown Drama';
        const intro = drama.introduction || 'Tidak ada deskripsi tersedia.';
        const formatDuration = (sec) => {
            if (!sec) return '0:00';
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60);
            return `${m}:${s.toString().padStart(2, '0')}`;
        };

        const chapters = drama.chapterCount || 0;
        const bookId = drama.bookId;

        // Melolo Detail now returns real episodes. Use them if available.
        const epItems = (drama.episodes && drama.episodes.length > 0) 
            ? drama.episodes 
            : Array.from({ length: chapters }, (_, i) => ({ chapterIndex: i + 1 }));

        view.innerHTML = `
            <div class="detail-container">
                <div class="detail-back-btn" onclick="app.switchView('home')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    <span>Kembali Ke Beranda</span>
                </div>
                
                <div class="detail-header-card">
                    <div class="detail-poster-wrapper">
                        <img src="${cover}" alt="${title}">
                    </div>
                    <div class="detail-main-info">
                        <h1>${title}</h1>
                        <div class="detail-meta-row">
                            <div class="detail-meta-item">🎬 ${chapters} Episode</div>
                            ${drama.author ? `<div class="detail-meta-item">✍️ ${drama.author}</div>` : ''}
                        </div>
                        <div class="hero-tags" style="margin-bottom: 15px;">
                            ${(drama.tags || (drama.bookTags ? drama.bookTags.split(',') : [])).map(t => {
                                const name = t.tagName || t;
                                return `<span class="hero-tag-pill">${name}</span>`;
                            }).slice(0, 3).join('')}
                        </div>
                        <p class="detail-desc">${intro}</p>
                        <div class="hero-btns">
                            <button class="btn btn-primary" id="detail-watch-now" onclick="app.playEpisode('${bookId}', 1)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                Tonton Sekarang (Eps 1)
                            </button>
                            <button class="btn btn-glass detail-bookmark-btn ${isBookmarked(bookId) ? 'active' : ''}" onclick="app.toggleBookmark('${bookId}')">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="${isBookmarked(bookId) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                </svg>
                                <span>${isBookmarked(bookId) ? 'Tersimpan' : 'Bookmark'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <section class="episodes-section">
                    <h2>Daftar Episode</h2>
                    <div class="ep-card-grid">
                        ${epItems.map(ep => `
                            <div class="ep-card" 
                                 style="background-image: url('${ep.cover}')" 
                                 onclick="app.playEpisode('${bookId}', ${ep.chapterIndex})">
                                <span class="ep-num">${ep.chapterIndex}</span>
                                <span class="ep-label">${ep.duration ? formatDuration(ep.duration) : 'Episode'}</span>
                            </div>
                        `).join('')}
                    </div>
                </section>
            </div>
        `;
    };

    const playEpisode = async (bookId, index) => {
        showLoader();
        try {
            const epData = await API.getEpisode(bookId, index);
            if (epData && epData.playUrl) {
                playVideo(epData.playUrl, index);
            } else {
                alert("Maaf, episode ini tidak tersedia atau perlu berlangganan.");
            }
        } catch (err) {
            console.error("Play Episode Error:", err);
            alert("Gagal memuat episode.");
        } finally {
            hideLoader();
        }
    };

    const playVideo = (url, index) => {
        if (!url || url === 'undefined') {
            alert("Maaf, video untuk episod ini tidak tersedia.");
            return;
        }

        const modal = elements.modals.player;
        const content = modal.querySelector('.modal-content');

        content.innerHTML = `
            <span class="close-modal">&times;</span>
            <div class="video-container ambilight-wrapper">
                <div class="ambilight-glow"></div>
                <iframe src="${url}" allowfullscreen allow="autoplay; encrypted-media"></iframe>
            </div>
            <div class="player-info">
                <h3>${state.currentDrama.bookName} - Episod ${index}</h3>
            </div>
        `;

        modal.style.display = 'flex';
        content.querySelector('.close-modal').onclick = () => {
            modal.style.display = 'none';
            content.innerHTML = '';
        };
    };

    // --- Search Handler ---
    const handleSearch = async () => {
        const query = elements.searchInput.value.trim();
        if (!query) {
            switchView('search');
            return;
        }

        showLoader();
        try {
            const results = await API.getSearch(query);
            await switchView('search');
            elements.searchTitle.textContent = `Hasil Pencarian: "${query}"`;

            elements.grids.search.innerHTML = '';
            
            // Defensively handle results. Search API might return suggestions or books.
            // If results contain items that are just strings or don't have bookIds,
            // we might need to handle it differently.
            if (results && results.length > 0) {
                let hasResults = false;
                results.forEach(d => {
                    // Check if it's a valid drama object or needs mapping
                    if (d.bookId || d.id || d.bookName) {
                        elements.grids.search.appendChild(renderDramaCard(d));
                        hasResults = true;
                    }
                });

                if (hasResults) {
                    setTimeout(() => {
                        const target = elements.grids.search.offsetTop - 150;
                        window.scrollTo({ top: target > 0 ? target : 0, behavior: 'smooth' });
                    }, 100);
                } else {
                    elements.grids.search.innerHTML = '<p style="padding: 20px; color: var(--text-dim);">Drama tidak ditemukan.</p>';
                }
            } else {
                elements.grids.search.innerHTML = '<p style="padding: 20px; color: var(--text-dim);">Drama tidak ditemukan.</p>';
            }
        } catch (err) {
            console.error("Search Error:", err);
        } finally {
            hideLoader();
        }
    };

    const handleLiveSearch = debounce(async (query) => {
        if (!query) {
            // Show Trending Topics
            try {
                const popular = await API.getPopularSearch();
                if (popular && popular.length > 0) {
                    elements.suggestions.innerHTML = `
                        <div class="trending-header">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                            Trending Hari Ini
                        </div>
                    ` + popular.slice(0, 6).map(item => `
                        <div class="suggestion-item trending" onclick="elements.searchInput.value='${item.name || item}'; handleSearch();">
                            <div class="suggestion-thumb" style="width: 32px; height: 32px;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </div>
                            <div class="suggestion-info">
                                <div class="suggestion-name">${item.name || item}</div>
                            </div>
                            <span class="trending-badge">Viral 🔥</span>
                        </div>
                    `).join('');
                    elements.suggestions.style.display = 'flex';
                }
            } catch (err) { /* silent */ }
            return;
        }

        if (query.length < 2) {
            elements.suggestions.style.display = 'none';
            return;
        }

        try {
            const results = await API.getSearch(query);
            if (results && results.length > 0) {
                elements.suggestions.innerHTML = results.slice(0, 5).map(d => `
                    <div class="suggestion-item" onclick="app.openDetail('${d.bookId}')">
                        <img src="${d.cover || d.coverWap || d.bookCover}" class="suggestion-thumb">
                        <div class="suggestion-info">
                            <div class="suggestion-name">${d.bookName}</div>
                            <div class="suggestion-meta">${d.chapterCount || d.totalChapter || '?'} Episode</div>
                        </div>
                    </div>
                `).join('');
                elements.suggestions.style.display = 'flex';
            } else {
                elements.suggestions.style.display = 'none';
            }
        } catch (err) {
            elements.suggestions.style.display = 'none';
        }
    }, 300);

    // --- Interaction Listeners ---
    elements.searchBtn.onclick = handleSearch;
    elements.searchInput.oninput = (e) => handleLiveSearch(e.target.value);
    elements.searchInput.onfocus = () => {
        if (elements.searchInput.value.trim() === '') {
            handleLiveSearch(''); // Show trending
        } else if (elements.suggestions.innerHTML && elements.searchInput.value.trim().length >= 2) {
            elements.suggestions.style.display = 'flex';
        }
    };
    
    // Close suggestions on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            elements.suggestions.style.display = 'none';
        }
    });

    elements.searchInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            elements.suggestions.style.display = 'none';
            handleSearch();
        }
    };

    document.querySelectorAll('nav li').forEach(li => {
        li.onclick = () => switchView(li.dataset.section);
    });

    window.onscroll = () => {
        elements.header.classList.toggle('scrolled', window.scrollY > 50);
    };

    window.onclick = (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
            document.body.style.overflow = 'auto';
            if (e.target.id === 'player-modal') e.target.querySelector('.modal-content').innerHTML = '';
        }
    };

    const openReels = async (bookId, initialIndex = 1) => {
        showLoader('reels');
        try {
            // Fetch detail and recommendations in PARALLEL for faster load
            const [drama, recommended] = await Promise.all([
                API.getDetail(bookId),
                API.getRecommended()
            ]);
            if (!drama) throw new Error("Drama not found");

            const dramasToRender = [drama, ...recommended.filter(d => d.bookId !== bookId).slice(0, 5)];

            renderReelsView(dramasToRender, initialIndex);
            switchView('reels');

            // Find and scroll to the specific episode AFTER switchView (when visible)
            const container = document.getElementById('reels-container');
            const firstDramaEl = container.querySelector('.drama-reels');
            if (firstDramaEl) {
                let targetCard = firstDramaEl.querySelector(`.reels-card[data-index="${initialIndex}"]`);
                if (!targetCard) targetCard = firstDramaEl.querySelector('.reels-card');
                
                if (targetCard) {
                    // Use instant scroll for initial load
                    targetCard.scrollIntoView({ behavior: 'instant' });
                }
            }
        } catch (err) {
            console.error("Open Reels Error:", err);
            alert("Gagal memuat pemutar imersif.");
        } finally {
            hideLoader();
        }
    };

    const renderReelsView = (dramas, initialIndex) => {
        const container = document.getElementById('reels-container');
        container.innerHTML = dramas.map(drama => `
            <div class="drama-reels" data-book-id="${drama.bookId}" data-book-name="${drama.bookName.replace(/"/g, '&quot;')}" data-book-cover="${drama.cover || drama.coverWap || drama.bookCover}">
                ${drama.episodes && drama.episodes.length > 0 ? drama.episodes.map(ep => `
                    <div class="reels-card" data-vid="${ep.chapterId}" data-index="${ep.chapterIndex}" data-loaded="false">
                        <div class="reels-video-container">
                            <div class="reels-skeleton">
                                <div class="reels-skeleton-pulse"></div>
                                <div class="reels-skeleton-info">
                                    <div class="skeleton-text" style="width:120px"></div>
                                    <div class="skeleton-text short" style="width:80px"></div>
                                </div>
                            </div>
                        </div>
                        <div class="reels-metadata">
                            <div class="reels-ep-info" onclick="app.openEpPicker('${drama.bookId}', ${ep.chapterIndex})">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                                Episode ${ep.chapterIndex}
                            </div>
                            <h3>${drama.bookName}</h3>
                            <div class="reels-caption-container">
                                <p class="reels-caption">${drama.introduction}</p>
                                ${drama.introduction && drama.introduction.length > 100 ? `<span class="reels-more-btn" onclick="app.toggleReelsCaption(this)">... selengkapnya</span>` : ''}
                            </div>
                        </div>
                        <div class="reels-actions">
                            <div class="action-btn bookmark-action ${isBookmarked(drama.bookId) ? 'active' : ''}" onclick="app.toggleBookmark('${drama.bookId}')">
                                <div class="icon-wrapper">
                                    <svg viewBox="0 0 24 24" fill="${isBookmarked(drama.bookId) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                </div>
                                <span>Bookmark</span>
                            </div>
                            <div class="action-btn" onclick="app.directDownload('${ep.chapterId}')">
                                <div class="icon-wrapper">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                </div>
                                <span>Download</span>
                            </div>
                            <div class="action-btn" onclick="app.toggleShare(true, '${drama.bookId}', ${ep.chapterIndex}, '${drama.bookName.replace(/'/g, "\\'")}')">
                                <div class="icon-wrapper">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="18" cy="5" r="3"></circle>
                                        <circle cx="6" cy="12" r="3"></circle>
                                        <circle cx="18" cy="19" r="3"></circle>
                                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                    </svg>
                                </div>
                                <span>Bagikan</span>
                            </div>
                            <div class="action-btn clear-toggle" onclick="app.toggleClearMode()">
                                <div class="icon-wrapper">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </div>
                                <span>Clear</span>
                            </div>
                        </div>
                    </div>
                `).join('') : `
                    <div class="reels-card">
                        <div class="reels-metadata">
                            <h3>Tidak Ada Episode</h3>
                            <p>Maaf, tidak ada episode tersedia untuk drama ini.</p>
                        </div>
                    </div>
                `}
            </div>
        `).join('');

        setupReelsIntersectionObserver();
    };

    let skipObserver = false; // Guard flag for programmatic scrolls

    const setupReelsIntersectionObserver = () => {
        const options = { 
            root: document.getElementById('reels-view'),
            threshold: 0.6 
        };
        const observer = new IntersectionObserver((entries) => {
            if (skipObserver) return; // Skip during programmatic jumps
            entries.forEach(entry => {
                const card = entry.target;
                if (entry.isIntersecting) {
                    const vid = card.dataset.vid;
                    if (!vid) return;
                    
                    if (card.dataset.loaded === 'false') {
                        loadReelsVideo(card, vid);
                    } else {
                        const video = card.querySelector('video');
                        if (video) {
                            video.play().catch(e => console.warn("Autoplay blocked", e));
                            
                            // Immediately update history on sighting
                            const dramaEl = card.closest('.drama-reels');
                            if (dramaEl) {
                                saveHistory({
                                    bookId: dramaEl.dataset.bookId,
                                    bookName: dramaEl.dataset.bookName,
                                    cover: dramaEl.dataset.bookCover
                                }, parseInt(card.dataset.index));
                            }
                        }
                    }
                } else {
                    const video = card.querySelector('video');
                    if (video) video.pause();
                }
            });
        }, options);
        document.querySelectorAll('.reels-card').forEach(card => observer.observe(card));
    };

    const loadReelsVideo = async (card, videoId) => {
        if (!videoId) return;
        try {
            // Use NEW fast stream API
            const res = await API.request('/api/stream', { videoId });
            if (res && res.data && res.data.playUrl) {
                const container = card.querySelector('.reels-video-container');
                container.innerHTML = `
                    <div class="ambilight-glow"></div>
                    <video playsinline preload="auto">
                        <source src="${res.data.playUrl}" type="video/mp4">
                    </video>
                    <div class="reels-state-indicator"></div>
                `;
                const video = container.querySelector('video');
                const indicator = container.querySelector('.reels-state-indicator');

                const dramaEl = card.closest('.drama-reels');
                const bookId = dramaEl ? dramaEl.dataset.bookId : null;

                // Auto-Play Next Episode
                video.onended = () => {
                    const nextIdx = parseInt(card.dataset.index) + 1;
                    console.log('Auto-playing next episode:', nextIdx);
                    if (bookId) app.jumpToEp(bookId, nextIdx);
                };

                // Save History, Track Progress & Resume Playback
                if (dramaEl) {
                    const dramaData = {
                        bookId: bookId,
                        bookName: dramaEl.dataset.bookName,
                        cover: dramaEl.dataset.bookCover
                    };
                    
                    const epIndex = parseInt(card.dataset.index);

                    // Resume playback logic
                    const historyItem = state.history.find(h => h.bookId === bookId && h.chapterIndex === epIndex);
                    if (historyItem && historyItem.progress > 0 && historyItem.progress < 98) {
                        video.addEventListener('loadedmetadata', () => {
                            const seekTime = (historyItem.progress / 100) * video.duration;
                            video.currentTime = seekTime;
                        });
                    }
                    
                    // Update progress on timeupdate (Throttled for reliability)
                    video.ontimeupdate = throttle(() => {
                        if (video.duration) {
                            const progress = Math.round((video.currentTime / video.duration) * 100);
                            saveHistory(dramaData, epIndex, progress);
                        }
                    }, 3000); // Save every 3 seconds of active play

                    // Immediate save on pause
                    video.onpause = () => {
                        if (video.duration) {
                            const progress = Math.round((video.currentTime / video.duration) * 100);
                            saveHistory(dramaData, epIndex, progress);
                        }
                    };

                    saveHistory(dramaData, epIndex);
                }
                
                // Disable context menu on reels
                container.oncontextmenu = (e) => e.preventDefault();

                // Gesture handling: tap = pause/play, hold = 2x speed
                let holdTimer = null;
                let isHolding = false;
                let justHeld = false; // Prevents click from firing after hold release

                const startHold = (e) => {
                    if (e.target.closest('.reels-actions') || e.target.closest('.reels-metadata')) return;
                    isHolding = false;
                    justHeld = false;
                    holdTimer = setTimeout(() => {
                        isHolding = true;
                        video.playbackRate = 2.0;
                        showStateIcon(indicator, 'speed');
                        let badge = container.querySelector('.reels-speed-badge');
                        if (!badge) {
                            badge = document.createElement('div');
                            badge.className = 'reels-speed-badge';
                            badge.textContent = '2x';
                            container.appendChild(badge);
                        }
                        badge.classList.add('show');
                    }, 300);
                };

                const endHold = () => {
                    clearTimeout(holdTimer);
                    if (isHolding) {
                        video.playbackRate = 1.0;
                        const badge = container.querySelector('.reels-speed-badge');
                        if (badge) badge.classList.remove('show');
                        isHolding = false;
                        justHeld = true;
                        // Reset justHeld after click event has had time to fire
                        setTimeout(() => { justHeld = false; }, 50);
                    }
                };

                const handleTap = (e) => {
                    if (e.target.closest('.reels-actions') || e.target.closest('.reels-metadata')) return;
                    if (justHeld) return; // Was a hold release, skip

                    if (video.paused) {
                        video.play();
                        showStateIcon(indicator, 'play');
                    } else {
                        video.pause();
                        showStateIcon(indicator, 'pause');
                    }
                };

                // Mouse events
                container.addEventListener('mousedown', startHold);
                container.addEventListener('mouseup', endHold);
                container.addEventListener('mouseleave', endHold);
                container.addEventListener('click', handleTap);

                // Touch events
                container.addEventListener('touchstart', startHold, { passive: true });
                container.addEventListener('touchend', endHold);

                // Store video URL for download
                card.dataset.streamUrl = res.data.playUrl;

                video.play().catch(e => console.warn("Initial load play blocked", e));
                card.dataset.loaded = 'true';
            }
        } catch (err) {
            console.error("Fast Load Reels Error:", err);
        }
    };

    const showStateIcon = (container, state) => {
        const icons = {
            play: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>',
            pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>',
            speed: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="13 19 22 12 13 5 13 19"></polygon><polygon points="2 19 11 12 2 5 2 19"></polygon></svg>'
        };
        
        container.innerHTML = icons[state];
        container.classList.remove('show');
        void container.offsetWidth; // Trigger reflow
        container.classList.add('show');
        
        setTimeout(() => {
            container.classList.remove('show');
        }, 800);
    };

    const closeReels = () => {
        // Stop all videos
        document.querySelectorAll('#reels-view video').forEach(v => v.pause());
        if (state.currentDrama) {
            switchView('detail');
        } else {
            switchView('home');
        }
    };

    // --- Sidebar Specific Logic ---
    const isBookmarked = (id) => {
        const bookmarks = JSON.parse(localStorage.getItem('jywa_bookmarks') || '[]');
        return bookmarks.includes(id);
    };

    const toggleBookmark = (id) => {
        let bookmarks = JSON.parse(localStorage.getItem('jywa_bookmarks') || '[]');
        if (bookmarks.includes(id)) {
            bookmarks = bookmarks.filter(b => b !== id);
        } else {
            bookmarks.push(id);
        }
        localStorage.setItem('jywa_bookmarks', JSON.stringify(bookmarks));
        
        const active = isBookmarked(id);
        // Refresh UI icons in reels
        document.querySelectorAll('.drama-reels[data-book-id="'+id+'"] .bookmark-action').forEach(btn => {
            btn.classList.toggle('active', active);
            const svg = btn.querySelector('svg');
            if (svg) svg.setAttribute('fill', active ? 'currentColor' : 'none');
        });

        // Refresh Detail view button if it's the same drama
        const detailBtn = document.querySelector('.detail-bookmark-btn');
        if (detailBtn && state.currentDrama && state.currentDrama.bookId === id) {
            detailBtn.classList.toggle('active', active);
            const svg = detailBtn.querySelector('svg');
            const text = detailBtn.querySelector('span');
            if (svg) svg.setAttribute('fill', active ? 'currentColor' : 'none');
            if (text) text.textContent = active ? 'Tersimpan' : 'Bookmark';
        }
    };

    const directDownload = (videoId) => {
        // Find visible card
        const visibleCard = document.querySelector('.reels-card[data-vid="'+videoId+'"]');
        if (visibleCard && visibleCard.dataset.streamUrl) {
            window.open(visibleCard.dataset.streamUrl, '_blank');
        } else {
            alert("Sedang memuat video, coba lagi dalam sekejap.");
        }
    };

    let shareState = { bookId: null, index: null, title: '' };

    const toggleShare = (show, bookId, index, title) => {
        const popup = document.getElementById('reels-share-popup');
        popup.style.display = show ? 'flex' : 'none';
        if (show) {
            shareState = { bookId, index, title };
            const url = new URL(window.location.origin);
            url.searchParams.set('drama', bookId);
            document.getElementById('share-link-input').value = url.toString();
        }
    };

    const shareCurrent = () => {
        const input = document.getElementById('share-link-input');
        input.select();
        document.execCommand('copy');
        alert("Link berhasil disalin! Silakan bagikan ke teman.");
    };

    const shareToApp = (platform) => {
        const url = new URL(window.location.origin);
        url.searchParams.set('drama', shareState.bookId);
        
        const caption = `Nonton drama seru "${shareState.title}" cuma di JywaNonton! Klik di sini: ${url.toString()}`;
        const encodedText = encodeURIComponent(caption);
        
        let shareUrl = '';
        if (platform === 'whatsapp') {
            shareUrl = `https://wa.me/?text=${encodedText}`;
        } else if (platform === 'telegram') {
            shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url.toString())}&text=${encodedText}`;
        } else if (platform === 'twitter') {
            shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
        }
        
        if (shareUrl) window.open(shareUrl, '_blank');
    };

    // --- Episode Picker ---
    const openEpPicker = (bookId, currentIndex) => {
        const dramaEl = document.querySelector(`.drama-reels[data-book-id="${bookId}"]`);
        if (!dramaEl) return;

        const cards = dramaEl.querySelectorAll('.reels-card[data-index]');
        if (!cards.length) return;

        // Build episode list from DOM
        let epListHTML = '';
        cards.forEach(card => {
            const idx = card.dataset.index;
            const isCurrent = parseInt(idx) === currentIndex;
            epListHTML += `
                <div class="ep-pick-item ${isCurrent ? 'current' : ''}" onclick="app.jumpToEp('${bookId}', ${idx})">
                    <span class="ep-pick-num">${idx}</span>
                    <span class="ep-pick-label">${isCurrent ? 'Sedang Ditonton' : 'Episode ' + idx}</span>
                    ${isCurrent ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>' : ''}
                </div>
            `;
        });

        let popup = document.getElementById('reels-ep-picker');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'reels-ep-picker';
            popup.className = 'reels-popup';
            document.getElementById('reels-view').appendChild(popup);
        }
        popup.innerHTML = `
            <div class="reels-popup-content ep-picker-content">
                <div class="reels-popup-header">
                    <h3>Pilih Episode</h3>
                    <button class="close-popup" onclick="app.closeEpPicker()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div class="ep-picker-list">
                    ${epListHTML}
                </div>
            </div>
        `;
        popup.style.display = 'flex';

        // Scroll to current episode in the list
        setTimeout(() => {
            const currentItem = popup.querySelector('.ep-pick-item.current');
            if (currentItem) currentItem.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 100);
    };

    const closeEpPicker = () => {
        const popup = document.getElementById('reels-ep-picker');
        if (popup) popup.style.display = 'none';
    };

    const toggleReelsCaption = (btn) => {
        const card = btn.closest('.reels-card');
        const isExpanded = card.classList.toggle('caption-expanded');
        btn.textContent = isExpanded ? ' sembunyikan' : '... selengkapnya';
    };

    const jumpToEp = (bookId, targetIndex) => {
        closeEpPicker();
        const dramaEl = document.querySelector(`.drama-reels[data-book-id="${bookId}"]`);
        if (!dramaEl) return;

        // Pause all playing videos first
        dramaEl.querySelectorAll('video').forEach(v => v.pause());

        // Guard the observer during the jump
        skipObserver = true;

        const targetCard = dramaEl.querySelector(`.reels-card[data-index="${targetIndex}"]`);
        if (targetCard) {
            // Use instant scroll to avoid triggering intermediate episodes
            targetCard.scrollIntoView({ behavior: 'instant' });

            // Re-enable observer and manually trigger load for the target
            setTimeout(() => {
                skipObserver = false;
                const vid = targetCard.dataset.vid;
                
                // Immediate manual history sync on jump
                saveHistory({
                    bookId: bookId,
                    bookName: dramaEl.dataset.bookName,
                    cover: dramaEl.dataset.bookCover
                }, targetIndex);

                if (vid && targetCard.dataset.loaded === 'false') {
                    loadReelsVideo(targetCard, vid);
                } else {
                    const video = targetCard.querySelector('video');
                    if (video) video.play().catch(e => console.warn('Autoplay blocked', e));
                }
            }, 100);
        } else {
            skipObserver = false;
        }
    };

    // --- Clear Mode (distraction-free) ---
    const toggleClearMode = () => {
        const reelsView = document.getElementById('reels-view');
        reelsView.classList.toggle('clear-mode');
    };

    // --- Deep Linking Router ---
    const checkDeepLink = () => {
        const params = new URLSearchParams(window.location.search);
        const dramaId = params.get('drama');
        const episodeIdx = params.get('episode');

        if (dramaId) {
            openReels(dramaId, parseInt(episodeIdx) || 1);
            // Clear URL and history so refresh doesn't jump back
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    };

    // Globalize functions for inline onclick
    window.app = {
        playEpisode: (bookId, index) => openReels(bookId, index),
        closeReels,
        switchView,
        playVideo,
        openDetail,
        toggleBookmark,
        directDownload,
        toggleShare,
        shareCurrent,
        shareToApp,
        openEpPicker,
        closeEpPicker,
        jumpToEp,
        toggleClearMode,
        toggleReelsCaption: (btn) => toggleReelsCaption(btn)
    };

    // --- Admin Announcement System ---
    const checkNotice = async () => {
        try {
            const res = await fetch('/notice.json?t=' + Date.now());
            if (!res.ok) return;
            const data = await res.json();

            if (!data || !data.active) return;

            const lastNoticeId = localStorage.getItem('jywa_last_notice');
            const suppressUntil = localStorage.getItem('jywa_notice_suppress');
            const now = Date.now();

            // If it's the same notice and we are still in suppression period, skip
            if (lastNoticeId === data.id && suppressUntil && now < parseInt(suppressUntil)) return;

            // Render Notice
            elements.notice.title.textContent = data.title;
            
            if (data.adminName) {
                elements.notice.admin.textContent = `Oleh: ${data.adminName}`;
                elements.notice.admin.style.display = 'block';
            } else {
                elements.notice.admin.style.display = 'none';
            }

            elements.notice.message.innerHTML = data.message.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            elements.notice.closeBtn.textContent = data.buttonText || 'Siap!';

            elements.notice.closeBtn.onclick = () => {
                localStorage.setItem('jywa_last_notice', data.id);
                
                if (elements.notice.suppressCheckbox.checked) {
                    const suppressTime = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 Days
                    localStorage.setItem('jywa_notice_suppress', suppressTime.toString());
                } else {
                    localStorage.removeItem('jywa_notice_suppress');
                }
                
                elements.notice.modal.style.display = 'none';
            };

            elements.notice.modal.style.display = 'flex';
        } catch (err) {
            console.warn('Failed to check notice:', err);
        }
    };

    // --- Scroll Effects ---
    let lastScrollY = window.scrollY;
    const handleScroll = throttle(() => {
        const currentScrollY = window.scrollY;
        const isScrollingDown = currentScrollY > lastScrollY;
        const isPastThreshold = currentScrollY > 20;

        // "Drip & Float" Logic: Dock when scrolling down, float when scrolling up
        const shouldDock = isScrollingDown && isPastThreshold;

        elements.header.classList.toggle('scrolled', shouldDock);
        
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            bottomNav.classList.toggle('scrolled', shouldDock);
        }

        lastScrollY = currentScrollY;
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });

    // --- Theme Management ---
    const initTheme = () => {
        const savedTheme = localStorage.getItem('jywa_theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        
        setTheme(theme);

        // Sync Splash Screen Logo
        const splashLogo = document.getElementById('splash-logo');
        if (splashLogo) {
            splashLogo.src = theme === 'dark' ? '/img/logo-dark.png' : '/img/logo-light.png';
        }

        // Hide Splash Screen after animation
        const splash = document.getElementById('pwa-splash');
        const loader = document.getElementById('loader');

        if (splash) {
            // Coordinate: Hide loader behind splash to prevent ocular stacking
            if (loader) loader.style.opacity = '0';

            setTimeout(() => {
                splash.classList.add('splash-hidden');
                
                // Once splash is gone, clean up and show loader if needed (or content)
                setTimeout(() => {
                    splash.style.display = 'none';
                    if (loader) {
                        loader.style.opacity = '1'; // Prepare for future transitions
                        loader.style.display = 'none'; // But hide for now as content is ready
                    }
                }, 600);
            }, 2500); 
        }
    };

    const setTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('jywa_theme', theme);
        
        // Swap Logos
        // logo-dark.png is for dark theme (light logo)
        // logo-light.png is for light theme (dark logo)
        if (elements.theme.logo) {
            elements.theme.logo.src = theme === 'dark' ? '/img/logo-dark.png' : '/img/logo-light.png';
        }

        // Toggle SVG visibility is handled by CSS
    };

    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    if (elements.theme.toggle) {
        elements.theme.toggle.addEventListener('click', toggleTheme);
    }

    // --- Launch ---
    initTheme();
    checkNotice();
    checkDeepLink();
    switchView('home');
});
