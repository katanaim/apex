# APEX — защита OpenRouter-ключа

## Главное правило
**Ключ НЕЛЬЗЯ класть в браузер.** GitHub Pages — это статика: любой ключ в JS виден через «исходный код» / вкладку Network. Пароль на клиенте проверяется тоже в браузере → обходится за секунды. Поэтому пароль ключ НЕ защищает.

**Решение:** ключ живёт на сервере (Cloudflare Worker), как секрет. Браузер зовёт Worker, Worker зовёт OpenRouter. Ключ в браузер не уходит никогда — украсть нельзя в принципе.

## Три слоя защиты (в `worker.js`)
1. **Ключ — серверный секрет.** `wrangler secret put OPENROUTER_API_KEY`. Не в git, не в браузере. ← это и есть настоящая защита.
2. **Origin-lock.** Worker отвечает только запросам с `https://katanaim.github.io`. Чужой сайт встроить не сможет.
3. **Rate-limit (по IP).** Не больше 12 сканов/час с одного IP → даже если кто-то долбит эндпоинт, кредиты защищены.
4. **(опц.) Код доступа** `GATE` — общий пароль в `scan.html`. Слабый сам по себе (он в клиенте), но складывается с пунктами 2–3.

Даже если кто-то обойдёт origin/gate — он сможет только запускать сканы (а они лимитированы). **Ключ он не получит.**

## Деплой (один раз, ~5 минут)
```bash
npm i -g wrangler
wrangler login                                  # откроет Cloudflare в браузере
cd apex                                          # папка с worker.js + wrangler.toml
wrangler secret put OPENROUTER_API_KEY           # вставь свой OpenRouter-ключ
# (опц.) wrangler secret put GATE                # любой код доступа; впиши тот же в scan.html
wrangler deploy
```
`wrangler deploy` выдаст URL вида `https://apex-scan.<твой-сабдомен>.workers.dev`.

## Подключение к сканеру
В `scan.html` сверху впиши выданный URL:
```js
const WORKER_URL = 'https://apex-scan.katanaim.workers.dev';
const GATE = '';   // если ставила GATE-секрет — впиши тот же код
```
Запушь — и кнопка «Scan my face» оживёт. Пока `WORKER_URL` пустой, кнопка задизейблена и показывает нотис (это нарочно — без бэкенда сканировать небезопасно).

## (опц.) Лимит по кредитам
1. `wrangler kv namespace create RL`
2. вставь id в `wrangler.toml` (раскомментируй блок) → `wrangler deploy`.
Без KV rate-limit просто выключен (origin-lock остаётся).

## Почему Cloudflare, а не Vercel/свой сервер
- Бесплатно (100k запросов/день), деплой в одну команду, секреты встроены.
- MediaPipe-геометрия + регрессор (полный движок v2.2) Worker не тянет (это Python) → здесь только Gemini-зрение (на нём r=0.85–0.94). Геометрию подключим, когда будет Python-бэкенд (Cloud Run / Vercel Python / свой сервер).
