const db = require('./config/db');

(async () => {
  try {
    const cnt = await db.query('SELECT COUNT(*) as cnt FROM products');
    console.log('products count:', cnt[0].cnt);

    const sample = await db.query('SELECT id, name, price, thumbnail_url, created_at FROM products LIMIT 1');
    console.log('sample row:', sample);
  } catch (e) {
    console.error('DB test error:', e);
  } finally {
    process.exit();
  }
})();
