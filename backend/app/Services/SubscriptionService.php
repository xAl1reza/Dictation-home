<?php

/** Subscription dates are UTC and checked against the database clock only. */
class SubscriptionService
{
    public const FEATURES = ['dictation', 'science', 'math', 'content_manage'];
    private $db;

    public function __construct($db) { $this->db = $db; }

    public function createTrial($userId)
    {
        $q = $this->db->prepare('INSERT INTO user_subscriptions
            (user_id, trial_started_at, trial_ends_at)
            VALUES (:id, UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 14 DAY))');
        $q->execute(['id' => $userId]);
    }

    public function status($userId)
    {
        $q = $this->db->prepare('SELECT trial_started_at, trial_ends_at,
            paid_started_at, paid_ends_at, UTC_TIMESTAMP() AS server_now,
            CASE
              WHEN paid_started_at <= UTC_TIMESTAMP() AND paid_ends_at > UTC_TIMESTAMP() THEN \'paid\'
              WHEN trial_started_at <= UTC_TIMESTAMP() AND trial_ends_at > UTC_TIMESTAMP() THEN \'trial\'
              ELSE \'free\'
            END AS tier
            FROM user_subscriptions WHERE user_id = :id');
        $q->execute(['id' => $userId]);
        $row = $q->fetch(PDO::FETCH_ASSOC);
        // Missing records never create/reset a trial or grant access.
        if (!$row) { throw new RuntimeException('Subscription record missing'); }
        $tier = $row['tier'];
        $permissions = array_fill_keys(self::FEATURES, false);
        $rules = $this->db->query('SELECT feature_key, trial_allowed, free_allowed, paid_allowed
            FROM subscription_feature_access')->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rules as $rule) {
            if (array_key_exists($rule['feature_key'], $permissions)) {
                $permissions[$rule['feature_key']] = (int)$rule[$tier . '_allowed'] === 1;
            }
        }
        $start = $tier === 'paid' ? $row['paid_started_at'] : $row['trial_started_at'];
        $end = $tier === 'paid' ? $row['paid_ends_at'] : $row['trial_ends_at'];
        $utc = new DateTimeZone('UTC');
        $now = new DateTimeImmutable($row['server_now'], $utc);
        $starts = new DateTimeImmutable($start, $utc);
        $ends = new DateTimeImmutable($end, $utc);
        $remaining = $tier === 'free' ? 0 : max(0, $ends->getTimestamp() - $now->getTimestamp());
        $duration = max(1, $ends->getTimestamp() - $starts->getTimestamp());
        return [
            'tier' => $tier,
            'serverNow' => $now->format('Y-m-d\TH:i:s\Z'),
            'startsAt' => $starts->format('Y-m-d\TH:i:s\Z'),
            'endsAt' => $ends->format('Y-m-d\TH:i:s\Z'),
            'remainingSeconds' => $remaining,
            'remainingDays' => (int)ceil($remaining / 86400),
            'remainingPercent' => round(min(100, $remaining * 100 / $duration), 2),
            'permissions' => $permissions,
            'purchaseRequired' => $tier === 'free' && in_array(false, $permissions, true),
        ];
    }

    public function requireAny($userId, array $features)
    {
        $status = $this->status($userId);
        foreach ($features as $feature) {
            if (($status['permissions'][$feature] ?? false) === true) { return; }
        }
        Response::error('SUBSCRIPTION_REQUIRED', 403);
    }
}
