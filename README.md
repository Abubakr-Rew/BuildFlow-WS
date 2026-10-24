# BuildBetter — сайт проекта

Одностраничный сайт BuildBetter — мобильного приложения для небольших строительных компаний Бишкека: прораб отправляет фото-отчёт с объекта, владелец видит ленту по каждому объекту.

Задача сайта — найти компании для бесплатного пилота на 2 недели и людей, готовых на интервью 20–30 минут.

Сделано на Astro 7, Tailwind CSS 4 и TypeScript. Сайт статический: нет бэкенда, базы данных, форм, cookies, трекеров и аналитики. Связь — только ссылки на Telegram, WhatsApp и почту.

## Что нужно

- [Node.js](https://nodejs.org/) 22.23.4 или новее (проверено на 24.11)
- npm (ставится вместе с Node.js)

## Запуск

```bash
npm install       # установить зависимости (один раз)
npm run dev       # режим разработки: http://localhost:4321, страница обновляется сама
npm run build     # проверка типов и сборка готового сайта в папку dist/
npm run preview   # открыть собранный сайт локально: http://localhost:4321
```

| Команда              | Что делает                                                                        |
| -------------------- | --------------------------------------------------------------------------------- |
| `npm run dev`        | Запускает сайт для разработки.                                                     |
| `npm run build`      | Проверяет код (`astro check`) и собирает сайт в `dist/`.                           |
| `npm run preview`    | Показывает собранный сайт из `dist/`.                                              |
| `npm run check`      | Только проверка типов.                                                             |
| `npm run verify`     | Автопроверка в браузере (см. «Проверка»). Нужен запущенный `preview`.             |
| `npm run lighthouse` | Отчёт Lighthouse для мобильных. Нужен запущенный `preview`.                        |

## Как поменять тексты

Все тексты страницы лежат в одном файле — [src/texts.ts](src/texts.ts). Меняйте строки в кавычках, остальное не трогайте. Неразрывные пробелы после коротких слов («в», «на», «за 2») ставятся автоматически.

Порядок секций задан в [src/pages/index.astro](src/pages/index.astro).

Важно: на сайте только правда. У проекта пока нет клиентов, отзывов, статистики и ссылок на магазины приложений — не добавляйте выдуманные отзывы, цифры, логотипы и кнопки «Скачать».

## Как поменять контакты и адрес сайта

Всё в файле [src/site.config.ts](src/site.config.ts). Значения-заглушки помечены `// TODO`. Пока они не заменены, сборка выводит предупреждение `[buildbetter] Placeholder values in src/site.config.ts: ...`.

| Поле                 | Что указать                                                              | Формат                         |
| -------------------- | ------------------------------------------------------------------------ | ------------------------------ |
| `siteUrl`            | Адрес сайта после публикации, без `/` в конце                            | `https://ваш-домен`            |
| `telegramUsername`   | Имя пользователя в Telegram, без `@`                                     | `ваш_username`                 |
| `whatsappNumber`     | Номер WhatsApp в международном формате, только цифры                     | `996XXXXXXXXX`                 |
| `email`              | Почта для связи                                                          | `имя@домен`                    |
| `messages.pilot`     | Текст, который подставится в чат по кнопке «Хочу пилот»                  | обычный текст                  |
| `messages.interview` | Текст для кнопки «Готов поговорить»                                      | обычный текст                  |
| `author.name`        | Имя автора (необязательно). Пусто — ничего не показывается               | `Имя Фамилия`                  |
| `author.photo`       | Фото автора (необязательно): положите квадратное фото в `public/`        | `/author.jpg`                  |

Ссылки на Telegram (`https://t.me/...?text=...`), WhatsApp (`https://wa.me/...?text=...`) и почту собираются из этих значений автоматически ([src/lib/links.ts](src/lib/links.ts)).

`siteUrl` используется для canonical-ссылки, Open Graph, `sitemap-index.xml` и `robots.txt`, поэтому укажите настоящий адрес до публикации.

## Фото в первом экране

Фон первого экрана — фото стройки на закате (источник и лицензия в [CREDITS.md](CREDITS.md)). Можно брать только свои фото или фото со свободной лицензией (например, Pexels или Unsplash), где нет узнаваемых людей и логотипов.

Чтобы заменить фото:

1. Скачайте оригинал в любую папку вне проекта.
2. Выполните `node scripts/prepare-hero-photo.mjs путь/к/фото.jpg`. Скрипт сделает два кадра в `src/assets/hero/` — широкий для компьютеров и вертикальный для телефонов — и приглушит цвета, чтобы оранжевый оставался самым ярким.
3. Запишите источник, автора и лицензию в `CREDITS.md`.
4. Запустите `npm run build` и `npm run verify`: проверка измерит контраст текста поверх нового фото.

При сборке Astro сам делает из кадров AVIF и WebP нескольких размеров.

## Публикация на бесплатном хостинге

Перед публикацией замените все `// TODO` в `src/site.config.ts`. Если адрес сайта станет известен только после первого деплоя, укажите его в `siteUrl` и опубликуйте ещё раз.

### Cloudflare Pages

1. Загрузите репозиторий на GitHub.
2. В панели Cloudflare откройте **Workers & Pages → Create → Pages → Connect to Git** и выберите репозиторий.
3. Настройки сборки: Framework preset — **Astro**, Build command — `npm run build`, Build output directory — `dist`.
4. В переменных окружения добавьте `NODE_VERSION` = `24`.
5. Нажмите **Save and Deploy**. Сайт будет доступен по адресу вида `https://<проект>.pages.dev`.

### Netlify

1. Загрузите репозиторий на GitHub.
2. В Netlify: **Add new site → Import an existing project → GitHub**, выберите репозиторий.
3. Build command — `npm run build`, Publish directory — `dist`.
4. В **Site configuration → Environment variables** добавьте `NODE_VERSION` = `24`.
5. Нажмите **Deploy**. Адрес будет вида `https://<имя>.netlify.app`.

### GitHub Pages

1. В `src/site.config.ts` укажите `siteUrl: 'https://<username>.github.io/<репозиторий>'`. Путь из адреса автоматически станет базовым путём сайта (`base`), ссылки и картинки это учитывают.
2. Создайте файл `.github/workflows/deploy.yml`:

   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [main]
     workflow_dispatch:

   permissions:
     contents: read
     pages: write
     id-token: write

   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v7
         - uses: withastro/action@v6

     deploy:
       needs: build
       runs-on: ubuntu-latest
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - id: deployment
           uses: actions/deploy-pages@v5
   ```

   Версии действий взяты из [документации Astro](https://docs.astro.build/en/guides/deploy/github/) (октябрь 2026); если сборка ругается на версии, сверьтесь с ней.
3. В репозитории откройте **Settings → Pages** и в **Source** выберите **GitHub Actions**.
4. Отправьте изменения в ветку `main` — сайт соберётся и опубликуется сам.

## Проверка

1. Соберите и запустите сайт: `npm run build`, затем `npm run preview` (оставьте работать).
2. В другом терминале: `npm run verify`. Скрипт [scripts/verify.mjs](scripts/verify.mjs) открывает сайт в установленном Google Chrome (через `playwright-core`) и проверяет:
   - скриншоты при ширине 375, 768, 1024 и 1440 px в светлой и тёмной теме — в `reports/screenshots/`;
   - нет горизонтальной прокрутки (в том числе на 320 и 360 px, в горизонтальной ориентации и при тексте 200%);
   - зоны нажатия не меньше 44 px, текст не мельче 12 px, контраст текста по WCAG AA в обеих темах;
   - контраст текста поверх фото — по реальным пикселям снимка; фото грузится в нужном кадре и формате;
   - первый экран на 1440×900 помещается целиком, а начало следующего раздела видно;
   - кнопки-якоря прокручивают к нужным секциям, ссылки на Telegram, WhatsApp и почту ведут на правильные адреса;
   - работа с клавиатуры (ссылка «Перейти к содержанию», видимый фокус), отключение анимаций при `prefers-reduced-motion`, нет ошибок в консоли.
3. `npm run lighthouse` — отчёт Lighthouse (мобильный режим) в `reports/lighthouse/mobile.report.html`.

Папка `reports/` не попадает в git.

## Структура проекта

```
src/
├── site.config.ts          адрес сайта, контакты, тексты сообщений, автор
├── texts.ts                все тексты страницы
├── pages/
│   ├── index.astro         страница: порядок секций
│   ├── og.png.ts           картинка для соцсетей 1200×630 (создаётся при сборке)
│   ├── favicon.svg.ts      иконки сайта (SVG, PNG, Apple touch icon)
│   ├── favicon-32.png.ts
│   ├── apple-touch-icon.png.ts
│   └── robots.txt.ts
├── layouts/BaseLayout.astro   <head>: SEO-теги, шрифты; шапка и подвал
├── components/             секции страницы и общие элементы (кнопки, логотип)
├── assets/hero/            фото первого экрана (два кадра)
├── lib/                    ссылки на мессенджеры, типограф, генерация картинок
└── styles/global.css       цвета светлой и тёмной темы, сетка, анимации
scripts/
├── verify.mjs              автоматическая проверка в браузере
└── prepare-hero-photo.mjs  подготовка фото первого экрана
BRIEF.md                    исходное задание
CREDITS.md                  источники и лицензии (фото, шрифты, иконки)
CLAUDE.md                   памятка для работы с Claude Code
```

Шрифты Golos Text и Manrope подключаются из пакетов `@fontsource-variable` и раздаются с самого сайта — внешних запросов нет.
