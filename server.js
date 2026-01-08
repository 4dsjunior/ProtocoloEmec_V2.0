// ================================
// SERVER.JS - PADRÃO PRODUÇÃO
// ================================

const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();
// O Easypanel geralmente usa a porta 3000 ou a definida no painel
const PORT = Number(process.env.PORT) || 3000;

// Configuração de CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*'
}));

// Banco de Dados
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Teste de conexão persistente
pool.query('SELECT 1')
  .then(() => console.log('Banco conectado com sucesso'))
  .catch(err => {
    console.error('Erro fatal ao conectar no banco:', err);
    process.exit(1);
  });

// Servir arquivos estáticos diretamente da RAIZ (onde seu index.html está)
app.use(express.static(path.join(__dirname)));

// Rotas de API
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

// Rota de Health Check para o Easypanel
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Rota para garantir que o index.html seja entregue na raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicialização do Servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Encerramento Gracioso
process.on('SIGTERM', async () => {
  console.log('Sinal SIGTERM recebido. Encerrando...');
  await pool.end();
  process.exit(0);
});
