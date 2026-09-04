-- ============================================================================
-- Dikteh Khooneh
-- Seed: legacy frontend news
--
-- Prerequisite:
--   Migration 009 (news + news_gallery_items + news_content_blocks)
--   must already be applied.
--
-- Source:
--   frontend/public/data/news-data.json
--
-- Result:
--   6 news
--   18 gallery items
--   24 content blocks
--
-- Safe to run more than once:
--   - news rows are upserted by the UNIQUE slug
--   - gallery/content rows for these six news are rebuilt
-- ============================================================================

SET NAMES utf8mb4;

START TRANSACTION;


-- --------------------------------------------------------------------------
-- Main news rows
-- --------------------------------------------------------------------------

INSERT INTO news
(
    slug,
    title,
    excerpt,
    image,
    image_alt,
    category,
    category_slug,
    published_at,
    is_published
)
VALUES
('learning-with-games', 'یادگیری با بازی؛ تجربه‌ای جذاب‌تر برای کودکان', 'بازی می‌تواند تمرین و تکرار را برای کودکان ساده‌تر، جذاب‌تر و هدفمندتر کند.', './images/news/news-01.jpg', 'یادگیری تعاملی کودک', 'آموزش', 'education', '2026-08-11 08:30:00', 1),
('new-spelling-exercises', 'تمرین‌های جدید دیکته به دیکته خونه اضافه شد', 'مجموعه‌ای تازه از تمرین‌های نوشتاری و دیکته برای دانش‌آموزان آماده شده است.', './images/news/news-02.jpg', 'یادگیری تعاملی کودک', 'دیکته خونه', 'dikteh-khooneh', '2026-08-09 08:30:00', 1),
('schools-using-dikteh-khooneh', 'مدارس بیشتری به دیکته خونه اضافه شدند', 'استفاده از دیکته خونه در مدارس مختلف کشور در حال گسترش است.', './images/news/news-03.jpg', 'یادگیری تعاملی کودک', 'اخبار', 'news', '2026-08-06 08:30:00', 1),
('smart-practice-for-students', 'تمرین هوشمند چه کمکی به دانش‌آموز می‌کند؟', 'تمرین هدفمند باعث می‌شود کودک روی بخش‌هایی که نیاز بیشتری دارد تمرکز کند.', './images/news/news-04.jpg', 'یادگیری تعاملی کودک', 'آموزش', 'education', '2026-08-03 08:30:00', 1),
('new-learning-experience', 'تجربه جدید یادگیری در دیکته خونه', 'در طراحی جدید تلاش کرده‌ایم مسیر تمرین ساده‌تر، سریع‌تر و قابل فهم‌تر باشد.', './images/news/news-05.jpg', 'یادگیری تعاملی کودک', 'دیکته خونه', 'dikteh-khooneh', '2026-08-01 08:30:00', 1),
('importance-of-practice-and-repetition', 'چرا تمرین و تکرار در یادگیری مهم است؟', 'تمرین منظم یکی از اصلی‌ترین عوامل تثبیت مهارت‌های نوشتاری در کودکان است.', './images/news/news-06.jpg', 'یادگیری تعاملی کودک', 'آموزش', 'education', '2026-07-30 08:30:00', 1)
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    excerpt = VALUES(excerpt),
    image = VALUES(image),
    image_alt = VALUES(image_alt),
    category = VALUES(category),
    category_slug = VALUES(category_slug),
    published_at = VALUES(published_at),
    is_published = VALUES(is_published);


-- --------------------------------------------------------------------------
-- Rebuild gallery items for these news only
-- --------------------------------------------------------------------------

DELETE gallery
FROM news_gallery_items AS gallery
INNER JOIN news AS n
    ON n.id = gallery.news_id
WHERE n.slug IN
(
    'learning-with-games', 'new-spelling-exercises', 'schools-using-dikteh-khooneh', 'smart-practice-for-students', 'new-learning-experience', 'importance-of-practice-and-repetition'
);


