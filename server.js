require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const db = require('./models');

const apiController = require('./controllers/apiController');
const pageController = require('./controllers/pageController');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security Headers (relaxed for CDN scripts)
app.use(helmet({
  contentSecurityPolicy: false, 
  crossOriginEmbedderPolicy: false
}));

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// Security
app.use(xss());
app.use(hpp());
app.use(cors());

// View Engine
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// Static
app.use(express.static(path.join(__dirname, 'public')));

// --- ROUTES ---

// Pages
app.get('/', pageController.renderHome);
app.get('/search', pageController.renderSearch);
app.get('/watch/:code/:ep', pageController.renderWatch);

// API
app.get('/api/languages', apiController.getLanguages);
app.get('/api/home', apiLimiter, apiController.getHome);
app.get('/api/search', apiLimiter, apiController.getSearch);
app.get('/api/episodes/:code', apiLimiter, apiController.getEpisodes);
app.get('/api/play/:code', apiLimiter, apiController.getPlay);
app.post('/api/history', apiController.saveHistory);
app.get('/api/history', apiController.getContinueWatching);

// Error Handling
app.use(errorHandler);

// Start
const PORT = process.env.PORT || 3000;
db.sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
