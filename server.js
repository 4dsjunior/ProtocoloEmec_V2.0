require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors'); // Importa o pacote cors

const app = express();
const corsOptions = {
    origin: 'https://4dsjunior.github.io' // Allow requests from your GitHub Pages site
};
app.use(cors(corsOptions));
const port = process.env.PORT || 3000;

// --- Configuração do Banco de Dados ---
// As credenciais agora são lidas das variáveis de ambiente
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Middleware para servir arquivos estáticos (como index.html)
app.use(express.static(path.join(__dirname)));

// --- Endpoint de Busca ---
// Este endpoint responde a requisições em /search-employees?term=...
app.get('/search-employees', async (req, res) => {
    const searchTerm = req.query.term;

    // Garante que temos um termo de busca para não fazer buscas vazias
    if (!searchTerm || searchTerm.length < 1) {
        return res.json([]);
    }

    try {
        // A query foi adaptada para PostgreSQL.
        // Ela busca tanto no 'numcad' (convertido para texto) quanto no 'nomfun'.
        // O 'ILIKE' faz uma busca case-insensitive (ignora maiúsculas/minúsculas).
        // O '%' é um coringa que busca por qualquer coisa que COMECE com o termo.
        const query = {
            text: `
                SELECT numcad, nomfun 
                FROM public."Ffuncionarios" 
                WHERE CAST(numcad AS TEXT) LIKE $1 
                   OR nomfun ILIKE $1
                LIMIT 20;
            `,
            values: [`${searchTerm}%`],
        };

        const { rows } = await pool.query(query);
        
        // Retorna os resultados como um JSON.
        // Ex: [{ "numcad": 12345, "nomfun": "NOME DO FUNCIONARIO" }]
        res.json(rows);

    } catch (error) {
        console.error('Erro ao executar a query:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log(`Para usar, abra o arquivo index.html no seu navegador.`);
});
