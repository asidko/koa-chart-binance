// server.js
const Koa = require('koa');
const Router = require('@koa/router');
const cors = require('@koa/cors');
const axios = require('axios');
const serve = require('koa-static');
const path = require('path');
const NodeCache = require('node-cache');

// Initialize cache with 5 minute TTL (in seconds)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 });

const app = new Koa();
const router = new Router();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Serve static files from the public directory
app.use(serve(path.join(__dirname, 'public')));

// Route to fetch BTC price data from Binance API with caching
router.get('/api/btc-price', async (ctx) => {
    try {
        // Get query parameters with defaults
        const symbol = ctx.query.symbol || 'BTCUSDT';
        const interval = ctx.query.interval || '1d';
        const limit = parseInt(ctx.query.limit) || 168;

        // Create a cache key from request parameters
        const cacheKey = `${symbol}-${interval}-${limit}`;

        // Try to get data from cache
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            ctx.set('X-Cache', 'HIT');
            ctx.body = cachedData;
            return;
        }

        ctx.set('X-Cache', 'MISS');

        // Fetch data from Binance API if not in cache
        const response = await axios.get('https://api.binance.com/api/v3/klines', {
            params: { symbol, interval, limit }
        });

        // Transform the data
        const formattedData = response.data.map(candle => ({
            timestamp: candle[0],
            date: new Date(candle[0]).toISOString(),
            price: parseFloat(candle[4])
        }));

        // Store in cache (TTL is set globally when creating the cache)
        cache.set(cacheKey, formattedData);

        ctx.body = formattedData;
    } catch (error) {
        console.error(`Error fetching price data: ${error.message}`);
        ctx.status = 500;
        ctx.body = {
            error: 'Failed to fetch price data',
            message: error.message
        };
    }
});

// Admin routes for cache management
router.get('/api/cache/stats', (ctx) => {
    ctx.body = {
        keys: cache.keys(),
        stats: cache.getStats()
    };
});

router.post('/api/cache/clear', (ctx) => {
    cache.flushAll();
    ctx.body = { success: true, message: 'Cache cleared' };
});

// Use router middleware
app.use(router.routes()).use(router.allowedMethods());

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Cache TTL set to 300 seconds (5 minutes)`);
});