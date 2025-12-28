const router = require('express').Router();
const ctrl = require('../controllers/mainController');

router.get('/', ctrl.home);
router.get('/series/:id', ctrl.detail);
router.get('/watch/:id/:epId', ctrl.player);
router.get('/search', ctrl.search);
router.get('/browse', ctrl.category);

router.get('*', (req, res) => {
    if(req.xhr) return res.status(404).send('Not Found');
    res.status(404).render('pages/404', { layout: false });
});

module.exports = router;
