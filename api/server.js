const app = require('../app'); // Importa tu archivo app.js

module.exports = (req, res) => {
  const server = app;
  server(req, res);
};
