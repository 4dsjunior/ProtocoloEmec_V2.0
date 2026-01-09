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

// --- Rota de Health Check (NOVO) ---
// O EasyPanel usa isso para verificar se o container está saudável.
// Sem isso (ou sem o bind 0.0.0.0), o EasyPanel reinicia o app achando que travou.
app.get('/health', (req, res) => {
    res.status(200).send('OK');
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
        const query = {
            text: `
                SELECT numemp, numcad, nomfun 
                FROM public."Ffuncionarios" 
                WHERE CAST(numcad AS TEXT) LIKE $1 
                   OR nomfun ILIKE $1
                LIMIT 20;
            `,
            values: [`${searchTerm}%`],
        };

        const { rows } = await pool.query(query);
        
        // Retorna os resultados como um JSON.
        res.json(rows);

    } catch (error) {
        console.error('Erro ao executar a query:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Inicia o servidor
// ALTERAÇÃO CRÍTICA: Adicionado '0.0.0.0' para ouvir em todas as interfaces de rede do container
app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://0.0.0.0:${port}`);
    console.log(`Para usar, abra o arquivo index.html no seu navegador.`);
});
