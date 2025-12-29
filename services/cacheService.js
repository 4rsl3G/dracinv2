const axios = require('axios');
const { CacheEntry, Title, Episode, Sequelize } = require('../models');
const moment = require('moment');

const BASE_URL = process.env.API_BASE_URL;

class CacheService {
  
  static async getOrFetch(endpointKey, params, ttlOverride = null) {
    const { endpoint, lang = 'en', query = null, code = null, ep = null } = params;
    
    // Generate unique key
    const cacheKey = `${endpoint}:${lang}:${code || ''}:${ep || ''}:${query || ''}`;

    // 1. Check DB Cache
    const cached = await CacheEntry.findOne({ where: { cache_key: cacheKey } });

    if (cached) {
      const now = moment();
      const expiry = moment(cached.expires_at);
      if (expiry.isAfter(now)) {
        return JSON.parse(cached.payload_json);
      }
      // If expired, delete and refetch (below)
      await cached.destroy();
    }

    // 2. Fetch Upstream
    let apiUrl = `${BASE_URL}/${endpoint}`;
    // Construct Query Params
    const queryParams = new URLSearchParams();
    if(lang) queryParams.append('lang', lang);
    if(query) queryParams.append('q', query);
    if(ep) queryParams.append('ep', ep);
    
    // Handle path parameters (episodes/code, play/code)
    if (endpoint === 'episodes' || endpoint === 'play') {
      apiUrl = `${BASE_URL}/${endpoint}/${code}`;
    }

    const fullUrl = `${apiUrl}?${queryParams.toString()}`;
    
    try {
      console.log(`[UPSTREAM] Fetching: ${fullUrl}`);
      const response = await axios.get(fullUrl);
      const data = response.data;

      // 3. Determine TTL
      let ttl = 600; // Default 10 min
      if (endpoint === 'languages') ttl = 604800; // 7 days
      if (endpoint === 'home') ttl = 600;
      if (endpoint === 'search') ttl = 300;
      if (endpoint === 'episodes') ttl = 1800;
      
      // Special logic for PLAY endpoint (use API ttl)
      if (endpoint === 'play' && data.ttl) {
        ttl = parseInt(data.ttl);
      } else if (ttlOverride) {
        ttl = ttlOverride;
      }

      // 4. Save to CacheEntry
      const expiresAt = moment().add(ttl, 'seconds').toDate();
      await CacheEntry.create({
        cache_key: cacheKey,
        endpoint,
        lang,
        query,
        code,
        ep,
        payload_json: JSON.stringify(data),
        ttl_seconds: ttl,
        expires_at: expiresAt
      });

      // 5. Side Effects (Data Mirroring)
      this.handleSideEffects(endpoint, data, lang, code);

      return data;
    } catch (error) {
      console.error('Upstream Fetch Error:', error.message);
      // Fallback: If expired cache exists, return it anyway? (Optional robustness)
      throw error; 
    }
  }

  static async handleSideEffects(endpoint, data, lang, code) {
    try {
      // Mirror Home Data
      if (endpoint === 'home' && Array.isArray(data)) {
        for (const item of data) {
          await Title.upsert({
            code: item.code || item.id,
            name: item.name,
            cover_url: item.cover_url,
            episodes_total: item.episodes_total || 0,
            lang: lang,
            last_synced_at: new Date()
          });
        }
      }

      // Mirror Episodes
      if (endpoint === 'episodes' && Array.isArray(data)) {
        // Clear existing for this code/lang to avoid dupes
        await Episode.destroy({ where: { code, lang } });
        const episodesToInsert = data.map(e => ({
          code,
          episode_number: e.episode_number || e.ep,
          locked: e.locked || false,
          lang
        }));
        await Episode.bulkCreate(episodesToInsert);
        
        // Update Title count if possible
        if (episodesToInsert.length > 0) {
           await Title.update({ episodes_total: episodesToInsert.length }, { where: { code }});
        }
      }
    } catch (e) {
      console.error('Side Effect Error:', e);
    }
  }
}

module.exports = CacheService;
