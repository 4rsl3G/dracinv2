require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const compression = require('compression');
const expressLayouts = require('express-ejs-layouts');

// Performance Middleware
app.use(compression());
app.use(express.static('src/public', { maxAge: '1d' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// View Engine
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// Routes
app.use('/', require('./routes/index'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`\x1b[36m[CINEMABOX]\x1b[0m Ready on http://localhost:${PORT}`));
