const CacheService = require('../services/cacheService');
const { WatchHistory } = require('../models');

exports.getLanguages = async (req, res, next) => {
  try {
    const data = await CacheService.getOrFetch('languages', {});
    res.json(data);
  } catch (err) { next(err); }
};

exports.getHome = async (req, res, next) => {
  try {
    const lang = req.query.lang || 'en';
    const data = await CacheService.getOrFetch('home', { endpoint: 'home', lang });
    res.json(data);
  } catch (err) { next(err); }
};

exports.getSearch = async (req, res, next) => {
  try {
    const { q, lang } = req.query;
    if (!q) return res.json([]);
    const data = await CacheService.getOrFetch('search', { endpoint: 'search', lang: lang || 'en', query: q });
    res.json(data);
  } catch (err) { next(err); }
};

exports.getEpisodes = async (req, res, next) => {
  try {
    const { code } = req.params;
    const lang = req.query.lang || 'en';
    const data = await CacheService.getOrFetch('episodes', { endpoint: 'episodes', code, lang });
    res.json(data);
  } catch (err) { next(err); }
};

exports.getPlay = async (req, res, next) => {
  try {
    const { code } = req.params;
    const ep = req.query.ep || 1;
    const lang = req.query.lang || 'en';
    
    const data = await CacheService.getOrFetch('play', { endpoint: 'play', code, ep, lang });
    res.json(data);
  } catch (err) { next(err); }
};

exports.saveHistory = async (req, res, next) => {
  try {
    const { client_id, code, ep, position, duration } = req.body;
    if(!client_id || !code) return res.status(400).send('Missing ID');

    await WatchHistory.upsert({
      client_id,
      code,
      episode_number: ep,
      position_seconds: Math.floor(position),
      duration_seconds: Math.floor(duration),
      updated_at: new Date()
    });
    
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.getContinueWatching = async (req, res, next) => {
  try {
    const clientId = req.cookies.client_id || req.query.client_id;
    if(!clientId) return res.json([]);

    const history = await WatchHistory.findAll({
      where: { client_id: clientId },
      order: [['updated_at', 'DESC']],
      limit: 10,
      raw: true
    });
    
    // In a real app, join with Titles table to get images/names
    // Here we return raw history
    res.json(history);
  } catch (err) { next(err); }
};
