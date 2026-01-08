const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*'
}));

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Teste de conexão
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('Banco conectado com sucesso');
  } catch (err) {
    console.error('Erro ao conectar no banco:', err);
    process.exit(1);
  }
})();

// CORREÇÃO: Serve arquivos da raiz para evitar o erro "Cannot GET /"
app.use(express.static(__dirname));

app.get('/search-employees', async (req, res) => {
  const searchTerm = req.query.term;
  if (!searchTerm || searchTerm.length < 1) return res.json([]);

  try {
    const { rows } = await pool.query({
      text: `
        SELECT 
          COALESCE(numemp, 0) AS numemp,
          COALESCE(numcad, 0) AS numcad,
          COALESCE(nomfun, '') AS nomfun
        FROM public."Ffuncionarios"
        WHERE 
          CAST(numcad AS TEXT) ILIKE $1
          OR CAST(numemp AS TEXT) ILIKE $1
          OR nomfun ILIKE $1
        ORDER BY nomfun
        LIMIT 20
      `,
      values: [`%${searchTerm}%`]
    });
    res.json(rows);
  } catch (err) {
    console.error('Erro na busca:', err);
    res.status(500).json({ error: 'Erro ao buscar funcionários' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Garante que o index.html seja carregado na raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

process.on('SIGTERM', async () => {
  console.log('Encerrando servidor...');
  await pool.end();
  process.exit(0);
});
