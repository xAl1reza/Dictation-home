ALTER TABLE game_results
    ADD COLUMN session_id VARCHAR(100) NULL AFTER id,
    ADD UNIQUE KEY uq_game_results_user_session (user_id, session_id);