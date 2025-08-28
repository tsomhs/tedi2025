-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role ENUM('buyer', 'seller', 'admin') DEFAULT 'buyer',
    approved BOOLEAN DEFAULT FALSE,
    phone_number VARCHAR(20),
    country VARCHAR(100),
    location VARCHAR(255),
    vat_number VARCHAR(20),
    seller_rating DECIMAL(3,2) DEFAULT 0.00,
    buyer_rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Items (auctions)
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    first_bid DECIMAL(10,2) NOT NULL,
    currently DECIMAL(10,2) NOT NULL,
    buy_price DECIMAL(10,2),
    latitude DECIMAL(9,6),    
    longitude DECIMAL(9,6),
    location VARCHAR(255),    
    country VARCHAR(100),
    started DATETIME NOT NULL,
    ends DATETIME NOT NULL,
    seller_id INT NOT NULL,
    description TEXT,
    sold BOOLEAN DEFAULT FALSE,
    winner_id INT,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Item categories
CREATE TABLE item_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    category_name VARCHAR(100),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Bids
CREATE TABLE bids (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    bidder_id INT NOT NULL,
    time DATETIME DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (bidder_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages between users
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_user INT NOT NULL,
    to_user INT NOT NULL,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    deleted_by_sender BOOLEAN DEFAULT FALSE,
    deleted_by_receiver BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (from_user) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user) REFERENCES users(id) ON DELETE CASCADE
);

-- Ratings between users after auction
CREATE TABLE ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    from_user INT NOT NULL,
    to_user INT NOT NULL,
    rating_value INT CHECK (rating_value BETWEEN 1 AND 5),
    role ENUM('seller', 'bidder') NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (item_id, from_user, to_user),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (from_user) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user) REFERENCES users(id) ON DELETE CASCADE
);

-- View history for auctions
CREATE TABLE view_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);
