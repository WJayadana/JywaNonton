process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Menyiapkan __dirname untuk ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inisialisasi aplikasi Express
const app = express();
const PORT = process.env.PORT || 4343;

// Middleware untuk menyajikan file statis dari direktori 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Middleware untuk parsing JSON
app.use(express.json());
app.use(cors());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'JywaNonton API Documentation',
      version: '1.0.0',
      description: 'API documentation for Melolo platform (JywaNonton)',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger JSON
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// RapiDoc UI (Interactive & Beautiful)
app.get('/rapidoc', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>JywaNonton API - RapiDoc</title>
        <meta charset="utf-8"/>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700&display=swap" rel="stylesheet">
        <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>
      </head>
      <body>
        <rapi-doc
          spec-url="/swagger.json"
          theme="dark"
          render-style="focused"
          schema-style="table"
          show-header="true"
          primary-color="#7c3aed"
          bg-color="#0f172a"
          text-color="#f8fafc"
          font-size="large"
          regular-font="Outfit"
        >
          <img slot="nav-logo" src="/img/logo.png" style="width:40px; height:40px;" onerror="this.style.display='none'" />
        </rapi-doc>
      </body>
    </html>
  `);
});

// Gunakan router untuk semua permintaan yang diawali dengan /api
app.use('/api', apiRouter);

// Jalankan server jika tidak di environment Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log(`Swagger (Classic): http://localhost:${PORT}/api-docs`);
    console.log(`RapiDoc (Modern):  http://localhost:${PORT}/rapidoc`);
  });
}

// Penting untuk Vercel!
export default app;
