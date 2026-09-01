CREATE TABLE folders (

    id CHAR(36) PRIMARY KEY,

    user_id CHAR(36) NOT NULL,

    title VARCHAR(100) NOT NULL,

    type ENUM('dictation', 'science') NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP,


    CONSTRAINT fk_folders_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE

);