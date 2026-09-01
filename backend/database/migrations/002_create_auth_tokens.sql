CREATE TABLE auth_tokens (
    id CHAR(36) PRIMARY KEY,

    user_id CHAR(36) NOT NULL,

    token VARCHAR(255) NOT NULL UNIQUE,

    expires_at DATETIME NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);