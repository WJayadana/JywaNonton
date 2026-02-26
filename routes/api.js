import { Router } from 'express';
import axios from 'axios';
import sharp from 'sharp';
import convert from 'heic-convert';
import { latest, search, linkStream, trendings, foryou, populersearch, randomdrama, vip, detail, dubindo, getEpisode } from '../lib/melolo.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NOTICE_PATH = path.join(__dirname, '../public/notice.json');
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'jywa-admin-123';

const router = Router();

// --- Helper Function untuk Error Handling ---
const handleRequest = async (handler, req, res) => {
  try {
    const result = await handler(req);
    res.json(result);
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({ error: 'IP terkena limit, silakan tunggu beberapa menit dan coba lagi', message: error.message });
  }
};

/**
 * @swagger
 * /api/latest:
 *   get:
 *     summary: Get latest dramas
 *     tags: [Melolo]
 *     responses:
 *       200:
 *         description: List of latest dramas
 */
// GET /api/latest - Get latest dramas
router.get('/latest', (req, res) => {
  handleRequest(latest, req, res);
});

/**
 * @swagger
 * /api/trending:
 *   get:
 *     summary: Get trending dramas
 *     tags: [Melolo]
 *     responses:
 *       200:
 *         description: List of trending dramas
 */
// GET /api/trending - Get trending dramas
router.get('/trending', (req, res) => {
  handleRequest(trendings, req, res);
});

/**
 * @swagger
 * /api/for-you:
 *   get:
 *     summary: Get personalized recommendations
 *     tags: [Melolo]
 *     responses:
 *       200:
 *         description: List of recommended dramas
 */
// GET /api/for-you - Get personalized recommendations
router.get('/for-you', (req, res) => {
  handleRequest(foryou, req, res);
});

/**
 * @swagger
 * /api/vip:
 *   get:
 *     summary: Get VIP dramas
 *     tags: [Melolo]
 *     responses:
 *       200:
 *         description: List of VIP dramas
 */
// GET /api/vip - Get VIP dramas
router.get('/vip', (req, res) => {
  handleRequest(vip, req, res);
});

/**
 * @swagger
 * /api/random:
 *   get:
 *     summary: Get random drama video
 *     tags: [Melolo]
 *     responses:
 *       200:
 *         description: Random drama data
 */
// GET /api/random - Get random drama video
router.get('/random', (req, res) => {
  handleRequest(randomdrama, req, res);
});

/**
 * @swagger
 * /api/popular-searches:
 *   get:
 *     summary: Get popular search keywords
 *     tags: [Melolo]
 *     responses:
 *       200:
 *         description: List of popular search terms
 */
// GET /api/popular-searches - Get popular search keywords
router.get('/popular-searches', (req, res) => {
  handleRequest(populersearch, req, res);
});

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search dramas on Melolo
 *     tags: [Melolo]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 */
// GET /api/search?query=namadrama - Search dramas
router.get('/search', (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Parameter "query" dibutuhkan' });
  handleRequest(() => search(query), req, res);
});

/**
 * @swagger
 * /api/detail:
 *   get:
 *     summary: Get drama details from Melolo
 *     tags: [Melolo]
 *     parameters:
 *       - in: query
 *         name: bookId
 *         schema:
 *           type: string
 *         required: true
 *         description: The drama ID
 *     responses:
 *       200:
 *         description: Drama details
 */
// GET /api/detail?bookId=12345 - Get drama details
router.get('/detail', (req, res) => {
  const { bookId } = req.query;
  if (!bookId) return res.status(400).json({ error: 'Parameter "bookId" dibutuhkan' });
  handleRequest(() => detail(bookId), req, res);
});

/**
 * @swagger
 * /api/episodes:
 *   get:
 *     summary: Get all episodes (legacy/bulk) from Melolo
 *     tags: [Melolo]
 *     parameters:
 *       - in: query
 *         name: bookId
 *         schema:
 *           type: string
 *         required: true
 *         description: The drama ID
 *     responses:
 *       200:
 *         description: List of all episodes
 */
// GET /api/episodes?bookId=12345 - Get all episodes
router.get('/episodes', (req, res) => {
  const { bookId } = req.query;
  if (!bookId) return res.status(400).json({ error: 'Parameter "bookId" dibutuhkan' });
  handleRequest(async () => {
    const d = await detail(bookId);
    return { success: d.success, data: d.data.episodes || [] };
  }, req, res);
});

/**
 * @swagger
 * /api/episode:
 *   get:
 *     summary: Get single episode on-demand from Melolo
 *     tags: [Melolo]
 *     parameters:
 *       - in: query
 *         name: bookId
 *         schema:
 *           type: string
 *         required: true
 *         description: The drama ID
 *       - in: query
 *         name: index
 *         schema:
 *           type: integer
 *         required: true
 *         description: Episode index
 *     responses:
 *       200:
 *         description: Episode data
 */
