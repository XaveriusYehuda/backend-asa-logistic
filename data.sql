CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(26) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rfq_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rfq_number VARCHAR(50) UNIQUE NOT NULL,
    user_id VARCHAR(100) NOT NULL, -- Diizinkan NULL jika visitor tidak/belum login
    
    -- PERUBAHAN: Mengubah ENUM menjadi VARCHAR agar bisa menerima tipe layanan dari serviceSchemas.jsx
    service_type VARCHAR(100) NOT NULL, 
    
    -- Kolom JSON untuk menampung data teks dinamis seperti hs_code, company_name, dll.
    service_details JSON NOT NULL, 
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status_request ENUM('incoming', 'ongoing', 'completed') NOT NULL DEFAULT 'incoming'
);

ALTER TABLE rfq_requests ADD status_request ENUM('incoming', 'ongoing', 'completed') NOT NULL DEFAULT 'incoming'; 

ALTER TABLE rfq_requests ADD email_number NOT NULL DEFAULT 'incoming'; 

ALTER TABLE rfq_requests DROP COLUMN status; 

UPDATE rfq_requests 
SET user_id = 'DEFAULT_ID' 
WHERE user_id IS NULL;

ALTER TABLE rfq_requests 
MODIFY COLUMN user_id VARCHAR(100) NOT NULL;


CREATE TABLE rfq_attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rfq_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    
    -- Menampung tipe berkas dari requiredFiles (misal: 'invoice', 'packing_list', 'goods_photo')
    document_type VARCHAR(100) NOT NULL, 
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- ON DELETE CASCADE: Jika data utama di rfq_requests dihapus, lampirannya otomatis terhapus
    FOREIGN KEY (rfq_id) REFERENCES rfq_requests(id) ON DELETE CASCADE
);

CREATE TABLE rfq_final_quotations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rfq_id INT NOT NULL UNIQUE, -- 1 Request RFQ hanya memiliki 1 file kalkulasi final resmi
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (rfq_id) REFERENCES rfq_requests(id) ON DELETE CASCADE
);

CREATE TABLE rfq_before_final (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rfq_id INT NOT NULL,
    rfq_number VARCHAR(50) NOT NULL,
    file_path TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rfq_id) REFERENCES rfq_requests(id) ON DELETE CASCADE
);

CREATE TABLE `rfq_final_merged` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rfq_id` INT NOT NULL,
  `rfq_number` VARCHAR(50) NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Foreign key untuk menjaga integritas data agar terikat dengan tabel rfq_requests utama
  CONSTRAINT `fk_rfq_final_merged_rfq_id` 
    FOREIGN KEY (`rfq_id`) 
    REFERENCES `rfq_requests` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;