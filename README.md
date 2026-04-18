# drshyam — Video Platform

A complete, browser-based video streaming platform with real recommendation algorithms, multi-source video support and full UI.

## 📁 File Structure

```
drshyam/
├── index.html          ← Open this in any browser
├── css/
│   └── main.css        ← Complete styles (dark luxury theme)
├── js/
│   ├── data.js         ← All video, channel & comment data
│   ├── algorithms.js   ← All recommendation algorithms
│   └── app.js          ← Full application logic
└── README.md
```

## 🧠 Algorithms Implemented

| Algorithm | Method | Description |
|-----------|--------|-------------|
| **Home Feed** | Collaborative Filtering | Blends personalisation, trending, subscriptions, freshness |
| **Trending** | Wilson Score + Velocity | Statistical like-ratio + views-per-hour + engagement |
| **Search** | TF-IDF + Fuzzy Match | Term frequency-inverse document frequency with Levenshtein typo tolerance |
| **Watch Next** | Content-Based Filtering | Tag Jaccard similarity + channel affinity + trending boost |
| **Shorts Feed** | Engagement × Freshness | Composite score for short-form content |
| **Freshness Decay** | Exponential Decay | e^(-ln2 × age/halfLife) — videos decay in relevance over time |
| **Engagement Score** | Weighted Ratio | Like ratio + comment ratio − dislike penalty |
| **Search Suggestions** | Prefix + Tag Match | Auto-complete from titles and tags |

## 🎬 Supported Video Sources

```js
// YouTube
src: { type: 'youtube', id: 'VIDEO_ID' }

// Google Drive
src: { type: 'drive', id: 'FILE_ID_FROM_DRIVE_URL' }

// Direct MP4 (AWS S3, Firebase, Bunny CDN, etc.)
src: { type: 'direct', url: 'https://yourcdn.com/video.mp4' }

// Vimeo
src: { type: 'vimeo', id: 'VIDEO_ID' }

// Cloudflare Stream
src: { type: 'cloudflare', id: 'STREAM_VIDEO_ID' }
```

## ✨ Features

- 🏠 **Home Feed** — personalised algorithm-driven feed
- 🔥 **Trending** — Wilson score + velocity ranking
- 🔍 **Search** — TF-IDF + fuzzy search with auto-suggest
- ▶️ **Video Player** — multi-source player (YouTube/Drive/Direct/Vimeo/Cloudflare)
- 📡 **Subscriptions** — subscribe/unsubscribe, feed from subscribed channels
- 📚 **Library** — watch history + watch later
- 💬 **Comments** — threaded comments with replies and likes
- 👍 **Likes** — per-video like tracking
- 📺 **Channel Pages** — full channel with sort by latest/popular/oldest
- ⚡ **Shorts** — vertical short-form content grid
- 🔴 **Live** — live video filtering
- 🔖 **Watch Later** — save videos
- 🔔 **Sign In/Up** — localStorage auth (connect Firebase for cloud)
- 📱 **Responsive** — works on mobile, tablet and desktop

## 🚀 Adding Your Own Videos

Open `js/data.js` and add to the `VIDEOS` array:

```js
{
  id: "v25",                          // unique ID
  channelId: "ch1",                   // from CHANNELS array
  title: "My Video Title",
  description: "Full description here",
  thumbnail: "https://your-thumbnail.jpg",
  src: { type: "youtube", id: "YOUR_YOUTUBE_ID" },  // or drive/direct/vimeo
  duration: "12:34",
  views: 10000, likes: 500, dislikes: 20, comments: 150,
  uploadedAt: daysAgo(1),             // or new Date().toISOString()
  tags: ["tag1", "tag2", "tag3"],
  category: "Technology",             // must match CATEGORIES
  isShort: false,                     // true for < 60 second vertical videos
  isLive: false,                      // true for live streams
}
```

## 🔌 Connect Firebase (for real auth + cloud storage)

1. Create Firebase project at firebase.google.com
2. Enable Authentication (Email + Google)
3. Enable Firestore Database
4. Replace `submitAuth()` in `index.html` with Firebase calls
5. Save/load `APP.userState` to Firestore instead of localStorage

## 🌐 Deploy on GitHub Pages

1. Push all files to a GitHub repo (keep the folder structure)
2. Settings → Pages → Branch: main, folder: / (root)
3. Your site: `https://USERNAME.github.io/drshyam/`
