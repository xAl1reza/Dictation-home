/*
|--------------------------------------------------------------------------
| Test News Seed
|--------------------------------------------------------------------------
| Source: current frontend news-data.json
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| News 1
|--------------------------------------------------------------------------
*/

INSERT INTO news
(
    id,
    slug,
    title,
    excerpt,
    image,
    image_alt,
    category,
    category_slug,
    display_date,
    published_at,
    is_published
)
VALUES
(
    1,
    'learning-with-games',
    'یادگیری با بازی؛ تجربه‌ای جذاب‌تر برای کودکان',
    'بازی می‌تواند تمرین و تکرار را برای کودکان ساده‌تر، جذاب‌تر و هدفمندتر کند.',
    './images/news/news-01.jpg',
    'یادگیری تعاملی کودک',
    'آموزش',
    'education',
    '۱۴۰۵/۰۵/۲۰',
    '2026-08-11 08:30:00',
    1
);


INSERT INTO news_gallery_items
(
    news_id,
    src,
    alt,
    sort_order
)
VALUES
(
    1,
    './images/news/news-01.jpg',
    'یادگیری تعاملی کودک',
    1
),
(
    1,
    './images/news/news-01.jpg',
    'تمرین آموزشی کودک',
    2
),
(
    1,
    './images/news/news-01.jpg',
    'تجربه یادگیری با بازی',
    3
);


INSERT INTO news_content_blocks
(
    news_id,
    content,
    sort_order
)
VALUES
(
    1,
    'یادگیری برای کودکان زمانی مؤثرتر می‌شود که تمرین از یک فعالیت تکراری به تجربه‌ای جذاب و قابل تعامل تبدیل شود.',
    1
),
(
    1,
    'در دیکته خونه تلاش می‌کنیم تمرین‌های آموزشی را به شکلی طراحی کنیم که کودک در کنار یادگیری، از مسیر تمرین هم لذت ببرد.',
    2
);



/*
|--------------------------------------------------------------------------
| News 2
|--------------------------------------------------------------------------
*/

INSERT INTO news
(
    id,
    slug,
    title,
    excerpt,
    image,
    image_alt,
    category,
    category_slug,
    display_date,
    published_at,
    is_published
)
VALUES
(
    2,
    'new-spelling-exercises',
    'تمرین‌های جدید دیکته به دیکته خونه اضافه شد',
    'مجموعه‌ای تازه از تمرین‌های نوشتاری و دیکته برای دانش‌آموزان آماده شده است.',
    './images/news/news-02.jpg',
    'یادگیری تعاملی کودک',
    'دیکته خونه',
    'dikteh-khooneh',
    '۱۴۰۵/۰۵/۱۸',
    '2026-08-09 08:30:00',
    1
);


INSERT INTO news_gallery_items
(
    news_id,
    src,
    alt,
    sort_order
)
VALUES
(
    2,
    './images/news/news-02.jpg',
    'یادگیری تعاملی کودک',
    1
),
(
    2,
    './images/news/news-02.jpg',
    'تمرین آموزشی کودک',
    2
),
(
    2,
    './images/news/news-02.jpg',
    'تجربه یادگیری با بازی',
    3
);


INSERT INTO news_content_blocks
(
    news_id,
    content,
    sort_order
)
VALUES
(
    2,
    'مجموعه جدیدی از تمرین‌های دیکته و مهارت‌های نوشتاری به دیکته خونه اضافه شده است.',
    1
),
(
    2,
    'این تمرین‌ها با هدف ایجاد تنوع بیشتر و کمک به تکرار هدفمند طراحی شده‌اند.',
    2
);



/*
|--------------------------------------------------------------------------
| News 3
|--------------------------------------------------------------------------
*/

INSERT INTO news
(
    id,
    slug,
    title,
    excerpt,
    image,
    image_alt,
    category,
    category_slug,
    display_date,
    published_at,
    is_published
)
VALUES
(
    3,
    'schools-using-dikteh-khooneh',
    'مدارس بیشتری به دیکته خونه اضافه شدند',
    'استفاده از دیکته خونه در مدارس مختلف کشور در حال گسترش است.',
    './images/news/news-03.jpg',
    'یادگیری تعاملی کودک',
    'اخبار',
    'news',
    '۱۴۰۵/۰۵/۱۵',
    '2026-08-06 08:30:00',
    1
);


INSERT INTO news_gallery_items
(
    news_id,
    src,
    alt,
    sort_order
)
VALUES
(
    3,
    './images/news/news-03.jpg',
    'یادگیری تعاملی کودک',
    1
),
(
    3,
    './images/news/news-03.jpg',
    'تمرین آموزشی کودک',
    2
),
(
    3,
    './images/news/news-03.jpg',
    'تجربه یادگیری با بازی',
    3
);


INSERT INTO news_content_blocks
(
    news_id,
    content,
    sort_order
)
VALUES
(
    3,
    'مدارس بیشتری در نقاط مختلف کشور استفاده از دیکته خونه را آغاز کرده‌اند.',
    1
),
(
    3,
    'هدف ما ایجاد بستری ساده و قابل استفاده برای دانش‌آموزان، معلمان و مدارس است.',
    2
);