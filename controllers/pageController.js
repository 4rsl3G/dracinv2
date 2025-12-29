const CacheService = require('../services/cacheService');
const { v4: uuidv4 } = require('uuid');

exports.renderHome = async (req, res) => {
  try {
    const lang = req.query.lang || 'en';
    // Server-side fetch for SEO
    const homeData = await CacheService.getOrFetch('home', { endpoint: 'home', lang });
    
    // Process data for UI (Hero + categorized rows)
    const hero = homeData.length > 0 ? homeData[0] : null;
    const shuffled = [...homeData].sort(() => 0.5 - Math.random());
    
    res.render('home', {
      title: 'Netflix Pro - Stream Endless',
      hero: hero,
      trending: homeData.slice(0, 10),
      topPicks: shuffled.slice(0, 10),
      lang: lang
    });
  } catch (err) {
    res.render('home', { title: 'Error', hero: null, trending: [], topPicks: [], lang: 'en' });
  }
};

exports.renderSearch = (req, res) => {
  res.render('home', { 
    title: 'Search - Netflix Pro', 
    hero: null, 
    trending: [], 
    topPicks: [],
    searchMode: true,
    lang: req.query.lang || 'en'
  });
};

exports.renderWatch = async (req, res) => {
  const { code, ep } = req.params;
  const lang = req.query.lang || 'en';
  
  // Create client ID if not exists
  let clientId = req.cookies.client_id;
  if (!clientId) {
    clientId = uuidv4();
    res.cookie('client_id', clientId, { maxAge: 31536000000, httpOnly: false });
  }

  try {
    // Fetch details for metadata
    // Ideally we fetch title details, but we only have home/episodes endpoint.
    // We assume FE will fetch play URL via AJAX to handle expiration/tokens
    const episodes = await CacheService.getOrFetch('episodes', { endpoint: 'episodes', code, lang });
    
    res.render('watch', {
      title: `Watching ${code} - Ep ${ep}`,
      code,
      ep,
      lang,
      episodes,
      layout: 'layout' 
    });
  } catch (err) {
    res.status(404).send("Title not found");
  }
};
