-- 003_seed_system_grade_folders.sql
-- Global default learning content for grades 1..6.
-- Run migration 012 first.
-- System folders have user_id = NULL and are not owned by any user.
-- Rerunnable: deterministic IDs + ON DUPLICATE KEY UPDATE.

START TRANSACTION;

INSERT INTO folders (id, user_id, title, type, grade)
VALUES
    ('2b4352f9-eff1-51d9-b0e9-b1cb3f327261', NULL, 'دیکته پایه اول', 'dictation', 1),
    ('c9d7e065-2737-5d4e-bd5f-adad15ce5897', NULL, 'علوم پایه اول', 'science', 1),
    ('f00db08e-3811-5687-a1a3-4ead84dcbce5', NULL, 'دیکته پایه دوم', 'dictation', 2),
    ('2c4ab458-a63d-5734-80d2-51b2b6885635', NULL, 'علوم پایه دوم', 'science', 2),
    ('d3105dfc-d05e-5504-80c5-b5b8d90e6c95', NULL, 'دیکته پایه سوم', 'dictation', 3),
    ('7a59f35e-2df5-536e-bd4e-37d9e608a236', NULL, 'علوم پایه سوم', 'science', 3),
    ('3274602e-85bd-53b6-bc82-f96cf0ab8ca6', NULL, 'دیکته پایه چهارم', 'dictation', 4),
    ('4ad10f23-bb0c-5393-92de-5e62d0adb4e4', NULL, 'علوم پایه چهارم', 'science', 4),
    ('9c274a4e-4412-5a5f-85bf-c6548de0282c', NULL, 'دیکته پایه پنجم', 'dictation', 5),
    ('0ad27e8b-8101-54dd-8390-528aaec76c6e', NULL, 'علوم پایه پنجم', 'science', 5),
    ('f8d76015-26a6-57a7-a3a6-b6b90c86fa38', NULL, 'دیکته پایه ششم', 'dictation', 6),
    ('f207dfbd-f377-5c34-bf74-548aa2f92310', NULL, 'علوم پایه ششم', 'science', 6)
ON DUPLICATE KEY UPDATE
    user_id = VALUES(user_id),
    title = VALUES(title),
    type = VALUES(type),
    grade = VALUES(grade);

