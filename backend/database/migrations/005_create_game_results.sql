CREATE TABLE game_results (

    id CHAR(36) PRIMARY KEY,

    user_id CHAR(36) NOT NULL,

    folder_id CHAR(36) DEFAULT NULL,

    game_type ENUM('math','dictation','science') NOT NULL,

    score INT DEFAULT 0,

    correct INT DEFAULT 0,

    wrong INT DEFAULT 0,

    skipped INT DEFAULT 0,

    answered INT DEFAULT 0,

    rounds INT DEFAULT 0,

    accuracy INT DEFAULT 0,

    duration_seconds INT DEFAULT 0,

    started_at DATETIME DEFAULT NULL,

    finished_at DATETIME DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_results_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,


    CONSTRAINT fk_results_folder
    FOREIGN KEY (folder_id)
    REFERENCES folders(id)
    ON DELETE SET NULL

);