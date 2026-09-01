<?php

class Dashboard
{
    private $db;


    public function __construct($db)
    {
        $this->db = $db;
    }



    public function getStats($userId)
    {

        $scoreQuery = $this->db->prepare(
            "SELECT 
                COALESCE(SUM(score),0) as totalScore,
                COUNT(*) as totalGames,
                COALESCE(AVG(accuracy),0) as averageAccuracy
             FROM game_results
             WHERE user_id = :user_id"
        );


        $scoreQuery->execute([
            "user_id" => $userId
        ]);


        $stats = $scoreQuery->fetch(PDO::FETCH_ASSOC);



        $recentQuery = $this->db->prepare(
            "SELECT
                game_type,
                score,
                accuracy,
                created_at
             FROM game_results
             WHERE user_id = :user_id
             ORDER BY created_at DESC
             LIMIT 5"
        );


        $recentQuery->execute([
            "user_id" => $userId
        ]);


        $stats["recentGames"] = $recentQuery->fetchAll(PDO::FETCH_ASSOC);


        return $stats;
    }
}