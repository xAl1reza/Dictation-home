<?php

class News
{
    private $db;


    public function __construct($db)
    {
        $this->db = $db;
    }


    /*
    |--------------------------------------------------------------------------
    | News List
    |--------------------------------------------------------------------------
    */

    public function getPublicList(
        $page = 1,
        $pageSize = 12,
        $category = null,
        $search = null
    ) {

        $page = max(1, (int) $page);

        $pageSize = max(
            1,
            min(50, (int) $pageSize)
        );

        $offset =
            ($page - 1) * $pageSize;


        $sql = "
            SELECT
                id,
                slug,
                title,
                excerpt,
                image,
                image_alt,
                category,
                category_slug,
                display_date,
                published_at
            FROM news
            WHERE is_published = 1
            AND published_at <= NOW()
        ";


        $params = [];


        if (
            $category !== null &&
            $category !== ""
        ) {

            $sql .= "
                AND category_slug = :category
            ";

            $params["category"] =
                $category;
        }


        if (
            $search !== null &&
            $search !== ""
        ) {

            $sql .= "
                AND (
                    title LIKE :search
                    OR excerpt LIKE :search
                )
            ";

            $params["search"] =
                "%" . $search . "%";
        }


        $sql .= "
            ORDER BY published_at DESC
            LIMIT :limit
            OFFSET :offset
        ";


        $query =
            $this->db->prepare($sql);


        foreach ($params as $key => $value) {

            $query->bindValue(
                ":" . $key,
                $value,
                PDO::PARAM_STR
            );
        }


        $query->bindValue(
            ":limit",
            $pageSize,
            PDO::PARAM_INT
        );

        $query->bindValue(
            ":offset",
            $offset,
            PDO::PARAM_INT
        );


        $query->execute();


        $rows =
            $query->fetchAll(
                PDO::FETCH_ASSOC
            );


        return array_map(
            [$this, "formatListItem"],
            $rows
        );
    }


    /*
    |--------------------------------------------------------------------------
    | News Detail
    |--------------------------------------------------------------------------
    */

    public function findPublicBySlug($slug)
    {
        $query = $this->db->prepare(
            "SELECT
                id,
                slug,
                title,
                excerpt,
                image,
                image_alt,
                category,
                category_slug,
                display_date,
                published_at
             FROM news
             WHERE slug = :slug
             AND is_published = 1
             AND published_at <= NOW()
             LIMIT 1"
        );


        $query->execute([
            "slug" => $slug
        ]);


        $row =
            $query->fetch(
                PDO::FETCH_ASSOC
            );


        if (!$row) {
            return null;
        }


        $news =
            $this->formatListItem($row);


        $news["gallery"] =
            $this->getGallery(
                $row["id"]
            );

        $news["content"] =
            $this->getContent(
                $row["id"]
            );


        return $news;
    }


    /*
    |--------------------------------------------------------------------------
    | Related News
    |--------------------------------------------------------------------------
    */

    public function getRelated(
        $currentNewsId,
        $categorySlug,
        $limit = 3
    ) {

        $limit = max(
            1,
            min(12, (int) $limit)
        );


        /*
         * Same category first,
         * then latest news from other categories.
         */
        $query = $this->db->prepare(
            "SELECT
                id,
                slug,
                title,
                excerpt,
                image,
                image_alt,
                category,
                category_slug,
                display_date,
                published_at
             FROM news
             WHERE id != :current_id
             AND is_published = 1
             AND published_at <= NOW()
             ORDER BY
                CASE
                    WHEN category_slug = :category_slug
                    THEN 0
                    ELSE 1
                END ASC,
                published_at DESC
             LIMIT :limit"
        );


        $query->bindValue(
            ":current_id",
            (int) $currentNewsId,
            PDO::PARAM_INT
        );

        $query->bindValue(
            ":category_slug",
            $categorySlug,
            PDO::PARAM_STR
        );

        $query->bindValue(
            ":limit",
            $limit,
            PDO::PARAM_INT
        );


        $query->execute();


        $rows =
            $query->fetchAll(
                PDO::FETCH_ASSOC
            );


        return array_map(
            [$this, "formatListItem"],
            $rows
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Gallery
    |--------------------------------------------------------------------------
    */

    private function getGallery($newsId)
    {
        $query = $this->db->prepare(
            "SELECT
                src,
                alt
             FROM news_gallery_items
             WHERE news_id = :news_id
             ORDER BY
                sort_order ASC,
                id ASC"
        );


        $query->execute([
            "news_id" => $newsId
        ]);


        return $query->fetchAll(
            PDO::FETCH_ASSOC
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Content
    |--------------------------------------------------------------------------
    */

    private function getContent($newsId)
    {
        $query = $this->db->prepare(
            "SELECT content
             FROM news_content_blocks
             WHERE news_id = :news_id
             ORDER BY
                sort_order ASC,
                id ASC"
        );


        $query->execute([
            "news_id" => $newsId
        ]);


        return $query->fetchAll(
            PDO::FETCH_COLUMN
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Frontend Contract
    |--------------------------------------------------------------------------
    */

    private function formatListItem($row)
    {
        return [
            "id" =>
                (int) $row["id"],

            "slug" =>
                $row["slug"],

            "title" =>
                $row["title"],

            "excerpt" =>
                $row["excerpt"],

            "image" =>
                $row["image"],

            "imageAlt" =>
                $row["image_alt"],

            "category" =>
                $row["category"],

            "categorySlug" =>
                $row["category_slug"],

            "date" =>
                $row["display_date"],

            "publishedAt" =>
                $this->toIsoDate(
                    $row["published_at"]
                )
        ];
    }


    private function toIsoDate($value)
    {
        if (!$value) {
            return null;
        }


        $timestamp = strtotime($value);


        if ($timestamp === false) {
            return null;
        }


        return gmdate(
            "Y-m-d\\TH:i:s\\Z",
            $timestamp
        );
    }
}