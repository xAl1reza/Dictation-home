-- Run before deploying PHP. All subscription DATETIME values are UTC.
-- Existing users receive 14 days starting at the first execution.
-- Re-running does not reset existing trials or overwrite policy changes.
CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id CHAR(36) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  trial_started_at DATETIME NOT NULL,
  trial_ends_at DATETIME NOT NULL,
  paid_started_at DATETIME DEFAULT NULL,
  paid_ends_at DATETIME DEFAULT NULL,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_subscription_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscription_feature_access (
  feature_key VARCHAR(40) NOT NULL,
  trial_allowed TINYINT UNSIGNED NOT NULL DEFAULT 0,
  free_allowed TINYINT UNSIGNED NOT NULL DEFAULT 0,
  paid_allowed TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (feature_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO subscription_feature_access (feature_key, trial_allowed, free_allowed, paid_allowed)
VALUES ('dictation', 1, 0, 1), ('science', 1, 0, 1), ('math', 1, 0, 1), ('content_manage', 1, 0, 1)
ON DUPLICATE KEY UPDATE feature_key = VALUES(feature_key);

INSERT INTO user_subscriptions (user_id, trial_started_at, trial_ends_at)
SELECT id, UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 14 DAY) FROM users
ON DUPLICATE KEY UPDATE user_id = VALUES(user_id);
