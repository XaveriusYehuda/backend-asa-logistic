CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(26) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- asalogistics.users definition

CREATE TABLE `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `public_id` char(26) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `public_id` (`public_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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


// doksli

-- asalogistics.rfq_requests definition

CREATE TABLE `rfq_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rfq_number` varchar(50) NOT NULL,
  `user_id` varchar(100) NOT NULL,
  `service_type` varchar(100) NOT NULL,
  `service_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`service_details`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status_request` enum('incoming','ongoing','completed') NOT NULL DEFAULT 'incoming',
  PRIMARY KEY (`id`),
  UNIQUE KEY `rfq_number` (`rfq_number`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


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

-- asalogistics.rfq_attachments definition

CREATE TABLE `rfq_attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rfq_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `document_type` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `rfq_id` (`rfq_id`),
  CONSTRAINT `rfq_attachments_ibfk_1` FOREIGN KEY (`rfq_id`) REFERENCES `rfq_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=141 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE rfq_final_quotations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rfq_id INT NOT NULL UNIQUE, -- 1 Request RFQ hanya memiliki 1 file kalkulasi final resmi
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (rfq_id) REFERENCES rfq_requests(id) ON DELETE CASCADE
);

-- asalogistics.rfq_final_quotations definition

CREATE TABLE `rfq_final_quotations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rfq_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `rfq_id` (`rfq_id`),
  CONSTRAINT `rfq_final_quotations_ibfk_1` FOREIGN KEY (`rfq_id`) REFERENCES `rfq_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE rfq_before_final (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rfq_id INT NOT NULL,
    rfq_number VARCHAR(50) NOT NULL,
    file_path TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rfq_id) REFERENCES rfq_requests(id) ON DELETE CASCADE
);

-- asalogistics.rfq_before_final definition

CREATE TABLE `rfq_before_final` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rfq_id` int(11) NOT NULL,
  `rfq_number` varchar(50) NOT NULL,
  `file_path` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `rfq_id` (`rfq_id`),
  CONSTRAINT `rfq_before_final_ibfk_1` FOREIGN KEY (`rfq_id`) REFERENCES `rfq_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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

-- asalogistics.rfq_final_merged definition

CREATE TABLE `rfq_final_merged` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rfq_id` int(11) NOT NULL,
  `rfq_number` varchar(50) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_rfq_final_merged_rfq_id` (`rfq_id`),
  CONSTRAINT `fk_rfq_final_merged_rfq_id` FOREIGN KEY (`rfq_id`) REFERENCES `rfq_requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;