INSERT INTO words (id, folder_id, word, description)
VALUES
    ('d032c40b-695b-5635-8416-4f8f98dd17bc', '2b4352f9-eff1-51d9-b0e9-b1cb3f327261', 'آب', NULL),
    ('b3ab565e-5601-54e3-91c0-e8ebeaab9226', '2b4352f9-eff1-51d9-b0e9-b1cb3f327261', 'بابا', NULL),
    ('5b7d3b75-b1b4-5489-9250-145a17356542', '2b4352f9-eff1-51d9-b0e9-b1cb3f327261', 'مادر', NULL),
    ('fe618e37-a065-51eb-a9c3-23c530f1f32b', '2b4352f9-eff1-51d9-b0e9-b1cb3f327261', 'خانه', NULL),
    ('9032d784-94e4-570c-a027-29142837afe8', '2b4352f9-eff1-51d9-b0e9-b1cb3f327261', 'کتاب', NULL),
    ('a2d78288-8581-5227-84cc-f221fe2775f1', '2b4352f9-eff1-51d9-b0e9-b1cb3f327261', 'مدرسه', NULL),
    ('96d653a5-1cf6-5a10-a70b-9007dcb25cfd', '2b4352f9-eff1-51d9-b0e9-b1cb3f327261', 'دوست', NULL),
    ('86c545a8-eade-5168-ac47-4f7fcd347b45', '2b4352f9-eff1-51d9-b0e9-b1cb3f327261', 'باران', NULL),
    ('14a6a46f-83b7-52d7-a2ba-23a84630202d', '2b4352f9-eff1-51d9-b0e9-b1cb3f327261', 'آسمان', NULL),
    ('58ada115-2825-5782-8a30-7734f3b8e94e', '2b4352f9-eff1-51d9-b0e9-b1cb3f327261', 'درخت', NULL),
    ('d6ff5d6e-da5f-5145-b5f9-eb53ee938a8f', 'f00db08e-3811-5687-a1a3-4ead84dcbce5', 'پرنده', NULL),
    ('23d8547c-1d26-5ebe-bfe9-09c3815f51df', 'f00db08e-3811-5687-a1a3-4ead84dcbce5', 'خورشید', NULL),
    ('d649fad6-9ec2-58ea-b658-616088d3c81e', 'f00db08e-3811-5687-a1a3-4ead84dcbce5', 'مهربانی', NULL),
    ('5e77f9f4-e5c8-54cb-97b0-cd7b09b29d62', 'f00db08e-3811-5687-a1a3-4ead84dcbce5', 'خانواده', NULL),
    ('91d055ba-a7e7-53b4-89d3-88a68049f30c', 'f00db08e-3811-5687-a1a3-4ead84dcbce5', 'باغچه', NULL),
    ('ed890cfd-f3e3-59d1-b9a0-e6f7b2dd73f5', 'f00db08e-3811-5687-a1a3-4ead84dcbce5', 'دانش‌آموز', NULL),
    ('33f27f26-2015-5948-a42d-7f3060236f30', 'f00db08e-3811-5687-a1a3-4ead84dcbce5', 'کلاس', NULL),
    ('a4bf4066-ea60-5301-b993-e4203f880d8d', 'f00db08e-3811-5687-a1a3-4ead84dcbce5', 'پاییز', NULL),
    ('d3f3a270-b403-5907-ac73-e5121fdb4569', 'f00db08e-3811-5687-a1a3-4ead84dcbce5', 'زمستان', NULL),
    ('c9e18850-4a8e-5582-afcf-f83ad913b8aa', 'f00db08e-3811-5687-a1a3-4ead84dcbce5', 'بهار', NULL),
    ('c9ee0676-139e-5af5-bcd0-d403bfa0efa6', 'd3105dfc-d05e-5504-80c5-b5b8d90e6c95', 'طبیعت', NULL),
    ('7900347b-619b-5862-bb13-cd4ad0066788', 'd3105dfc-d05e-5504-80c5-b5b8d90e6c95', 'ایران', NULL),
    ('024e5e06-7ce4-559d-bf32-dfd5cdf54f97', 'd3105dfc-d05e-5504-80c5-b5b8d90e6c95', 'همکاری', NULL),
    ('972a9f8e-30c5-5f75-acd9-6ccb8d088a0d', 'd3105dfc-d05e-5504-80c5-b5b8d90e6c95', 'تلاش', NULL),
    ('7963569a-319c-5485-b583-bd09612852d2', 'd3105dfc-d05e-5504-80c5-b5b8d90e6c95', 'روستا', NULL),
    ('63da0ff6-841c-55f1-b9dd-b5ea09d057d5', 'd3105dfc-d05e-5504-80c5-b5b8d90e6c95', 'کشاورز', NULL),
    ('fdb58c8b-dc31-5d54-a832-f0f70a1f939c', 'd3105dfc-d05e-5504-80c5-b5b8d90e6c95', 'رودخانه', NULL),
    ('ee8aaac5-c458-5577-ac48-4decc233588a', 'd3105dfc-d05e-5504-80c5-b5b8d90e6c95', 'کتابخانه', NULL),
    ('bcbbf3f3-c5fa-58ea-a491-42407dcd12e7', 'd3105dfc-d05e-5504-80c5-b5b8d90e6c95', 'ورزش', NULL),
    ('b4ecf1f7-c4fe-5795-83d6-557c8472ad12', 'd3105dfc-d05e-5504-80c5-b5b8d90e6c95', 'پرچم', NULL),
    ('2aee1987-36eb-5ab3-a78b-13aa547226fe', '3274602e-85bd-53b6-bc82-f96cf0ab8ca6', 'مسئولیت', NULL),
    ('adf2b19d-2545-53b9-b971-9ca63f9faee5', '3274602e-85bd-53b6-bc82-f96cf0ab8ca6', 'دانایی', NULL),
    ('722ccbb7-dbb3-5ed5-a585-23517cc04cf9', '3274602e-85bd-53b6-bc82-f96cf0ab8ca6', 'پژوهش', NULL),
    ('7c960f58-62cb-5620-80a5-29709d0d9fa0', '3274602e-85bd-53b6-bc82-f96cf0ab8ca6', 'محیط‌زیست', NULL),
    ('c41aab87-44ad-5975-9f78-6728d4081706', '3274602e-85bd-53b6-bc82-f96cf0ab8ca6', 'همدلی', NULL),
    ('5728e717-27cd-5b86-b2b4-5e9bb24a7deb', '3274602e-85bd-53b6-bc82-f96cf0ab8ca6', 'آفرینش', NULL),
    ('0f85c1e5-ee97-565f-940c-d3aed76d9387', '3274602e-85bd-53b6-bc82-f96cf0ab8ca6', 'سرزمین', NULL),
    ('8c7eac5a-5224-5b66-ae79-442946a1612a', '3274602e-85bd-53b6-bc82-f96cf0ab8ca6', 'موفقیت', NULL),
    ('00431ed6-ac46-50f4-bf61-4f60f24a55ce', '3274602e-85bd-53b6-bc82-f96cf0ab8ca6', 'تجربه', NULL),
    ('d47122ca-21bb-57cd-8b75-d50fd35d3341', '3274602e-85bd-53b6-bc82-f96cf0ab8ca6', 'آموزش', NULL),
    ('a3f2fdb4-bcc0-52f2-b7df-2d11500eab64', '9c274a4e-4412-5a5f-85bf-c6548de0282c', 'فناوری', NULL),
    ('e0432e64-4980-55d7-836d-35c6fab53572', '9c274a4e-4412-5a5f-85bf-c6548de0282c', 'دانشمند', NULL),
    ('2a6e669d-fdb8-5c37-bd8d-c2bf64b9b3a2', '9c274a4e-4412-5a5f-85bf-c6548de0282c', 'فرهنگ', NULL),
    ('98cba214-1c2c-50d5-82a8-98aded20dc6a', '9c274a4e-4412-5a5f-85bf-c6548de0282c', 'تمدن', NULL),
    ('59afebe1-8db3-5fd1-878f-bfca2768e6cd', '9c274a4e-4412-5a5f-85bf-c6548de0282c', 'انرژی', NULL),
    ('8b02be54-b546-5e60-96f8-202ab913b025', '9c274a4e-4412-5a5f-85bf-c6548de0282c', 'اقیانوس', NULL),
    ('155e724c-aba0-5fa7-8768-5f70ebe76a45', '9c274a4e-4412-5a5f-85bf-c6548de0282c', 'قهرمان', NULL),
    ('43c19442-9ab4-5c34-8fe1-f0ceb25218e9', '9c274a4e-4412-5a5f-85bf-c6548de0282c', 'استقلال', NULL),
    ('66685ed7-3c9e-59e6-8729-b4ed4bb2e15c', '9c274a4e-4412-5a5f-85bf-c6548de0282c', 'خلاقیت', NULL),
    ('bd6d65eb-be8f-5b6d-916f-509bc83babf0', '9c274a4e-4412-5a5f-85bf-c6548de0282c', 'آینده', NULL),
    ('19549df9-7a8c-572b-a618-a0aa7b56d494', 'f8d76015-26a6-57a7-a3a6-b6b90c86fa38', 'پژوهشگر', NULL),
    ('54a23867-78ed-527d-8b2c-760ef05c9428', 'f8d76015-26a6-57a7-a3a6-b6b90c86fa38', 'مسئولیت‌پذیری', NULL),
    ('0873b2ed-5c48-543c-b5ad-cc2cd440578c', 'f8d76015-26a6-57a7-a3a6-b6b90c86fa38', 'زیست‌بوم', NULL),
    ('fc017949-bd18-59b6-9a1f-4834404094ad', 'f8d76015-26a6-57a7-a3a6-b6b90c86fa38', 'دستاورد', NULL),
    ('523d730d-e288-5e1d-828b-1d9094961505', 'f8d76015-26a6-57a7-a3a6-b6b90c86fa38', 'ارتباطات', NULL),
    ('8ecfefde-478d-5242-8a5f-52267f2f7ed3', 'f8d76015-26a6-57a7-a3a6-b6b90c86fa38', 'پایداری', NULL),
    ('a0a70d54-919d-5880-a8d3-a1672b369f6d', 'f8d76015-26a6-57a7-a3a6-b6b90c86fa38', 'منابع', NULL),
    ('358e898b-d000-552e-9846-e75adbfff098', 'f8d76015-26a6-57a7-a3a6-b6b90c86fa38', 'اندیشه', NULL),
    ('35f79742-3220-5624-83a1-8351c41ef604', 'f8d76015-26a6-57a7-a3a6-b6b90c86fa38', 'نوآوری', NULL),
    ('5396d19f-8c18-5cd9-8334-80786d0b70fb', 'f8d76015-26a6-57a7-a3a6-b6b90c86fa38', 'همزیستی', NULL)
