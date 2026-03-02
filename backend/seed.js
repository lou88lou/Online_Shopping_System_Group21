/**
 * 种子脚本：插入测试用户 (test@example.com / test123) 和示例商品
 * 用法：在 backend 目录下执行 node seed.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/db');

const TEST_PASSWORD = 'test123';

async function seedUser() {
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
  const sql = `
    INSERT INTO users (full_name, email, password, shipping_address)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      password = VALUES(password),
      full_name = VALUES(full_name),
      shipping_address = VALUES(shipping_address)
  `;
  await db.query(sql, [
    'Test User',
    'test@example.com',
    hashedPassword,
    '123 Test Address, Hong Kong'
  ]);
  console.log('Test user ready: test@example.com / ' + TEST_PASSWORD);
}

async function seedProducts() {
  const rows = await db.query('SELECT COUNT(*) as c FROM products');
  const count = (rows && rows[0] && rows[0].c) ? Number(rows[0].c) : 0;
  if (count > 0) {
    console.log('Products already exist (' + count + '), skip insert.');
    return;
  }
  const sql = `
    INSERT INTO products (name, price, thumbnail_url, description) VALUES
    ('iPhone 15 Pro', 999.99, 'https://via.placeholder.com/150/FF0000/FFFFFF?text=iPhone', 'Latest iPhone with advanced camera system'),
    ('MacBook Air M2', 1199.99, 'https://via.placeholder.com/150/0000FF/FFFFFF?text=MacBook', 'Thin and light laptop with M2 chip'),
    ('Sony Noise Cancelling Headphones', 299.99, 'https://via.placeholder.com/150/00FF00/FFFFFF?text=Headphones', 'Wireless noise-cancelling headphones'),
    ('Logitech MX Master 3', 89.99, 'https://via.placeholder.com/150/FFFF00/000000?text=Mouse', 'Wireless mouse for productivity'),
    ('Keychron Mechanical Keyboard', 129.99, 'https://via.placeholder.com/150/FF00FF/FFFFFF?text=Keyboard', 'Mechanical keyboard'),
    ('Dell 4K Monitor', 699.99, 'https://via.placeholder.com/150/00FFFF/000000?text=Monitor', '27-inch 4K USB-C monitor'),
    ('Samsung T7 Portable SSD', 129.99, 'https://via.placeholder.com/150/800080/FFFFFF?text=SSD', 'Portable SSD 1TB'),
    ('Apple Watch Series 9', 399.99, 'https://via.placeholder.com/150/008000/FFFFFF?text=Watch', 'Smartwatch with health features'),
    ('iPad Air', 599.99, 'https://via.placeholder.com/150/FFA500/000000?text=iPad', 'iPad with M1 chip'),
    ('Bose Portable Speaker', 199.99, 'https://via.placeholder.com/150/FFC0CB/000000?text=Speaker', 'Portable Bluetooth speaker')
  `;
  await db.query(sql);
  console.log('Sample products inserted.');
}

async function main() {
  try {
    await seedUser();
    await seedProducts();
    console.log('Seed completed.');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
  process.exit(0);
}

main();
