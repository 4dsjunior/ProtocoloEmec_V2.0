// ================================
// SERVER.JS - PADRÃO PRODUÇÃO
// Compatível com VPS Hostinger / EasyPanel
// ================================

require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const NodeCache = require('node-cache');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ================================
// CORS
// ================================
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*'
}));

// ================================
// RATE LIMIT
// ================================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// ================================
// CACHE (EM MEMÓRIA)
// ================================
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// ================================
// BANCO DE DADOS
// ================================
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('Banco conectado com sucesso');
  } catch (err) {
    console.error('Erro ao conectar no banco:', err);
    process.exit(1);
  }
})();

// ================================
// SWAGGER
// ================================
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Funcionários',
      version: '1.0.0'
    }
  },
  apis: [__filename]
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ================================
// STATIC FILES
// ================================
app.use(express.static(path.join(__dirname, 'public')));

// ================================
// ROUTES
// ================================

/**
 * @swagger
 * /search-employees:
 *   get:
 *     summary: Busca funcionários
 *     parameters:
 *       - in: query
 *         name: term
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de funcionários
 */
app.get('/search-employees', async (req, res, next) => {
  const searchTerm = req.query.term;
  if (!searchTerm || searchTerm.length < 1) return res.json([]);

  const cacheKey = `search:${searchTerm}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

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

    cache.set(cacheKey, rows);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ================================
// ERROR HANDLER
// ================================
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// ================================
// SERVER START
// ================================
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Swagger: /docs`);
});

// ================================
// GRACEFUL SHUTDOWN
// ================================
process.on('SIGTERM', async () => {
  console.log('Encerrando servidor...');
  await pool.end();
  process.exit(0);
});
