CREATE TABLE science_questions (
    id CHAR(36) PRIMARY KEY,
    folder_id CHAR(36) NOT NULL,
    question VARCHAR(220) NOT NULL,
    answer VARCHAR(600) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_science_questions_folder
        FOREIGN KEY (folder_id)
        REFERENCES folders(id)
        ON DELETE CASCADE,

    INDEX idx_science_questions_folder_id (folder_id)
);