INSERT INTO news_gallery_items
(
    news_id,
    src,
    alt,
    sort_order
)
SELECT
    n.id,
    source_data.src,
    source_data.alt,
    source_data.sort_order
FROM
(
    SELECT 'learning-with-games' AS slug, './images/news/news-01.jpg' AS src, 'یادگیری تعاملی کودک' AS alt, 1 AS sort_order
    UNION ALL
    SELECT 'learning-with-games' AS slug, './images/news/news-01.jpg' AS src, 'تمرین آموزشی کودک' AS alt, 2 AS sort_order
    UNION ALL
    SELECT 'learning-with-games' AS slug, './images/news/news-01.jpg' AS src, 'تجربه یادگیری با بازی' AS alt, 3 AS sort_order
    UNION ALL
    SELECT 'new-spelling-exercises' AS slug, './images/news/news-02.jpg' AS src, 'یادگیری تعاملی کودک' AS alt, 1 AS sort_order
    UNION ALL
    SELECT 'new-spelling-exercises' AS slug, './images/news/news-02.jpg' AS src, 'تمرین آموزشی کودک' AS alt, 2 AS sort_order
    UNION ALL
    SELECT 'new-spelling-exercises' AS slug, './images/news/news-02.jpg' AS src, 'تجربه یادگیری با بازی' AS alt, 3 AS sort_order
    UNION ALL
    SELECT 'schools-using-dikteh-khooneh' AS slug, './images/news/news-03.jpg' AS src, 'یادگیری تعاملی کودک' AS alt, 1 AS sort_order
    UNION ALL
    SELECT 'schools-using-dikteh-khooneh' AS slug, './images/news/news-03.jpg' AS src, 'تمرین آموزشی کودک' AS alt, 2 AS sort_order
    UNION ALL
    SELECT 'schools-using-dikteh-khooneh' AS slug, './images/news/news-03.jpg' AS src, 'تجربه یادگیری با بازی' AS alt, 3 AS sort_order
    UNION ALL
    SELECT 'smart-practice-for-students' AS slug, './images/news/news-04.jpg' AS src, 'یادگیری تعاملی کودک' AS alt, 1 AS sort_order
    UNION ALL
    SELECT 'smart-practice-for-students' AS slug, './images/news/news-04.jpg' AS src, 'تمرین آموزشی کودک' AS alt, 2 AS sort_order
    UNION ALL
    SELECT 'smart-practice-for-students' AS slug, './images/news/news-04.jpg' AS src, 'تجربه یادگیری با بازی' AS alt, 3 AS sort_order
    UNION ALL
    SELECT 'new-learning-experience' AS slug, './images/news/news-05.jpg' AS src, 'یادگیری تعاملی کودک' AS alt, 1 AS sort_order
    UNION ALL
    SELECT 'new-learning-experience' AS slug, './images/news/news-05.jpg' AS src, 'تمرین آموزشی کودک' AS alt, 2 AS sort_order
    UNION ALL
    SELECT 'new-learning-experience' AS slug, './images/news/news-05.jpg' AS src, 'تجربه یادگیری با بازی' AS alt, 3 AS sort_order
    UNION ALL
    SELECT 'importance-of-practice-and-repetition' AS slug, './images/news/news-06.jpg' AS src, 'یادگیری تعاملی کودک' AS alt, 1 AS sort_order
    UNION ALL
    SELECT 'importance-of-practice-and-repetition' AS slug, './images/news/news-06.jpg' AS src, 'تمرین آموزشی کودک' AS alt, 2 AS sort_order
    UNION ALL
    SELECT 'importance-of-practice-and-repetition' AS slug, './images/news/news-06.jpg' AS src, 'تجربه یادگیری با بازی' AS alt, 3 AS sort_order
) AS source_data
INNER JOIN news AS n
    ON n.slug = source_data.slug
ORDER BY
    n.id,
    source_data.sort_order;


-- --------------------------------------------------------------------------
-- Rebuild content blocks for these news only
-- --------------------------------------------------------------------------

DELETE content_block
FROM news_content_blocks AS content_block
INNER JOIN news AS n
    ON n.id = content_block.news_id
