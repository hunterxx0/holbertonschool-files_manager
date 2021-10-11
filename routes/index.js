const app = require('../server');
const AppController = require('../controllers/AppController');

app.get('/status', AppController.getStatus);
app.get('/stats', AppController.getStats);
