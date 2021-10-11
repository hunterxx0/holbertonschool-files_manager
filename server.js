const express = require('express');
// const router = require('./routes/index');

const port = process.env.PORT || 5000;

const app = express();

app.listen(port);

// app.use('/status', router);
// app.use('/stats', router);

module.exports = app;
