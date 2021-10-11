const express = require('express');
const AppController = require('../controllers/AppController');

const exp = express();


exp.get('/status', AppController.getStatus);
exp.get('/stats', AppController.getStats);

module.exports = exp;
