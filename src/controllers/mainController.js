const service = require('../services/dramabox.service');

const render = (req, res, view, data) => {
    const isXhr = req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest';
    res.render(view, { ...data, layout: isXhr ? false : 'layout' });
};

exports.home = async (req, res) => {
    const raw = await service.getHomeData();
    let hero = null;
    let collections = [];

    if (raw?.data?.data?.columnVoList) {
        const list = raw.data.data.columnVoList;
        
        // Extract Hero (First item of first list)
        if (list.length > 0 && list[0].bookList.length > 0) {
            hero = service.normalizeBook(list[0].bookList[0]);
        }

        // Process Collections
        collections = list.map(col => ({
            title: col.title,
            items: (col.bookList || []).map(b => service.normalizeBook(b))
        })).filter(c => c.items.length > 0);
    }

    render(req, res, 'pages/home', { title: 'Home', hero, collections });
};

exports.detail = async (req, res) => {
    const { id } = req.params;
    const [detailRes, chapterRes] = await Promise.all([
        service.getDetail(id),
        service.getChapters(id)
    ]);

    if (!detailRes?.data?.data?.drama) return res.status(404).render('pages/404', { layout: false });

    const drama = service.normalizeBook(detailRes.data.data.drama);
    // Use chapter list from either source
    const rawChapters = detailRes.data.data.chapters || chapterRes?.data || [];
    
    const chapters = rawChapters.map(c => ({
        id: c.chapterId || c.id,
        index: c.index !== undefined ? c.index + 1 : (c.chapterIndex || 0) + 1,
        title: c.chapterName || `Episode ${c.index + 1}`,
        vip: c.isVipEquity === 1
    }));

    render(req, res, 'pages/detail', { title: drama.title, series: drama, chapters });
};

exports.player = async (req, res) => {
    const { id, epId } = req.params;
    const chapterRes = await service.getChapters(id);
    const detailRes = await service.getDetail(id);

    if (!chapterRes?.data) return res.redirect(`/series/${id}`);

    const allEps = chapterRes.data;
    const currentEp = allEps.find(c => c.chapterId == epId) || allEps[0];
    const currentIdx = allEps.indexOf(currentEp);
    const nextEp = (currentIdx !== -1 && currentIdx < allEps.length - 1) ? allEps[currentIdx + 1] : null;

    render(req, res, 'pages/player', {
        title: `Playing: ${detailRes?.data?.data?.drama?.bookName}`,
        streamUrl: service.extractVideo(currentEp),
        series: service.normalizeBook(detailRes?.data?.data?.drama),
        current: {
            id: currentEp.chapterId,
            name: currentEp.chapterName || `Episode ${currentIdx + 1}`,
            index: currentIdx + 1
        },
        next: nextEp ? { id: nextEp.chapterId } : null
    });
};

exports.search = async (req, res) => {
    const { q } = req.query;
    let results = [];
    if (q) {
        const raw = await service.getSearch(q);
        if (raw?.data) {
            // Adjust based on actual search response structure. Assuming array of books.
            const list = Array.isArray(raw.data) ? raw.data : (raw.data.list || []);
            results = list.map(b => service.normalizeBook(b));
        }
    }
    render(req, res, 'pages/search', { title: 'Search', query: q, results });
};

exports.category = async (req, res) => {
    // Placeholder logic for category page reusing home data for demo
    const raw = await service.getHomeData();
    let items = [];
    if (raw?.data?.data?.columnVoList) {
        raw.data.data.columnVoList.forEach(col => {
            if(col.bookList) items.push(...col.bookList.map(b => service.normalizeBook(b)));
        });
    }
    // Shuffle for variety
    items = items.sort(() => 0.5 - Math.random()).slice(0, 20);
    render(req, res, 'pages/category', { title: 'Browse All', items });
};