WHERE n.slug IN
(
    'learning-with-games', 'new-spelling-exercises', 'schools-using-dikteh-khooneh', 'smart-practice-for-students', 'new-learning-experience', 'importance-of-practice-and-repetition'
);


INSERT INTO news_content_blocks
(
    news_id,
    content,
    sort_order
)
SELECT
    n.id,
    source_data.content,
    source_data.sort_order
FROM
(
    SELECT 'learning-with-games' AS slug, 'یادگیری برای کودکان زمانی مؤثرتر می‌شود که تمرین از یک فعالیت تکراری به تجربه‌ای جذاب و قابل تعامل تبدیل شود. بازی می‌تواند فضای یادگیری را از حالت رسمی و خشک خارج کند و باعث شود کودک با انگیزه بیشتری در فرآیند آموزش حضور داشته باشد.' AS content, 1 AS sort_order
    UNION ALL
    SELECT 'learning-with-games' AS slug, 'در بسیاری از فعالیت‌های آموزشی، کودک زمانی تمرکز بیشتری نشان می‌دهد که احساس کند در حال انجام یک بازی یا حل یک چالش است. همین موضوع کمک می‌کند تمرین‌های تکراری بدون ایجاد خستگی ادامه پیدا کنند و مطالب بهتر در ذهن تثبیت شوند.' AS content, 2 AS sort_order
    UNION ALL
    SELECT 'learning-with-games' AS slug, 'ترکیب آموزش و بازی همچنین فرصت خوبی برای دریافت بازخورد سریع ایجاد می‌کند. کودک می‌تواند نتیجه عملکرد خود را ببیند، اشتباهاتش را اصلاح کند و دوباره برای رسیدن به نتیجه بهتر تلاش کند؛ بدون اینکه احساس شکست یا فشار داشته باشد.' AS content, 3 AS sort_order
    UNION ALL
    SELECT 'learning-with-games' AS slug, 'در دیکته خونه تلاش می‌کنیم تمرین‌های آموزشی را به شکلی طراحی کنیم که کودک در کنار یادگیری، از مسیر تمرین هم لذت ببرد. هدف این است که تمرین به بخشی طبیعی و دوست‌داشتنی از فرآیند یادگیری تبدیل شود.' AS content, 4 AS sort_order
    UNION ALL
    SELECT 'new-spelling-exercises' AS slug, 'مجموعه جدیدی از تمرین‌های دیکته و مهارت‌های نوشتاری به دیکته خونه اضافه شده است. این تمرین‌ها با هدف ایجاد تنوع بیشتر در مسیر یادگیری و فراهم کردن فرصت‌های بیشتر برای تمرین دانش‌آموزان طراحی شده‌اند.' AS content, 1 AS sort_order
    UNION ALL
    SELECT 'new-spelling-exercises' AS slug, 'در طراحی تمرین‌های جدید تلاش شده است فعالیت‌ها کوتاه، قابل فهم و متناسب با روند یادگیری کودکان باشند تا دانش‌آموز بتواند بدون سردرگمی وارد تمرین شود و تمرکز خود را روی یادگیری حفظ کند.' AS content, 2 AS sort_order
    UNION ALL
    SELECT 'new-spelling-exercises' AS slug, 'تنوع در نوع تمرین‌ها باعث می‌شود کودک با شکل‌های مختلفی از کلمات و فعالیت‌های نوشتاری مواجه شود. این موضوع به کاهش یکنواختی و افزایش انگیزه برای ادامه تمرین کمک می‌کند.' AS content, 3 AS sort_order
    UNION ALL
    SELECT 'new-spelling-exercises' AS slug, 'این تمرین‌ها با هدف ایجاد تنوع بیشتر و کمک به تکرار هدفمند طراحی شده‌اند و در ادامه نیز مجموعه‌های جدیدی متناسب با نیازهای آموزشی دانش‌آموزان به دیکته خونه اضافه خواهد شد.' AS content, 4 AS sort_order
    UNION ALL
    SELECT 'schools-using-dikteh-khooneh' AS slug, 'مدارس بیشتری در نقاط مختلف کشور استفاده از دیکته خونه را آغاز کرده‌اند و این روند در حال گسترش است. اضافه شدن مدارس جدید نشان می‌دهد استفاده از ابزارهای دیجیتال آموزشی می‌تواند در کنار روش‌های سنتی، تجربه متفاوتی برای دانش‌آموزان و معلمان ایجاد کند.' AS content, 1 AS sort_order
    UNION ALL
    SELECT 'schools-using-dikteh-khooneh' AS slug, 'دسترسی ساده به تمرین‌ها این امکان را فراهم می‌کند که دانش‌آموزان علاوه بر محیط مدرسه، در خانه نیز مسیر یادگیری خود را ادامه دهند و تمرین‌ها را در زمان مناسب خود انجام دهند.' AS content, 2 AS sort_order
    UNION ALL
    SELECT 'schools-using-dikteh-khooneh' AS slug, 'برای مدارس نیز استفاده از یک بستر یکپارچه می‌تواند به ایجاد نظم بیشتر در فعالیت‌های آموزشی و ارائه تمرین‌های متنوع‌تر به دانش‌آموزان کمک کند.' AS content, 3 AS sort_order
    UNION ALL
    SELECT 'schools-using-dikteh-khooneh' AS slug, 'هدف ما ایجاد بستری ساده و قابل استفاده برای دانش‌آموزان، معلمان و مدارس در نقاط مختلف کشور است تا دسترسی به محتوای آموزشی با کیفیت، ساده‌تر و گسترده‌تر شود.' AS content, 4 AS sort_order
    UNION ALL
    SELECT 'smart-practice-for-students' AS slug, 'همه دانش‌آموزان در یک سطح و با یک سرعت یاد نمی‌گیرند. ممکن است یک کودک در بخشی از درس عملکرد بسیار خوبی داشته باشد اما در موضوع دیگری به تمرین و تکرار بیشتری نیاز داشته باشد.' AS content, 1 AS sort_order
    UNION ALL
    SELECT 'smart-practice-for-students' AS slug, 'تمرین هوشمند تلاش می‌کند مسیر یادگیری را متناسب با نیاز واقعی دانش‌آموز هدفمندتر کند. به جای تکرار یکسان همه مطالب، تمرکز بیشتری روی بخش‌هایی قرار می‌گیرد که کودک در آن‌ها نیاز به تمرین بیشتری دارد.' AS content, 2 AS sort_order
    UNION ALL
    SELECT 'smart-practice-for-students' AS slug, 'این روش می‌تواند زمان تمرین را مؤثرتر کند و از خستگی ناشی از تکرار مطالبی که دانش‌آموز از قبل بر آن‌ها مسلط است جلوگیری کند. در نتیجه کودک فرصت بیشتری برای کار روی نقاط ضعف خود خواهد داشت.' AS content, 3 AS sort_order
    UNION ALL
    SELECT 'smart-practice-for-students' AS slug, 'تمرین هوشمند می‌تواند به کودک کمک کند مسیر پیشرفت خود را بهتر تجربه کند و با مشاهده نتیجه تمرین‌هایش، انگیزه بیشتری برای ادامه یادگیری داشته باشد.' AS content, 4 AS sort_order
    UNION ALL
    SELECT 'new-learning-experience' AS slug, 'در تجربه جدید دیکته خونه تلاش کرده‌ایم مسیر ورود به تمرین‌ها و استفاده از بخش‌های مختلف ساده‌تر و قابل فهم‌تر باشد. هدف اصلی این بوده است که کودک بدون درگیر شدن با گزینه‌های پیچیده، سریع‌تر به فعالیت موردنظر خود برسد.' AS content, 1 AS sort_order
    UNION ALL
    SELECT 'new-learning-experience' AS slug, 'سادگی رابط کاربری در یک محصول آموزشی اهمیت زیادی دارد. زمانی که ساختار صفحات واضح باشد، تمرکز دانش‌آموز به جای پیدا کردن مسیرها و گزینه‌ها، روی خود فعالیت آموزشی باقی می‌ماند.' AS content, 2 AS sort_order
    UNION ALL
    SELECT 'new-learning-experience' AS slug, 'در طراحی جدید همچنین تلاش شده است میان محتوای آموزشی، عناصر تعاملی و فضای بصری تعادل مناسبی ایجاد شود تا محیط برای کودک جذاب باشد اما باعث حواس‌پرتی او نشود.' AS content, 3 AS sort_order
    UNION ALL
    SELECT 'new-learning-experience' AS slug, 'هدف این است که دیکته خونه تجربه‌ای روان، قابل پیش‌بینی و دوست‌داشتنی ایجاد کند؛ به شکلی که کودک بتواند با کمترین پیچیدگی وارد فرآیند تمرین و یادگیری شود.' AS content, 4 AS sort_order
    UNION ALL
    SELECT 'importance-of-practice-and-repetition' AS slug, 'یادگیری مهارت‌های نوشتاری بدون تمرین و تکرار مداوم دشوار است. کودک برای اینکه بتواند شکل صحیح کلمات، نحوه نوشتن و کاربرد آن‌ها را به خوبی به خاطر بسپارد، نیاز دارد چندین بار با آن‌ها مواجه شود.' AS content, 1 AS sort_order
    UNION ALL
    SELECT 'importance-of-practice-and-repetition' AS slug, 'تکرار منظم کمک می‌کند اطلاعات از حافظه کوتاه‌مدت به حافظه پایدارتر منتقل شوند. به همین دلیل تمرین‌های کوتاه و پیوسته معمولاً تأثیر بیشتری نسبت به تمرین‌های سنگین و پراکنده دارند.' AS content, 2 AS sort_order
    UNION ALL
    SELECT 'importance-of-practice-and-repetition' AS slug, 'نکته مهم این است که تکرار نباید همیشه به یک شکل انجام شود. تغییر در نوع تمرین، شیوه ارائه و سطح چالش می‌تواند از یکنواخت شدن فرآیند جلوگیری کند و انگیزه کودک را حفظ کند.' AS content, 3 AS sort_order
    UNION ALL
    SELECT 'importance-of-practice-and-repetition' AS slug, 'تمرین‌های کوتاه اما منظم معمولاً نتیجه بهتری نسبت به جلسات طولانی و پراکنده ایجاد می‌کنند و به کودک فرصت می‌دهند مهارت‌های خود را قدم‌به‌قدم تثبیت و تقویت کند.' AS content, 4 AS sort_order
) AS source_data
INNER JOIN news AS n
    ON n.slug = source_data.slug
