CREATE TABLE news (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    slug VARCHAR(180) NOT NULL UNIQUE,

    title VARCHAR(250) NOT NULL,

    excerpt VARCHAR(600) NOT NULL,

    image VARCHAR(500) NOT NULL,

    image_alt VARCHAR(250) DEFAULT NULL,

    category VARCHAR(100) NOT NULL,

    category_slug VARCHAR(120) NOT NULL,

    display_date VARCHAR(20) NOT NULL,

    published_at DATETIME NOT NULL,

    is_published TINYINT(1) NOT NULL DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_news_category_slug (category_slug),

    INDEX idx_news_published_at (published_at),

    INDEX idx_news_public (
        is_published,
        published_at
    )
);


CREATE TABLE news_gallery_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    news_id BIGINT UNSIGNED NOT NULL,

    src VARCHAR(500) NOT NULL,

    alt VARCHAR(250) DEFAULT NULL,

    sort_order INT UNSIGNED NOT NULL DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_news_gallery_news
        FOREIGN KEY (news_id)
        REFERENCES news(id)
        ON DELETE CASCADE,

    INDEX idx_news_gallery_news_id (
        news_id,
        sort_order
    )
);


CREATE TABLE news_content_blocks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    news_id BIGINT UNSIGNED NOT NULL,

    content TEXT NOT NULL,

    sort_order INT UNSIGNED NOT NULL DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_news_content_news
        FOREIGN KEY (news_id)
        REFERENCES news(id)
        ON DELETE CASCADE,

    INDEX idx_news_content_news_id (
        news_id,
        sort_order
    )
);