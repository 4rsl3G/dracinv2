const axios = require('axios');
const cache = require('../utils/cache');

const BASE_URL = process.env.API_BASE_URL || 'https://dramabox-api-rho.vercel.app';
const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: { 'User-Agent': 'CinemaBox-Elite/2.0' }
});

// --- DATA NORMALIZATION ---
const normalizeBook = (item) => {
    if (!item) return null;
    return {
        id: item.bookId || item.id,
        title: item.bookName || item.title || 'Untitled Title',
        cover: item.coverWap || item.cover || 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=No+Cover',
        intro: item.introduction || 'No synopsis available for this title.',
        tags: item.tags || ['Drama'],
        episodes: item.chapterCount || 0,
        year: item.shelfTime ? new Date(item.shelfTime).getFullYear() : '2025',
        rating: '98% Match' // Synthetic for UI
    };
};

// --- CACHING WRAPPER ---
const getCached = async (key, fetchFn) => {
    const cached = cache.get(key);
    if (cached) return cached;
    try {
        const { data } = await fetchFn();
        if (data && data.success) {
            cache.set(key, data);
            return data;
        }
        return null;
    } catch (e) {
        console.error(`[API FAIL] ${key}: ${e.message}`);
        return null;
    }
};

module.exports = {
    // Fetches VIP/Home data and structures it for the UI
    getHomeData: () => getCached('home_feed', async () => await apiClient.get('/api/vip')),

    getSearch: (q) => getCached(`search_${q}`, async () => await apiClient.get(`/api/search?q=${q}`)),

    getDetail: (id) => getCached(`detail_${id}`, async () => await apiClient.get(`/api/detail/${id}/v2`)),

    getChapters: (id) => getCached(`chapters_${id}`, async () => await apiClient.get(`/api/chapters/${id}`)),

    // Intelligent Video URL Extractor
    extractVideo: (chapter) => {
        if (!chapter) return null;
        
        // Strategy: 1080p -> 720p -> 540p -> Default -> Fallback
        if (chapter.cdnList && chapter.cdnList.length > 0) {
            const cdn = chapter.cdnList.find(c => c.isDefault) || chapter.cdnList[0];
            if (cdn && cdn.videoPathList) {
                const best = cdn.videoPathList.find(v => v.quality === 1080) ||
                             cdn.videoPathList.find(v => v.quality === 720) ||
                             cdn.videoPathList[0];
                if (best) return best.videoPath;
            }
        }
        return chapter.videoPath || null;
    },

    normalizeBook
};
