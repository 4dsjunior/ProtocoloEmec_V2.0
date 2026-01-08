const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Configuração do Banco
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }
});

// Serve arquivos da raiz
app.use(express.static(__dirname));

app.get('/search-employees', async (req, res) => {
  const searchTerm = req.query.term;
  if (!searchTerm) return res.json([]);

  try {
    // IMPORTANTE: Aspas duplas em tudo para evitar Erro 500 no Postgres
    const query = `
      SELECT 
        "numemp", 
        "numcad", 
        "nomfun"
      FROM public."Ffuncionarios"
      WHERE 
        CAST("numcad" AS TEXT) ILIKE $1
        OR CAST("numemp" AS TEXT) ILIKE $1
        OR "nomfun" ILIKE $1
      ORDER BY "nomfun"
      LIMIT 20
    `;
    
    const { rows } = await pool.query(query, [`%${searchTerm}%`]);
    res.json(rows);
  } catch (err) {
    console.error('Erro no Banco:', err.message);
    res.status(500).send(err.message);
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
