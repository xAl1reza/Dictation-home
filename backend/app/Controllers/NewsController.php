<?php

class NewsController
{
    private $newsModel;


    public function __construct($db)
    {
        $this->newsModel = new News($db);
    }


    /*
    |--------------------------------------------------------------------------
    | News List
    |--------------------------------------------------------------------------
    */

    public function index()
    {
        $page = isset($_GET["page"])
            ? (int) $_GET["page"]
            : 1;

        $pageSize = isset($_GET["pageSize"])
            ? (int) $_GET["pageSize"]
            : 12;

        $category = isset($_GET["category"])
            ? trim($_GET["category"])
            : null;

        $search = isset($_GET["search"])
            ? trim($_GET["search"])
            : null;


        if ($page < 1) {
            $page = 1;
        }


        if ($pageSize < 1) {
            $pageSize = 12;
        }


        if ($pageSize > 50) {
            $pageSize = 50;
        }


        if ($category === "") {
            $category = null;
        }


        if ($search === "") {
            $search = null;
        }


        $news = $this->newsModel->getPublicList(
            $page,
            $pageSize,
            $category,
            $search
        );


        Response::success(
            $news,
            "News fetched successfully"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | News Detail
    |--------------------------------------------------------------------------
    */

    public function show($slug)
    {
        $slug = trim($slug);


        if ($slug === "") {

            Response::error(
                "News slug is required",
                400
            );

            return;
        }


        $news =
            $this->newsModel
                ->findPublicBySlug($slug);


        if (!$news) {

            Response::error(
                "News not found",
                404
            );

            return;
        }


        Response::success(
            $news,
            "News fetched successfully"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Related News
    |--------------------------------------------------------------------------
    */

    public function related($slug)
    {
        $slug = trim($slug);


        if ($slug === "") {

            Response::error(
                "News slug is required",
                400
            );

            return;
        }


        $currentNews =
            $this->newsModel
                ->findPublicBySlug($slug);


        if (!$currentNews) {

            Response::error(
                "News not found",
                404
            );

            return;
        }


        $limit = isset($_GET["limit"])
            ? (int) $_GET["limit"]
            : 3;


        if ($limit < 1) {
            $limit = 3;
        }


        if ($limit > 12) {
            $limit = 12;
        }


        $related =
            $this->newsModel
                ->getRelated(
                    $currentNews["id"],
                    $currentNews["categorySlug"],
                    $limit
                );


        Response::success(
            $related,
            "Related news fetched successfully"
        );
    }
}