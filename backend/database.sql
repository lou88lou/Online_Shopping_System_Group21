-- E-commerce System - Group 21
-- Database initialization script

-- Create database
CREATE DATABASE IF NOT EXISTS online_shop_group21;
USE online_shop_group21;

-- Users table (A1)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    shipping_address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Products table (A3)
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) UNSIGNED NOT NULL,
    thumbnail_url VARCHAR(500),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Shopping cart table (A7-A10)
CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT UNSIGNED DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (user_id, product_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Orders table (A11-A13)
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipping_address TEXT NOT NULL,
    total_amount DECIMAL(10,2) UNSIGNED NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_order_number (order_number),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    unit_price DECIMAL(10,2) UNSIGNED NOT NULL,
    subtotal DECIMAL(10,2) UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert sample product data
INSERT INTO products (name, price, thumbnail_url, description) VALUES
('iPhone 15 Pro', 999.99, 'https://via.placeholder.com/150/FF0000/FFFFFF?text=iPhone', 'Latest iPhone with advanced camera system'),
('MacBook Air M2', 1199.99, 'https://via.placeholder.com/150/0000FF/FFFFFF?text=MacBook', 'Thin and light laptop with M2 chip'),
('Sony Noise Cancelling Headphones', 299.99, 'https://via.placeholder.com/150/00FF00/FFFFFF?text=Headphones', 'Wireless noise-cancelling headphones with excellent sound quality'),
('Logitech MX Master 3', 89.99, 'https://via.placeholder.com/150/FFFF00/000000?text=Mouse', 'Wireless mouse designed for productivity'),
('Keychron Mechanical Keyboard', 129.99, 'https://via.placeholder.com/150/FF00FF/FFFFFF?text=Keyboard', 'Mechanical keyboard with hot-swappable switches'),
('Dell 4K Monitor', 699.99, 'https://via.placeholder.com/150/00FFFF/000000?text=Monitor', '27-inch 4K USB-C monitor'),
('Samsung T7 Portable SSD', 129.99, 'https://via.placeholder.com/150/800080/FFFFFF?text=SSD', 'Portable SSD with 1TB storage'),
('Apple Watch Series 9', 399.99, 'https://via.placeholder.com/150/008000/FFFFFF?text=Watch', 'Smartwatch with advanced health features'),
('iPad Air', 599.99, 'https://via.placeholder.com/150/FFA500/000000?text=iPad', 'Powerful iPad with M1 chip'),
('Bose Portable Speaker', 199.99, 'https://via.placeholder.com/150/FFC0CB/000000?text=Speaker', 'Portable Bluetooth speaker with excellent sound quality');

-- 测试用户 (密码: test123)，使用 bcrypt 哈希
INSERT INTO users (full_name, email, password, shipping_address) VALUES
('Test User', 'test@example.com', '$2b$10$kOb6tGxvPuqX7WCAFmxnsuOuSWNML.ST1YENg5iXqrta/Mjw57xsm', '123 Test Address, Hong Kong');