ON DUPLICATE KEY UPDATE
    folder_id = VALUES(folder_id),
    word = VALUES(word),
    description = VALUES(description);

INSERT INTO science_questions (id, folder_id, question, answer)
VALUES
    ('c9477e49-0fb8-5546-aed4-d25b9a2bf9aa', 'c9d7e065-2737-5d4e-bd5f-adad15ce5897', 'برای دیدن چیزها از کدام عضو بدن استفاده می‌کنیم؟', 'از چشم‌ها.'),
    ('11a34ae2-1fb3-5b6d-8780-e6e75db09041', 'c9d7e065-2737-5d4e-bd5f-adad15ce5897', 'گیاه برای رشد به چه چیزهایی نیاز دارد؟', 'به آب، نور و هوای مناسب.'),
    ('a31ae90e-c16e-5a86-ba12-4a0ef4b85aae', 'c9d7e065-2737-5d4e-bd5f-adad15ce5897', 'روز با چه چیزی روشن می‌شود؟', 'با نور خورشید.'),
    ('83b792b2-71aa-5dea-911f-db6fd00b9718', 'c9d7e065-2737-5d4e-bd5f-adad15ce5897', 'برای شنیدن صداها از کدام عضو بدن استفاده می‌کنیم؟', 'از گوش‌ها.'),
    ('f25af2d4-2a1f-5f36-886e-205f2c7805d4', 'c9d7e065-2737-5d4e-bd5f-adad15ce5897', 'آب در حالت معمول چه رنگی دارد؟', 'آب خالص بی‌رنگ است.'),
    ('d8856265-2923-58a1-83f0-abffa548cff3', '2c4ab458-a63d-5734-80d2-51b2b6885635', 'کدام بخش گیاه آب را از خاک می‌گیرد؟', 'ریشه.'),
    ('4ee5238a-9514-557b-8d8c-c97a43e17ca6', '2c4ab458-a63d-5734-80d2-51b2b6885635', 'خورشید چه چیزی به زمین می‌دهد؟', 'نور و گرما.'),
    ('52a2e596-23f4-580b-beae-158945332bab', '2c4ab458-a63d-5734-80d2-51b2b6885635', 'سه حالت اصلی آب چیست؟', 'جامد، مایع و گاز.'),
    ('c1c78fd3-d5e0-5016-9747-beffcfef483b', '2c4ab458-a63d-5734-80d2-51b2b6885635', 'جانوران برای زنده ماندن به چه چیزهایی نیاز دارند؟', 'آب، غذا، هوا و محیط مناسب.'),
    ('da56b492-3a89-5af2-b643-5e972c850a7b', '2c4ab458-a63d-5734-80d2-51b2b6885635', 'سایه چگونه تشکیل می‌شود؟', 'وقتی جسمی جلوی نور را بگیرد.'),
    ('fc0acb79-b67d-5185-b2b9-ddc4afe2b05c', '7a59f35e-2df5-536e-bd4e-37d9e608a236', 'مواد معمولاً در چند حالت اصلی دیده می‌شوند؟', 'سه حالت: جامد، مایع و گاز.'),
    ('6ba430bd-c54f-5108-84f3-df705fed44c6', '7a59f35e-2df5-536e-bd4e-37d9e608a236', 'تبخیر چیست؟', 'تبدیل مایع به بخار یا گاز.'),
    ('8d089b83-569d-5817-8cd2-12cc0d0f007e', '7a59f35e-2df5-536e-bd4e-37d9e608a236', 'چرا گیاهان سبز به نور نیاز دارند؟', 'برای ساخت غذا و رشد.'),
    ('cd0f080e-3a5d-5cba-8a83-1bcda7c946cf', '7a59f35e-2df5-536e-bd4e-37d9e608a236', 'یک منبع طبیعی آب شیرین نام ببرید.', 'رودخانه، چشمه یا آب زیرزمینی.'),
    ('988d0822-3e88-55d3-8815-11829cce2917', '7a59f35e-2df5-536e-bd4e-37d9e608a236', 'نیرو چه اثری بر اجسام می‌تواند داشته باشد؟', 'می‌تواند حرکت، سرعت، جهت یا شکل جسم را تغییر دهد.'),
    ('859992e9-89bf-531d-ac70-3874d1fe39b7', '4ad10f23-bb0c-5393-92de-5e62d0adb4e4', 'زنجیره غذایی چیست؟', 'رابطه‌ای که نشان می‌دهد جانداران چگونه از یکدیگر یا از گیاهان غذا می‌گیرند.'),
    ('d9c745b3-85d7-5818-9c38-c4875b7d435c', '4ad10f23-bb0c-5393-92de-5e62d0adb4e4', 'هادی الکتریکی چیست؟', 'ماده‌ای که جریان برق را به‌خوبی از خود عبور می‌دهد.'),
    ('5336f052-f048-540a-b1e9-a1d4f0c86f50', '4ad10f23-bb0c-5393-92de-5e62d0adb4e4', 'چرا حفاظت از خاک مهم است؟', 'چون خاک برای رشد گیاهان و تولید غذا ضروری است.'),
    ('eab01122-1969-5eae-99e6-cd6f70ae4020', '4ad10f23-bb0c-5393-92de-5e62d0adb4e4', 'مخلوط چیست؟', 'ترکیب دو یا چند ماده که ویژگی‌های اصلی آن‌ها تا حدی حفظ می‌شود.'),
    ('1458f398-6b5e-5faf-be75-0e3fc8022ec9', '4ad10f23-bb0c-5393-92de-5e62d0adb4e4', 'آهن‌ربا بیشتر چه موادی را جذب می‌کند؟', 'مواد آهنی و برخی فلزات مانند آهن و فولاد.'),
    ('8bcc27cb-6a00-520d-968c-941bfedaffd2', '0ad27e8b-8101-54dd-8390-528aaec76c6e', 'سلول چیست؟', 'کوچک‌ترین واحد زنده سازنده بدن جانداران.'),
    ('1392f3ea-7982-5726-8e91-b9f10761105d', '0ad27e8b-8101-54dd-8390-528aaec76c6e', 'چرا زمین‌لرزه رخ می‌دهد؟', 'به‌دلیل آزاد شدن انرژی در اثر حرکت و جابه‌جایی بخش‌هایی از پوسته زمین.'),
    ('15ea4800-e66e-535c-b072-c35e9fdf20bf', '0ad27e8b-8101-54dd-8390-528aaec76c6e', 'اهرم چه کمکی به ما می‌کند؟', 'انجام کار را با تغییر مقدار یا جهت نیرو آسان‌تر می‌کند.'),
    ('4dd618bf-46fe-535a-a130-1f46beb45d3f', '0ad27e8b-8101-54dd-8390-528aaec76c6e', 'نور هنگام عبور از بعضی مواد چه رفتاری دارد؟', 'ممکن است عبور کند، بازتاب شود یا جذب شود.'),
    ('ee363259-2678-54d5-b216-bb4bc07ecd6f', '0ad27e8b-8101-54dd-8390-528aaec76c6e', 'سوخت‌های فسیلی چگونه تشکیل شده‌اند؟', 'از بقایای جانداران گذشته در طی زمان بسیار طولانی.'),
    ('17685d74-4601-51a4-ad08-2a158292201b', 'f207dfbd-f377-5c34-bf74-548aa2f92310', 'فتوسنتز چیست؟', 'فرایندی که گیاهان سبز با استفاده از نور، آب و دی‌اکسیدکربن غذا می‌سازند.'),
    ('ce32481a-dc02-5e11-ab56-c47767e545dd', 'f207dfbd-f377-5c34-bf74-548aa2f92310', 'مدار الکتریکی بسته چه ویژگی‌ای دارد؟', 'مسیر جریان برق کامل است و جریان می‌تواند عبور کند.'),
    ('afb249fa-972c-5daa-9750-f94b5a38c96f', 'f207dfbd-f377-5c34-bf74-548aa2f92310', 'تجدیدپذیر بودن یک منبع انرژی یعنی چه؟', 'یعنی منبع در طبیعت دوباره و در زمان قابل استفاده جایگزین می‌شود.'),
    ('246c4ac2-ec5c-5aca-9f46-40c3c311442d', 'f207dfbd-f377-5c34-bf74-548aa2f92310', 'چرا تنوع زیستی مهم است؟', 'به پایداری زیست‌بوم‌ها و ادامه زندگی گونه‌های مختلف کمک می‌کند.'),
    ('005394c1-6cb1-5421-a974-cf2f806958c6', 'f207dfbd-f377-5c34-bf74-548aa2f92310', 'نیروی اصطکاک چیست؟', 'نیرویی که در برابر حرکت نسبی دو سطح در تماس مقاومت می‌کند.')
ON DUPLICATE KEY UPDATE
    folder_id = VALUES(folder_id),
    question = VALUES(question),
    answer = VALUES(answer);

COMMIT;

-- Verification: exactly 12 system folders, 60 words and 30 questions.
SELECT grade, type, title, user_id
FROM folders
WHERE user_id IS NULL
ORDER BY grade, type;

SELECT
    f.grade,
    f.type,
    f.title,
    COUNT(DISTINCT w.id) AS word_count,
    COUNT(DISTINCT sq.id) AS question_count
FROM folders f
LEFT JOIN words w ON w.folder_id = f.id
LEFT JOIN science_questions sq ON sq.folder_id = f.id
WHERE f.user_id IS NULL
GROUP BY f.id, f.grade, f.type, f.title
ORDER BY f.grade, f.type;