ORDER BY
    n.id,
    source_data.sort_order;


COMMIT;


-- --------------------------------------------------------------------------
-- Verification
-- --------------------------------------------------------------------------

SELECT
    COUNT(*) AS seeded_news_count
FROM news
WHERE slug IN
(
    'learning-with-games', 'new-spelling-exercises', 'schools-using-dikteh-khooneh', 'smart-practice-for-students', 'new-learning-experience', 'importance-of-practice-and-repetition'
);


SELECT
    COUNT(*) AS seeded_gallery_count
FROM news_gallery_items AS gallery
INNER JOIN news AS n
    ON n.id = gallery.news_id
WHERE n.slug IN
(
    'learning-with-games', 'new-spelling-exercises', 'schools-using-dikteh-khooneh', 'smart-practice-for-students', 'new-learning-experience', 'importance-of-practice-and-repetition'
);


SELECT
    COUNT(*) AS seeded_content_block_count
FROM news_content_blocks AS content_block
INNER JOIN news AS n
    ON n.id = content_block.news_id
WHERE n.slug IN
(
    'learning-with-games', 'new-spelling-exercises', 'schools-using-dikteh-khooneh', 'smart-practice-for-students', 'new-learning-experience', 'importance-of-practice-and-repetition'
);

-- Expected:
-- seeded_news_count          = 6
-- seeded_gallery_count       = 18
-- seeded_content_block_count = 24
