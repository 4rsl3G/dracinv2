const axios = require('axios');
const cache = require('../utils/cache');

const BASE_URL = process.env.API_BASE_URL || 'https://dramabox-api-rho.vercel.app';

const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        'User-Agent': 'CinemaBox-Elite/2.0',
        'Accept': 'application/json'
    }
});

// --- DATA NORMALIZER (Standard Vercel Structure) ---
const normalizeBook = (item) => {
    if (!item) return null;
    return {
        id: item.bookId || item.id,
        title: item.bookName || item.title || 'Untitled',
        cover: item.coverWap || item.cover || 'https://via.placeholder.com/300x450?text=No+Image',
        intro: item.introduction || 'No synopsis available.',
        tags: item.tags || [],
        episodes: item.chapterCount || 0,
        year: item.shelfTime ? new Date(item.shelfTime).getFullYear() : '2024',
        rating: '9.8'
    };
};

const getCached = async (key, fetchFn) => {
    const cached = cache.get(key);
    if (cached) return cached;
    try {
        const { data } = await fetchFn();
        // API Vercel biasanya membungkus respon sukses dengan { success: true, data: ... }
        if (data) {
            cache.set(key, data);
            return data;
        }
        return null;
    } catch (e) {
        console.error(`[API ERROR] ${key}:`, e.message);
        return null;
    }
};

module.exports = {
    // Endpoint Home Standard
    getHomeData: () => getCached('home_vip', async () => await apiClient.get('/api/vip')),

    // Endpoint Search (Vercel biasanya support ?q=)
    getSearch: (q) => getCached(`search_${q}`, async () => await apiClient.get(`/api/search?q=${encodeURIComponent(q)}`)),

    // Endpoint Detail
    getDetail: (id) => getCached(`detail_${id}`, async () => await apiClient.get(`/api/detail/${id}/v2`)),

    // Endpoint Chapter List
    getChapters: (id) => getCached(`chapters_${id}`, async () => await apiClient.get(`/api/chapters/${id}`)),

    // Extractor Video
    extractVideo: (chapter) => {
        if (!chapter) return null;
        
        // Cek struktur cdnList (Standard Dramabox)
        if (chapter.cdnList && chapter.cdnList.length > 0) {
            const cdn = chapter.cdnList.find(c => c.isDefault) || chapter.cdnList[0];
            if (cdn && cdn.videoPathList) {
                // Cari kualitas terbaik
                const best = cdn.videoPathList.find(v => v.quality === 1080) || 
                             cdn.videoPathList.find(v => v.quality === 720) || 
                             cdn.videoPathList[0];
                if (best) return best.videoPath;
            }
        }
        // Fallback
        return chapter.videoPath || null;
    },

    normalizeBook
};
