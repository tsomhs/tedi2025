-- Χρήστες (admin, seller, bidder, visitor)

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role ENUM('buyer', 'seller', 'admin') DEFAULT 'buyer',
    approved BOOLEAN DEFAULT FALSE,
    phone_number VARCHAR(20),
    country VARCHAR(100),
    address VARCHAR(255),
    vat_number VARCHAR(20),
    rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Αντικείμενα (δημοπρασίες)
CREATE TABLE items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  first_bid DECIMAL(10,2) NOT NULL,
  buy_price DECIMAL(10,2),
  location VARCHAR(255),
  country VARCHAR(100),
  started DATETIME,
  ends DATETIME,
  seller_id INT,
  description TEXT,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Πολλαπλές κατηγορίες για κάθε item
CREATE TABLE item_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT,
  category_name VARCHAR(100),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Προσφορές
CREATE TABLE bids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT,
  bidder_id INT,
  time DATETIME,
  amount DECIMAL(10,2),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (bidder_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Μηνύματα μεταξύ χρηστών (πωλητής ↔ νικητής)
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

-- Πολλαπλές κατηγορίες για κάθε item
CREATE TABLE item_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT,
  category_name VARCHAR(100),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Προσφορές
CREATE TABLE bids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT,
  bidder_id INT,
  time DATETIME,
  amount DECIMAL(10,2),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (bidder_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Μηνύματα μεταξύ χρηστών
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
--  αξιολογήσεις μεταξύ χρηστών μετά από μια ολοκληρωμένη δημοπρασία.
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

--Αποθηκεύει ποιες δημοπρασίες έχει δει ο κάθε χρήστης και πότε.
CREATE TABLE view_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  item_id INT NOT NULL,
  viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);