// GET /api/episode?bookId=12345&index=1 - Get single episode on-demand (legacy/slow)
router.get('/episode', (req, res) => {
  const { bookId, index } = req.query;
  if (!bookId || !index) return res.status(400).json({ error: 'Parameter "bookId" dan "index" dibutuhkan' });
  handleRequest(() => getEpisode(bookId, index), req, res);
});

/**
 * @swagger
 * /api/stream:
 *   get:
 *     summary: Get stream URL directly via videoId
 *     tags: [Melolo]
 *     parameters:
 *       - in: query
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stream URL
 */
router.get('/stream', (req, res) => {
  const { videoId } = req.query;
  if (!videoId) return res.status(400).json({ error: 'Parameter "videoId" dibutuhkan' });
  handleRequest(async () => {
    const streamData = await linkStream(videoId);
    return { success: true, data: { playUrl: streamData.url } };
  }, req, res);
});

/**
 * @swagger
 * /api/dubbed:
 *   get:
 *     summary: Get Indonesian dubbed dramas
 *     tags: [Melolo]
 *     parameters:
 *       - in: query
 *         name: classify
 *         schema:
 *           type: string
 *           enum: [terpopuler, terbaru]
 *         required: true
 *         description: Classification type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of dubbed dramas
 */
// GET /api/dubbed?classify=terpopuler&page=1 - Get Indonesian dubbed dramas
router.get('/dubbed', (req, res) => {
  let { classify, page } = req.query;

  if (!classify) {
    return res.status(400).json({
      error: 'Parameter classify dibutuhkan terpopuler atau terbaru'
    });
  }

  // normalize
  classify = classify.toLowerCase();

  // mapping classify ke angka
  let classifyCode;
  if (classify === 'terpopuler') {
    classifyCode = 1;
  } else if (classify === 'terbaru') {
    classifyCode = 2;
  } else {
    return res.status(400).json({
      error: 'Parameter classify harus terpopuler atau terbaru'
    });
  }

  // page default 1 dan pastikan integer
  page = parseInt(page) || 1;

  handleRequest(() => dubindo(classifyCode, page), req, res);
});

/**
 * @swagger
 * /api/proxy-image:
 *   get:
 *     summary: Proxy and convert HEIC images to JPEG
 *     tags: [Utility]
 *     parameters:
 *       - in: query
 *         name: url
 *         schema:
 *           type: string
 *         required: true
 *         description: Original image URL
 *     responses:
 *       200:
 *         description: Converted image
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/proxy-image', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('URL required');

  try {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://api.tmtreader.com/'
    };

    const response = await axios.get(url, { 
        responseType: 'arraybuffer',
        headers,
        timeout: 15000 
    });
    
    let buffer = Buffer.from(response.data);

    // Check if it's HEIC (Simple magic number check if needed, but we assume it is based on URL)
    if (url.toLowerCase().includes('.heic')) {
        try {
            const outputBuffer = await convert({
                buffer: buffer,
                format: 'JPEG',
                quality: 1
            });
            buffer = Buffer.from(outputBuffer);
        } catch (convErr) {
            console.error(`[PROXY] heic-convert failed:`, convErr.message);
        }
    }

    // Use sharp for optimization
    const finalBuffer = await sharp(buffer)
      .jpeg({ quality: 80 })
      .toBuffer();

    res.set('Content-Type', 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=31536000'); 
    res.send(finalBuffer);
  } catch (error) {
    console.error("[PROXY] ERROR:", error.message);
    res.status(500).send(`Failed to proxy image: ${error.message}`);
  }
});

/**
 * @swagger
 * /api/notice:
 *   get:
 *     summary: Get active announcement/notice
 *     tags: [Utility]
 *     responses:
 *       200:
 *         description: Notice data
 */
router.get('/notice', async (req, res) => {
  try {
    const data = await fs.readFile(NOTICE_PATH, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(404).json({ active: false, message: "No notice found" });
  }
});

/**
 * @swagger
 * /api/admin/notice:
 *   post:
 *     summary: Update announcement (Admin only)
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               active:
 *                 type: boolean
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               buttonText:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notice updated successfully
 */
router.post('/admin/notice', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== ADMIN_API_KEY) {
    return res.status(403).json({ error: 'Unauthorized: Invalid API Key' });
  }

  try {
    const newNotice = req.body;
    if (!newNotice.id || typeof newNotice.active !== 'boolean') {
      return res.status(400).json({ error: 'Invalid notice data' });
    }

    await fs.writeFile(NOTICE_PATH, JSON.stringify(newNotice, null, 2), 'utf8');
    res.json({ success: true, message: 'Notice updated successfully', data: newNotice });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save notice', message: err.message });
  }
});

export default router;
