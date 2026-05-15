/* Servidor local simples para o Taskly Health.
   Nao usa banco de dados. Apenas entrega os arquivos do app. */
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..');

app.use(express.static(ROOT));

app.get('*', (_req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Taskly Health local rodando em http://localhost:${PORT}`);
});
