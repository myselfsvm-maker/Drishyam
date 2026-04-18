// ============================================================
//  drshyam — ALGORITHMS ENGINE
//  1. Recommendation Algorithm (collaborative + content-based)
//  2. Trending Algorithm (Wilson score + velocity + engagement)
//  3. Search Algorithm (TF-IDF + fuzzy match + ranking)
//  4. Home Feed Algorithm (personalised blend)
//  5. Watch Next Algorithm (related videos)
//  6. Engagement Scoring
//  7. Freshness Decay
// ============================================================

const ALGO = (() => {

  /* ── 1. ENGAGEMENT SCORE ─────────────────────────────────
     Measures how engaging a video is relative to its view count.
     High like ratio + high comment ratio = high engagement.          */
  function engagementScore(video) {
    const v = video.views || 1;
    const likeRatio    = (video.likes    || 0) / v;
    const commentRatio = (video.comments || 0) / v;
    const dislikeRatio = (video.dislikes || 0) / v;
    // Weighted sum — comments worth more (active engagement)
    return (likeRatio * 0.5) + (commentRatio * 2.0) - (dislikeRatio * 0.3);
  }

  /* ── 2. FRESHNESS DECAY ──────────────────────────────────
     Videos decay in freshness over time using exponential decay.
     Half-life: ~7 days for normal, 1 day for live/shorts.            */
  function freshnessScore(video) {
    const ageMs    = Date.now() - new Date(video.uploadedAt).getTime();
    const ageDays  = ageMs / 864e5;
    const halfLife = video.isLive ? 0.5 : video.isShort ? 1 : 7;
    return Math.exp(-0.693 * ageDays / halfLife);  // e^(-ln2 * age/halfLife)
  }

  /* ── 3. WILSON SCORE (Trending) ──────────────────────────
     Statistical lower bound of the true like ratio.
     Better than raw like ratio for small vs large sample sizes.       */
  function wilsonScore(video) {
    const n = video.likes + video.dislikes;
    if (n === 0) return 0;
    const p  = video.likes / n;
    const z  = 1.96;   // 95% confidence
    const left  = p + (z * z) / (2 * n);
    const right = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
    const under = 1 + (z * z) / n;
    return (left - right) / under;
  }

  /* ── 4. VELOCITY SCORE (Trending) ────────────────────────
     Views-per-hour in the last 24 hours, approximated from
     total views relative to video age. Newer = higher velocity.       */
  function velocityScore(video) {
    const ageDays  = Math.max(0.01, (Date.now() - new Date(video.uploadedAt).getTime()) / 864e5);
    const ageHours = ageDays * 24;
    return (video.views / ageHours);
  }

  /* ── 5. TRENDING ALGORITHM ───────────────────────────────
     Composite score:  40% Wilson score
                       35% velocity (views/hour)
                       25% engagement                                   */
  function trendingScore(video) {
    const ws = wilsonScore(video);
    const vs = Math.log10(velocityScore(video) + 1) / 7;   // normalise
    const es = engagementScore(video) * 10;                 // normalise
    return (ws * 0.40) + (vs * 0.35) + (es * 0.25);
  }

  /* ── 6. CONTENT-BASED SIMILARITY ────────────────────────
     Jaccard similarity between two tag sets.                          */
  function tagSimilarity(tagsA, tagsB) {
    const setA = new Set((tagsA || []).map(t => t.toLowerCase()));
    const setB = new Set((tagsB || []).map(t => t.toLowerCase()));
    const inter = [...setA].filter(t => setB.has(t)).length;
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 0 : inter / union;
  }

  /* ── 7. TF-IDF SEARCH ────────────────────────────────────
     Term Frequency–Inverse Document Frequency search ranking.
     More relevant term → higher score.                                */
  function buildSearchIndex(videos) {
    const docs = videos.map(v =>
      `${v.title} ${v.title} ${(v.tags||[]).join(' ')} ${v.description||''} ${v.category||''}`
        .toLowerCase()
    );
    // IDF
    const allTerms = {};
    docs.forEach(doc => {
      new Set(doc.split(/\s+/)).forEach(term => {
        allTerms[term] = (allTerms[term] || 0) + 1;
      });
    });
    const N = docs.length;
    const idf = {};
    Object.entries(allTerms).forEach(([t, df]) => {
      idf[t] = Math.log((N + 1) / (df + 1)) + 1;
    });
    return { docs, idf };
  }

  function tfidfScore(query, doc, idf) {
    const qTerms = query.toLowerCase().split(/\s+/);
    const words  = doc.split(/\s+/);
    const tf = {};
    words.forEach(w => { tf[w] = (tf[w] || 0) + 1; });
    let score = 0;
    qTerms.forEach(term => {
      const freq  = tf[term] || 0;
      const tfVal = freq / (words.length + 1);
      const idfV  = idf[term] || 0.1;
      score += tfVal * idfV;
    });
    return score;
  }

  /* ── 8. FUZZY MATCH ─────────────────────────────────────
     Levenshtein distance for typo tolerance.                          */
  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({length:m+1}, (_,i) => Array.from({length:n+1},(_,j) => j === 0 ? i : 0));
    for (let j = 1; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1]
          : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    return dp[m][n];
  }

  function fuzzyMatch(query, text) {
    const q = query.toLowerCase(), t = text.toLowerCase();
    if (t.includes(q)) return 1.0;
    // Check word-level fuzzy
    const qWords = q.split(' ');
    const tWords = t.split(' ');
    let totalSim = 0;
    qWords.forEach(qw => {
      const bestDist = Math.min(...tWords.map(tw => levenshtein(qw, tw)));
      const maxLen   = Math.max(qw.length, 1);
      totalSim += Math.max(0, 1 - bestDist / maxLen);
    });
    return totalSim / qWords.length;
  }

  /* ── PUBLIC API ──────────────────────────────────────────── */
  return {

    /* ── SEARCH ───────────────────────────────────────────── */
    search(query, videos, opts = {}) {
      if (!query.trim()) return [];
      const { limit = 20, category = null } = opts;
      const pool = category && category !== 'all'
        ? videos.filter(v => v.category === category || (category === 'Shorts' && v.isShort) || (category === 'Live' && v.isLive))
        : videos;

      const { docs, idf } = buildSearchIndex(pool);
      const q = query.trim();

      return pool
        .map((video, i) => {
          const tfidf  = tfidfScore(q, docs[i], idf);
          const fuzzy  = fuzzyMatch(q, video.title) * 0.4;
          const pop    = Math.log10(video.views + 1) / 8;
          const fresh  = freshnessScore(video) * 0.1;
          const score  = tfidf * 0.5 + fuzzy * 0.3 + pop * 0.15 + fresh * 0.05;
          return { video, score };
        })
        .filter(x => x.score > 0.01)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(x => x.video);
    },

    /* ── TRENDING ─────────────────────────────────────────── */
    trending(videos, opts = {}) {
      const { limit = 20, category = null } = opts;
      const pool = category && category !== 'all'
        ? videos.filter(v => v.category === category)
        : videos;
      return [...pool]
        .map(v => ({ video: v, score: trendingScore(v) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(x => x.video);
    },

    /* ── HOME FEED (Personalised) ────────────────────────────
       Blends: 40% personalised, 30% trending, 20% diverse categories,
               10% fresh uploads.                                       */
    homeFeed(videos, userState, opts = {}) {
      const { limit = 24 } = opts;
      const history = userState.watchHistory || [];
      const subscribed = userState.subscriptions || [];
      const watchedIds = new Set(history.map(h => h.videoId));

      // Score each video
      const scored = videos.map(v => {
        let score = 0;

        // Freshness
        score += freshnessScore(v) * 20;

        // Engagement quality
        score += engagementScore(v) * 50;

        // Subscribed channel boost
        if (subscribed.includes(v.channelId)) score += 30;

        // Personalisation: match tags of watched videos
        if (history.length > 0) {
          const recentWatched = history.slice(-10);
          const recentVideos  = recentWatched
            .map(h => videos.find(vv => vv.id === h.videoId))
            .filter(Boolean);
          const avgTagSim = recentVideos.reduce((sum, rv) => {
            return sum + tagSimilarity(v.tags, rv.tags);
          }, 0) / Math.max(recentVideos.length, 1);
          score += avgTagSim * 40;

          // Category affinity
          const catCounts = {};
          recentVideos.forEach(rv => { catCounts[rv.category] = (catCounts[rv.category]||0)+1; });
          const catBoost = (catCounts[v.category] || 0) / recentVideos.length;
          score += catBoost * 25;
        }

        // Penalise already-watched
        if (watchedIds.has(v.id)) score -= 60;

        // Views popularity signal
        score += Math.log10(v.views + 1) * 3;

        // Random noise for diversity (±5%)
        score += (Math.random() - 0.5) * 10;

        return { video: v, score };
      });

      return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(x => x.video);
    },

    /* ── WATCH NEXT ──────────────────────────────────────────
       Content-based filtering + channel affinity + trending boost.   */
    watchNext(currentVideo, videos, userState, opts = {}) {
      const { limit = 15 } = opts;
      const subscribed = userState.subscriptions || [];

      return videos
        .filter(v => v.id !== currentVideo.id)
        .map(v => {
          const tagSim   = tagSimilarity(currentVideo.tags, v.tags);
          const sameCat  = v.category === currentVideo.category ? 0.3 : 0;
          const sameChan = v.channelId === currentVideo.channelId ? 0.2 : 0;
          const subBoost = subscribed.includes(v.channelId) ? 0.15 : 0;
          const trending = trendingScore(v) * 0.2;
          const popLog   = Math.log10(v.views + 1) / 10;
          const score    = tagSim * 0.4 + sameCat + sameChan + subBoost + trending + popLog;
          return { video: v, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(x => x.video);
    },

    /* ── SHORTS FEED ─────────────────────────────────────────
       Sort shorts by engagement × freshness.                          */
    shortsFeed(videos, opts = {}) {
      const { limit = 20 } = opts;
      return videos
        .filter(v => v.isShort)
        .map(v => ({ video: v, score: engagementScore(v) * 0.6 + freshnessScore(v) * 0.4 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(x => x.video);
    },

    /* ── SEARCH SUGGESTIONS ──────────────────────────────────
       Auto-complete suggestions from titles + tags.                   */
    suggestions(query, videos) {
      if (query.length < 2) return [];
      const q = query.toLowerCase();
      const seen = new Set();
      const results = [];
      // Exact prefix match on title first
      videos.forEach(v => {
        const t = v.title.toLowerCase();
        if (t.includes(q) && !seen.has(v.title)) {
          seen.add(v.title);
          results.push({ text: v.title, type: 'video', icon: '🎬' });
        }
      });
      // Tag matches
      videos.forEach(v => {
        (v.tags || []).forEach(tag => {
          if (tag.toLowerCase().includes(q) && !seen.has(tag)) {
            seen.add(tag);
            results.push({ text: tag, type: 'tag', icon: '🔖' });
          }
        });
      });
      return results.slice(0, 8);
    },

    /* ── CATEGORY RANKING ────────────────────────────────────
       Best videos per category for browse page.                       */
    categoryFeed(category, videos, opts = {}) {
      const { limit = 16 } = opts;
      let pool;
      if (category === 'Shorts') pool = videos.filter(v => v.isShort);
      else if (category === 'Live') pool = videos.filter(v => v.isLive);
      else if (category === 'all') pool = videos;
      else pool = videos.filter(v => v.category === category);

      return pool
        .map(v => ({ video: v, score: trendingScore(v) + freshnessScore(v) * 0.3 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(x => x.video);
    },

    /* ── CHANNEL VIDEOS ──────────────────────────────────────
       All videos from a channel, sorted by upload date.              */
    channelVideos(channelId, videos, sort = 'latest') {
      const pool = videos.filter(v => v.channelId === channelId);
      if (sort === 'popular') return [...pool].sort((a,b) => b.views - a.views);
      if (sort === 'oldest')  return [...pool].sort((a,b) => new Date(a.uploadedAt)-new Date(b.uploadedAt));
      return [...pool].sort((a,b) => new Date(b.uploadedAt)-new Date(a.uploadedAt));
    },

    /* ── FORMATTERS ──────────────────────────────────────────  */
    formatViews(n) {
      if (n >= 1e9) return (n/1e9).toFixed(1)+'B';
      if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
      if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
      return n.toString();
    },

    formatRelativeTime(isoString) {
      const diff = Date.now() - new Date(isoString).getTime();
      const m = diff/60000, h = m/60, d = h/24, mo = d/30, y = d/365;
      if (y  >= 1) return Math.floor(y)  + ' year'   + (Math.floor(y)  > 1 ? 's' : '') + ' ago';
      if (mo >= 1) return Math.floor(mo) + ' month'  + (Math.floor(mo) > 1 ? 's' : '') + ' ago';
      if (d  >= 1) return Math.floor(d)  + ' day'    + (Math.floor(d)  > 1 ? 's' : '') + ' ago';
      if (h  >= 1) return Math.floor(h)  + ' hour'   + (Math.floor(h)  > 1 ? 's' : '') + ' ago';
      if (m  >= 1) return Math.floor(m)  + ' minute' + (Math.floor(m)  > 1 ? 's' : '') + ' ago';
      return 'just now';
    },
  };
})();
