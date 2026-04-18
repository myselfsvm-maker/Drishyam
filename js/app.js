// ============================================================
//  drshyam — MAIN APPLICATION
// ============================================================

/* ── STATE ────────────────────────────────────────────────── */
const APP = {
  view: 'home',
  currentVideoId: null,
  currentCategory: 'all',
  searchQuery: '',
  sidebarOpen: false,
  userState: loadUserState(),
};

function loadUserState() {
  try {
    return JSON.parse(localStorage.getItem('ds_user')) || {
      loggedIn: false,
      name: 'Guest',
      avatar: 'G',
      color: '#FF6B35',
      subscriptions: [],
      watchHistory: [],
      likedVideos: [],
      savedVideos: [],
      watchLater: [],
      notifications: [],
    };
  } catch { return defaultUserState(); }
}

function defaultUserState() {
  return { loggedIn:false, name:'Guest', avatar:'G', color:'#FF6B35',
    subscriptions:[], watchHistory:[], likedVideos:[], savedVideos:[],
    watchLater:[], notifications:[] };
}

function saveUserState() {
  localStorage.setItem('ds_user', JSON.stringify(APP.userState));
}

/* ── HELPERS ──────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function getChannel(id)  { return CHANNELS.find(c => c.id === id) || CHANNELS[0]; }
function getVideo(id)    { return VIDEOS.find(v => v.id === id); }
function avatarHTML(ch, size=36) {
  return `<div class="avatar" style="width:${size}px;height:${size}px;font-size:${size*.36}px;background:${ch.color}">${ch.avatar}</div>`;
}
function userAvatarHTML(size=36) {
  const u = APP.userState;
  return `<div class="avatar" style="width:${size}px;height:${size}px;font-size:${size*.36}px;background:${u.color}">${u.avatar}</div>`;
}

/* ── ROUTING ──────────────────────────────────────────────── */
function navigate(view, param) {
  APP.view = view;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  if (view === 'home') {
    $('page-home').classList.add('active');
    document.querySelector('.nav-link[data-view="home"]')?.classList.add('active');
    renderHomeFeed();
  } else if (view === 'watch') {
    APP.currentVideoId = param;
    $('page-watch').classList.add('active');
    renderWatchPage(param);
    addToHistory(param);
  } else if (view === 'search') {
    APP.searchQuery = param;
    $('page-search').classList.add('active');
    renderSearchResults(param);
  } else if (view === 'channel') {
    $('page-channel').classList.add('active');
    renderChannelPage(param);
  } else if (view === 'shorts') {
    document.querySelector('.nav-link[data-view="shorts"]')?.classList.add('active');
    $('page-home').classList.add('active');
    renderShortsSection();
  } else if (view === 'trending') {
    document.querySelector('.nav-link[data-view="trending"]')?.classList.add('active');
    $('page-home').classList.add('active');
    renderTrendingPage();
  } else if (view === 'library') {
    document.querySelector('.nav-link[data-view="library"]')?.classList.add('active');
    $('page-home').classList.add('active');
    renderLibraryPage();
  } else if (view === 'subscriptions') {
    document.querySelector('.nav-link[data-view="subscriptions"]')?.classList.add('active');
    $('page-home').classList.add('active');
    renderSubscriptionsPage();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── WATCH HISTORY ────────────────────────────────────────── */
function addToHistory(videoId) {
  const h = APP.userState.watchHistory;
  const existing = h.findIndex(x => x.videoId === videoId);
  if (existing !== -1) h.splice(existing, 1);
  h.unshift({ videoId, watchedAt: new Date().toISOString() });
  if (h.length > 200) h.pop();
  saveUserState();
}

/* ── VIDEO CARD ───────────────────────────────────────────── */
function videoCard(video, opts = {}) {
  const ch    = getChannel(video.channelId);
  const { compact = false, horizontal = false } = opts;

  if (horizontal) {
    return `
      <div class="video-card video-card--horizontal" onclick="navigate('watch','${video.id}')">
        <div class="vc-thumb-wrap vc-thumb-wrap--sm">
          <img class="vc-thumb" src="${video.thumbnail}" alt="${esc(video.title)}" loading="lazy" onerror="this.src='https://picsum.photos/seed/${video.id}/640/360'">
          <span class="vc-duration ${video.isLive?'live':''}">${video.duration}</span>
          ${video.isShort?'<span class="vc-short-badge">⚡ Short</span>':''}
        </div>
        <div class="vc-info">
          <div class="vc-title-sm">${esc(video.title)}</div>
          <div class="vc-meta-sm">${esc(ch.name)} • ${ALGO.formatViews(video.views)} views</div>
          <div class="vc-time-sm">${ALGO.formatRelativeTime(video.uploadedAt)}</div>
        </div>
      </div>`;
  }

  if (compact) {
    return `
      <div class="video-card video-card--compact" onclick="navigate('watch','${video.id}')">
        <div class="vc-thumb-wrap vc-thumb-wrap--compact">
          <img class="vc-thumb" src="${video.thumbnail}" alt="${esc(video.title)}" loading="lazy" onerror="this.src='https://picsum.photos/seed/${video.id}/640/360'">
          <span class="vc-duration ${video.isLive?'live':''}">${video.duration}</span>
        </div>
        <div class="vc-info">
          <div class="vc-title-sm">${esc(video.title)}</div>
          <div class="vc-meta-sm">${esc(ch.name)} ${ch.verified?'<span class="verified">✓</span>':''}</div>
          <div class="vc-meta-sm">${ALGO.formatViews(video.views)} views • ${ALGO.formatRelativeTime(video.uploadedAt)}</div>
        </div>
      </div>`;
  }

  return `
    <div class="video-card" onclick="navigate('watch','${video.id}')">
      <div class="vc-thumb-wrap">
        <img class="vc-thumb" src="${video.thumbnail}" alt="${esc(video.title)}" loading="lazy"
          onerror="this.src='https://picsum.photos/seed/${video.id}/640/360'">
        <span class="vc-duration ${video.isLive?'live':''}">${video.isLive?'● LIVE':video.duration}</span>
        ${video.isShort?'<span class="vc-short-badge">⚡ Short</span>':''}
        <div class="vc-overlay">
          <button class="vc-save" onclick="event.stopPropagation();toggleWatchLater('${video.id}')" title="Save">
            ${APP.userState.watchLater.includes(video.id)?'🔖':'🔖'}
          </button>
        </div>
      </div>
      <div class="vc-body">
        <div class="vc-avatar" onclick="event.stopPropagation();navigate('channel','${ch.id}')">
          ${avatarHTML(ch, 36)}
        </div>
        <div class="vc-info">
          <div class="vc-title" title="${esc(video.title)}">${esc(video.title)}</div>
          <div class="vc-channel" onclick="event.stopPropagation();navigate('channel','${ch.id}')">
            ${esc(ch.name)} ${ch.verified?'<span class="verified">✓</span>':''}
          </div>
          <div class="vc-meta">
            ${ALGO.formatViews(video.views)} views • ${ALGO.formatRelativeTime(video.uploadedAt)}
          </div>
        </div>
      </div>
    </div>`;
}

/* ── HOME FEED ────────────────────────────────────────────── */
function renderHomeFeed() {
  const main = $('main-content');
  const feed = ALGO.homeFeed(VIDEOS, APP.userState);
  const categoryFilter = APP.currentCategory;
  const filtered = categoryFilter === 'all' ? feed
    : ALGO.categoryFeed(categoryFilter, VIDEOS);

  main.innerHTML = `
    <div class="category-bar" id="category-bar"></div>
    <div class="video-grid" id="video-grid">
      ${filtered.map(v => videoCard(v)).join('')}
    </div>`;

  renderCategoryBar();
}

function renderCategoryBar() {
  const bar = $('category-bar');
  if (!bar) return;
  bar.innerHTML = CATEGORIES.map(cat => `
    <button class="cat-chip ${APP.currentCategory === cat.id ? 'active' : ''}"
      onclick="selectCategory('${cat.id}')">
      ${cat.icon} ${cat.label}
    </button>`).join('');
}

function selectCategory(id) {
  APP.currentCategory = id;
  if (id === 'Shorts') { renderShortsSection(); return; }
  if (id === 'Live')   {
    const live = VIDEOS.filter(v => v.isLive);
    $('main-content').innerHTML = `
      <div class="category-bar" id="category-bar"></div>
      <div class="section-label">🔴 Live Now</div>
      <div class="video-grid">${live.map(v => videoCard(v)).join('')}</div>`;
    renderCategoryBar();
    return;
  }
  renderHomeFeed();
}

/* ── SHORTS SECTION ───────────────────────────────────────── */
function renderShortsSection() {
  const shorts = ALGO.shortsFeed(VIDEOS);
  $('main-content').innerHTML = `
    <div class="category-bar" id="category-bar"></div>
    <div class="section-label">⚡ Shorts</div>
    <div class="shorts-grid">
      ${shorts.map(v => `
        <div class="short-card" onclick="navigate('watch','${v.id}')">
          <img src="${v.thumbnail}" alt="${esc(v.title)}" loading="lazy" onerror="this.src='https://picsum.photos/seed/${v.id}/360/640'">
          <div class="short-overlay">
            <div class="short-title">${esc(v.title)}</div>
            <div class="short-meta">${ALGO.formatViews(v.views)} views</div>
          </div>
          <span class="vc-duration live" style="position:absolute;top:8px;right:8px;">⚡ Short</span>
        </div>`).join('')}
    </div>`;
  renderCategoryBar();
}

/* ── TRENDING ─────────────────────────────────────────────── */
function renderTrendingPage() {
  const trending = ALGO.trending(VIDEOS);
  $('main-content').innerHTML = `
    <div class="category-bar" id="category-bar"></div>
    <div class="section-label">🔥 Trending Now</div>
    <div class="video-grid">
      ${trending.map((v,i) => `
        <div style="position:relative">
          <div class="trend-badge">#${i+1}</div>
          ${videoCard(v)}
        </div>`).join('')}
    </div>`;
  renderCategoryBar();
}

/* ── LIBRARY ──────────────────────────────────────────────── */
function renderLibraryPage() {
  const history = APP.userState.watchHistory.slice(0, 20)
    .map(h => getVideo(h.videoId)).filter(Boolean);
  const saved = APP.userState.watchLater.map(id => getVideo(id)).filter(Boolean);

  $('main-content').innerHTML = `
    <div class="section-label">📚 Your Library</div>
    ${!APP.userState.loggedIn ? `<div class="empty-state">
      <div class="empty-icon">🔒</div>
      <div class="empty-msg">Sign in to see your library</div>
      <button class="btn-primary" onclick="openAuth()">Sign In</button>
    </div>` : `
    <div class="library-section">
      <div class="library-title">Watch Later (${saved.length})</div>
      <div class="video-grid">
        ${saved.length ? saved.map(v => videoCard(v)).join('') : '<div class="empty-inline">No saved videos yet</div>'}
      </div>
    </div>
    <div class="library-section">
      <div class="library-title">Watch History (${history.length})</div>
      <div class="video-grid">
        ${history.length ? history.map(v => videoCard(v)).join('') : '<div class="empty-inline">No watch history yet</div>'}
      </div>
    </div>`}`;
}

/* ── SUBSCRIPTIONS ────────────────────────────────────────── */
function renderSubscriptionsPage() {
  const subs = APP.userState.subscriptions;
  const subVideos = VIDEOS
    .filter(v => subs.includes(v.channelId))
    .sort((a,b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    .slice(0, 24);

  $('main-content').innerHTML = `
    <div class="section-label">🔔 Subscriptions</div>
    ${!APP.userState.loggedIn ? `<div class="empty-state">
      <div class="empty-icon">🔒</div>
      <div class="empty-msg">Sign in to see subscriptions</div>
      <button class="btn-primary" onclick="openAuth()">Sign In</button>
    </div>` : subs.length === 0 ? `<div class="empty-state">
      <div class="empty-icon">📡</div>
      <div class="empty-msg">Subscribe to channels to see their latest videos here</div>
    </div>` : `
    <div class="sub-channels-strip">
      ${subs.map(id => { const ch = getChannel(id); return `
        <div class="sub-chip" onclick="navigate('channel','${ch.id}')">
          ${avatarHTML(ch, 48)}
          <span class="sub-chip-name">${esc(ch.name)}</span>
        </div>`; }).join('')}
    </div>
    <div class="video-grid">
      ${subVideos.map(v => videoCard(v)).join('')}
    </div>`}`;
}

/* ── SEARCH PAGE ──────────────────────────────────────────── */
function renderSearchResults(query) {
  const results = ALGO.search(query, VIDEOS, { limit: 30 });
  $('search-input').value = query;
  $('page-search').innerHTML = `
    <div class="search-header">
      <span class="search-count">${results.length} results for "<strong>${esc(query)}</strong>"</span>
      <div class="search-filters">
        <button class="filter-btn active">Relevance</button>
        <button class="filter-btn" onclick="renderSearchResults('${esc(query)}')">Upload date</button>
        <button class="filter-btn">View count</button>
      </div>
    </div>
    <div class="search-results">
      ${results.length ? results.map(v => videoCard(v, {horizontal:true})).join('')
        : `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-msg">No results for "${esc(query)}"</div></div>`}
    </div>`;
}

/* ── WATCH PAGE ───────────────────────────────────────────── */
function renderWatchPage(videoId) {
  const video  = getVideo(videoId);
  if (!video) { navigate('home'); return; }
  const ch     = getChannel(video.channelId);
  const isLiked = APP.userState.likedVideos.includes(videoId);
  const isSub   = APP.userState.subscriptions.includes(video.channelId);
  const related = ALGO.watchNext(video, VIDEOS, APP.userState);
  const comments = SAMPLE_COMMENTS[videoId] || [];

  $('page-watch').innerHTML = `
    <div class="watch-layout">
      <!-- Player column -->
      <div class="watch-main">
        <!-- Video player -->
        <div class="player-wrap" id="player-wrap">
          ${buildPlayer(video)}
        </div>

        <!-- Video info -->
        <div class="watch-info">
          <h1 class="watch-title">${esc(video.title)}</h1>
          <div class="watch-actions-row">
            <div class="watch-channel-info" onclick="navigate('channel','${ch.id}')">
              ${avatarHTML(ch, 44)}
              <div>
                <div class="watch-channel-name">${esc(ch.name)} ${ch.verified?'<span class="verified">✓</span>':''}</div>
                <div class="watch-sub-count">${ALGO.formatViews(ch.subscribers)} subscribers</div>
              </div>
            </div>
            <div class="watch-btns">
              <button class="sub-btn ${isSub?'subbed':''}" onclick="toggleSubscribe('${ch.id}',this)">
                ${isSub?'✓ Subscribed':'Subscribe'}
              </button>
            </div>
          </div>
          <!-- Like / Dislike / Share / Save -->
          <div class="action-chips">
            <button class="action-chip ${isLiked?'active':''}" id="like-btn" onclick="toggleLike('${videoId}',this)">
              👍 <span id="like-count">${ALGO.formatViews(video.likes)}</span>
            </button>
            <button class="action-chip" onclick="showToast('Dislike noted')">👎</button>
            <button class="action-chip" onclick="shareVideo('${videoId}')">📤 Share</button>
            <button class="action-chip" onclick="toggleWatchLater('${videoId}');showToast('Saved to Watch Later')">
              🔖 Save
            </button>
            <button class="action-chip" onclick="showToast('Report submitted')">⋯ More</button>
          </div>
          <!-- Description -->
          <div class="watch-desc-box" id="desc-box">
            <div class="watch-desc-meta">
              ${ALGO.formatViews(video.views)} views • ${ALGO.formatRelativeTime(video.uploadedAt)}
            </div>
            <div class="watch-desc-text" id="desc-text">${esc(video.description||'').replace(/\n/g,'<br>')}</div>
            <button class="desc-toggle" onclick="toggleDesc()">Show less</button>
          </div>
        </div>

        <!-- Comments -->
        <div class="comments-section">
          <div class="comments-header">
            <span class="comments-count">${ALGO.formatViews(video.comments)} Comments</span>
            <button class="sort-btn">↕ Sort by Top</button>
          </div>
          <!-- Comment input -->
          <div class="comment-input-row">
            ${userAvatarHTML(40)}
            <div class="comment-input-wrap">
              <input class="comment-input" placeholder="Add a comment…" id="comment-input"
                onclick="if(!APP.userState.loggedIn){openAuth()}"
                onkeydown="if(event.key==='Enter')submitComment('${videoId}')">
              <div class="comment-submit-row" id="comment-actions" style="display:none">
                <button class="btn-ghost" onclick="cancelComment()">Cancel</button>
                <button class="btn-primary-sm" onclick="submitComment('${videoId}')">Comment</button>
              </div>
            </div>
          </div>
          <div id="comments-list">
            ${renderComments(comments)}
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="watch-sidebar">
        <div class="sidebar-title">Up next</div>
        ${related.map(v => videoCard(v, {compact:true})).join('')}
      </div>
    </div>`;

  // Show comment actions on focus
  const ci = $('comment-input');
  if (ci) {
    ci.addEventListener('focus', () => {
      $('comment-actions').style.display = 'flex';
    });
  }
}

function buildPlayer(video) {
  const { type, id, url } = video.src || {};
  if (type === 'youtube') {
    return `<iframe class="player-iframe" id="player-iframe"
      src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1"
      frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"
      allowfullscreen title="${esc(video.title)}"></iframe>`;
  }
  if (type === 'drive') {
    return `<iframe class="player-iframe" id="player-iframe"
      src="https://drive.google.com/file/d/${id}/preview"
      frameborder="0" allow="autoplay" allowfullscreen title="${esc(video.title)}"></iframe>`;
  }
  if (type === 'vimeo') {
    return `<iframe class="player-iframe" id="player-iframe"
      src="https://player.vimeo.com/video/${id}?autoplay=1"
      frameborder="0" allow="autoplay;fullscreen;picture-in-picture"
      allowfullscreen title="${esc(video.title)}"></iframe>`;
  }
  if (type === 'cloudflare') {
    return `<iframe class="player-iframe" id="player-iframe"
      src="https://iframe.cloudflarestream.com/${id}?autoplay=true"
      frameborder="0" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
      allowfullscreen title="${esc(video.title)}"></iframe>`;
  }
  if (type === 'direct') {
    return `<video class="player-video" id="player-video" controls autoplay>
      <source src="${url}" type="video/mp4">
      Your browser does not support HTML5 video.
    </video>`;
  }
  return `<div class="player-error">❌ Unknown video source type: "${type}"</div>`;
}

function toggleDesc() {
  const dt  = $('desc-text');
  const btn = document.querySelector('.desc-toggle');
  if (!dt || !btn) return;
  dt.classList.toggle('collapsed');
  btn.textContent = dt.classList.contains('collapsed') ? 'Show more' : 'Show less';
}

/* ── COMMENTS ─────────────────────────────────────────────── */
function renderComments(comments) {
  if (!comments.length) return '<div class="no-comments">Be the first to comment!</div>';
  return comments.map(c => `
    <div class="comment">
      <div class="comment-avatar" style="background:${c.color}">${c.avatar}</div>
      <div class="comment-body">
        <div class="comment-header">
          <span class="comment-name">${esc(c.name)}</span>
          <span class="comment-time">${ALGO.formatRelativeTime(c.time)}</span>
        </div>
        <div class="comment-text">${esc(c.text)}</div>
        <div class="comment-actions">
          <button class="comment-like" onclick="likeComment(this,${c.likes})">👍 ${ALGO.formatViews(c.likes)}</button>
          <button class="comment-reply-btn">Reply</button>
        </div>
        ${c.replies && c.replies.length ? `
          <div class="replies">
            ${c.replies.map(r => `
              <div class="comment reply">
                <div class="comment-avatar" style="background:${r.color};width:28px;height:28px;font-size:10px">${r.avatar}</div>
                <div class="comment-body">
                  <div class="comment-header">
                    <span class="comment-name">${esc(r.name)}</span>
                    <span class="comment-time">${ALGO.formatRelativeTime(r.time)}</span>
                  </div>
                  <div class="comment-text">${esc(r.text)}</div>
                  <div class="comment-actions">
                    <button class="comment-like" onclick="likeComment(this,${r.likes})">👍 ${ALGO.formatViews(r.likes)}</button>
                  </div>
                </div>
              </div>`).join('')}
          </div>` : ''}
      </div>
    </div>`).join('');
}

function submitComment(videoId) {
  if (!APP.userState.loggedIn) { openAuth(); return; }
  const input = $('comment-input');
  const text  = input?.value?.trim();
  if (!text) return;
  const u = APP.userState;
  const newComment = {
    id: 'c_' + Date.now(), avatar: u.avatar, color: u.color,
    name: u.name, time: new Date().toISOString(), text, likes: 0, replies: []
  };
  const cl = $('comments-list');
  if (cl) cl.insertAdjacentHTML('afterbegin', renderComments([newComment]));
  input.value = '';
  $('comment-actions').style.display = 'none';
  showToast('Comment posted!');
}

function cancelComment() {
  const ci = $('comment-input');
  if (ci) ci.value = '';
  const ca = $('comment-actions');
  if (ca) ca.style.display = 'none';
}

function likeComment(btn, base) {
  btn.classList.toggle('liked');
  const liked = btn.classList.contains('liked');
  btn.innerHTML = `👍 ${ALGO.formatViews(base + (liked ? 1 : 0))}`;
}

/* ── CHANNEL PAGE ─────────────────────────────────────────── */
function renderChannelPage(channelId) {
  const ch      = getChannel(channelId);
  const videos  = ALGO.channelVideos(channelId, VIDEOS, 'latest');
  const isSub   = APP.userState.subscriptions.includes(channelId);

  $('page-channel').innerHTML = `
    <div class="channel-banner" style="background:linear-gradient(135deg,${ch.color}22,${ch.color}44)">
      <div class="channel-banner-inner">
        ${avatarHTML(ch, 80)}
        <div class="channel-meta">
          <div class="channel-page-name">${esc(ch.name)} ${ch.verified?'<span class="verified">✓</span>':''}</div>
          <div class="channel-page-handle">${esc(ch.handle)}</div>
          <div class="channel-page-stats">${ALGO.formatViews(ch.subscribers)} subscribers • ${videos.length} videos</div>
          <div class="channel-page-desc">${esc(ch.description||'')}</div>
        </div>
        <button class="sub-btn channel-sub-btn ${isSub?'subbed':''}" onclick="toggleSubscribe('${channelId}',this)">
          ${isSub?'✓ Subscribed':'Subscribe'}
        </button>
      </div>
    </div>
    <div class="channel-tabs">
      <button class="ch-tab active">Videos</button>
      <button class="ch-tab">About</button>
    </div>
    <div class="channel-sort">
      <button class="sort-chip active" onclick="sortChannelVideos('${channelId}','latest',this)">Latest</button>
      <button class="sort-chip" onclick="sortChannelVideos('${channelId}','popular',this)">Popular</button>
      <button class="sort-chip" onclick="sortChannelVideos('${channelId}','oldest',this)">Oldest</button>
    </div>
    <div class="video-grid" id="channel-video-grid">
      ${videos.map(v => videoCard(v)).join('')}
    </div>`;
}

function sortChannelVideos(channelId, sort, btn) {
  document.querySelectorAll('.sort-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const sorted = ALGO.channelVideos(channelId, VIDEOS, sort);
  const grid = $('channel-video-grid');
  if (grid) grid.innerHTML = sorted.map(v => videoCard(v)).join('');
}

/* ── ACTIONS ──────────────────────────────────────────────── */
function toggleSubscribe(channelId, btn) {
  if (!APP.userState.loggedIn) { openAuth(); return; }
  const subs = APP.userState.subscriptions;
  const idx  = subs.indexOf(channelId);
  if (idx === -1) {
    subs.push(channelId);
    btn.textContent = '✓ Subscribed';
    btn.classList.add('subbed');
    showToast('Subscribed! 🔔');
  } else {
    subs.splice(idx, 1);
    btn.textContent = 'Subscribe';
    btn.classList.remove('subbed');
    showToast('Unsubscribed');
  }
  saveUserState();
}

function toggleLike(videoId, btn) {
  if (!APP.userState.loggedIn) { openAuth(); return; }
  const liked = APP.userState.likedVideos;
  const video = getVideo(videoId);
  const idx   = liked.indexOf(videoId);
  const lc    = $('like-count');
  if (idx === -1) {
    liked.push(videoId);
    btn.classList.add('active');
    if (lc && video) lc.textContent = ALGO.formatViews(video.likes + 1);
    showToast('Liked! 👍');
  } else {
    liked.splice(idx, 1);
    btn.classList.remove('active');
    if (lc && video) lc.textContent = ALGO.formatViews(video.likes);
  }
  saveUserState();
}

function toggleWatchLater(videoId) {
  if (!APP.userState.loggedIn) { openAuth(); return; }
  const wl  = APP.userState.watchLater;
  const idx = wl.indexOf(videoId);
  if (idx === -1) { wl.push(videoId); showToast('Saved to Watch Later 🔖'); }
  else            { wl.splice(idx, 1); showToast('Removed from Watch Later'); }
  saveUserState();
}

function shareVideo(videoId) {
  const url = window.location.href.split('?')[0] + '?v=' + videoId;
  navigator.clipboard?.writeText(url).then(() => showToast('Link copied! 🔗'));
}

/* ── SEARCH ───────────────────────────────────────────────── */
function handleSearch(e) {
  if (e.key === 'Enter') {
    const q = $('search-input').value.trim();
    if (q) navigate('search', q);
    hideSuggestions();
  } else {
    showSuggestions($('search-input').value);
  }
}

function showSuggestions(query) {
  const box  = $('suggestions-box');
  if (!box) return;
  if (query.length < 2) { box.style.display = 'none'; return; }
  const sugs = ALGO.suggestions(query, VIDEOS);
  if (!sugs.length) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  box.innerHTML = sugs.map(s => `
    <div class="suggestion" onclick="navigate('search','${esc(s.text)}');hideSuggestions()">
      ${s.icon} ${esc(s.text)}
    </div>`).join('');
}

function hideSuggestions() {
  const box = $('suggestions-box');
  if (box) setTimeout(() => box.style.display = 'none', 150);
}

/* ── AUTH MODAL ───────────────────────────────────────────── */
function openAuth() {
  $('auth-modal').classList.add('open');
}

function closeAuth() {
  $('auth-modal').classList.remove('open');
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.auth-panel').forEach(p => p.classList.toggle('active', p.id === 'auth-' + tab));
}

function submitAuth() {
  const tab = document.querySelector('.auth-tab-btn.active')?.dataset.tab;
  const email = $('auth-email')?.value?.trim();
  const name  = $('auth-name')?.value?.trim() || email?.split('@')[0] || 'User';
  const pass  = $('auth-pass')?.value;

  if (!email || !pass) { showToast('Please fill in all fields'); return; }
  if (pass.length < 6) { showToast('Password must be at least 6 characters'); return; }

  // Simulate auth (replace with Firebase for real auth)
  const colors = ['#FF6B35','#00D4FF','#22C55E','#A855F7','#F59E0B','#EF4444','#06B6D4'];
  APP.userState.loggedIn = true;
  APP.userState.name     = tab === 'signup' ? name : email.split('@')[0];
  APP.userState.avatar   = APP.userState.name.slice(0,2).toUpperCase();
  APP.userState.color    = colors[Math.floor(Math.random() * colors.length)];
  saveUserState();
  updateHeaderUser();
  closeAuth();
  showToast(`Welcome, ${APP.userState.name}! 🎉`);
}

function signOut() {
  APP.userState = defaultUserState();
  saveUserState();
  updateHeaderUser();
  showToast('Signed out. See you soon!');
  closeUserMenu();
}

function updateHeaderUser() {
  const u = APP.userState;
  const btn = $('user-btn');
  if (!btn) return;
  if (u.loggedIn) {
    btn.innerHTML = `<div class="avatar header-avatar" style="background:${u.color}">${u.avatar}</div>`;
    btn.onclick = toggleUserMenu;
  } else {
    btn.innerHTML = `<button class="sign-in-btn" onclick="openAuth()">Sign in</button>`;
    btn.onclick = null;
  }
}

function toggleUserMenu() {
  const menu = $('user-menu');
  if (!menu) return;
  menu.classList.toggle('open');
}

function closeUserMenu() {
  $('user-menu')?.classList.remove('open');
}

/* ── SIDEBAR ──────────────────────────────────────────────── */
function toggleSidebar() {
  APP.sidebarOpen = !APP.sidebarOpen;
  $('sidebar').classList.toggle('open', APP.sidebarOpen);
  $('sidebar-overlay').classList.toggle('open', APP.sidebarOpen);
}

function closeSidebar() {
  APP.sidebarOpen = false;
  $('sidebar').classList.remove('open');
  $('sidebar-overlay').classList.remove('open');
}

/* ── TOAST ────────────────────────────────────────────────── */
function showToast(msg) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ── INIT ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderUser();
  navigate('home');

  // Handle URL param ?v=videoId
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('v')) navigate('watch', urlParams.get('v'));

  // Click outside to close menus
  document.addEventListener('click', e => {
    if (!e.target.closest('#user-btn') && !e.target.closest('#user-menu')) closeUserMenu();
    if (!e.target.closest('.search-wrap')) hideSuggestions();
  });
});
