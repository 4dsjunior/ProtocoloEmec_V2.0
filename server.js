const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();
const corsOptions = {
    origin: ['https://4dsjunior.github.io', 'http://localhost:3000']
};
app.use(cors(corsOptions));
const port = process.env.PORT || 3000;

// Configuração do Banco de Dados
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Testa a conexão ao iniciar
pool.connect((err, client, release) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.stack);
    } else {
        console.log('Conexão com o banco de dados estabelecida com sucesso!');
        release();
    }
});

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Endpoint de Busca
app.get('/search-employees', async (req, res) => {
    const searchTerm = req.query.term;

    if (!searchTerm || searchTerm.length < 1) {
        return res.json([]);
    }

    try {
        // Query corrigida com tratamento adequado
        const query = {
            text: `
                SELECT 
                    COALESCE(numemp, 0) as numemp,
                    COALESCE(numcad, 0) as numcad,
                    COALESCE(nomfun, '') as nomfun
                FROM public."Ffuncionarios" 
                WHERE 
                    CAST(numcad AS TEXT) ILIKE $1
                    OR CAST(numemp AS TEXT) ILIKE $1
                    OR LOWER(nomfun) LIKE LOWER($1)
                ORDER BY nomfun
                LIMIT 20
            `,
            values: [`%${searchTerm}%`]
        };

        const { rows } = await pool.query(query);
        
        console.log(`Busca por "${searchTerm}": ${rows.length} resultados encontrados`);
        res.json(rows);

    } catch (error) {
        console.error('Erro ao executar a query:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ 
            error: 'Erro ao buscar funcionários',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log(`Endpoint de busca: http://localhost:${port}/search-employees`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM recebido, encerrando servidor...');
    pool.end(() => {
        console.log('Pool de conexões encerrado');
        process.exit(0);
    });
});
