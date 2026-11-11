# Claude pracovní instrukce pro videokurzy

Operační manuál pro práci na tomhle projektu. Architektura, stack a setup jsou
v [`README.md`](./README.md); design konvence v [`.impeccable.md`](./.impeccable.md).
Tady jsou jen pravidla a pasti specifické pro tento repozitář.

## Workflow před commitem
Vždy spusť:

```bash
npm run typecheck && npm test
```

Pokud cokoli selže, oprav před commitem. Necommituj a nepushuj bez zelených testů.
Commit/push/deploy dělej jen na výslovný pokyn uživatele, ne preventivně.

## Ověřuj obsah, ne jen exit kód
**Zelený typecheck/test neznamená, že tvoje změna je v souboru.** Edit může tiše
selhat (nesedící `old_string`) a `tsc` neuvidí runtime JS uvnitř JSX šablon
(`dangerouslySetInnerHTML`, inline `<script>`). Po každé netriviální editaci
ověř greppem, že kód tam reálně je (`grep -c "marker" soubor`) — teprve pak commituj.
Commit message musí odpovídat skutečnému stavu.

## Migrace — piš ručně
`npm run db:generate` (drizzle-kit) je **rozbité** kvůli kolizi meta snapshotů
ve `drizzle/migrations/meta/` (0004/0005). Nové migrace proto piš ručně jako
`drizzle/migrations/NNNN_nazev.sql` — `wrangler d1 migrations apply` čte jen
`.sql`, drizzle meta ignoruje. Změň zároveň `src/db/schema.ts`, ať sedí typy.

## Po nasazení migrací
Pokud commit obsahuje nový soubor v `drizzle/migrations/`, **po `npm run deploy`**
spusť také:

```bash
npm run db:migrate:prod
```

Bez toho budou nové sloupce/tabulky chybět na produkční D1 a runtime spadne.

## FIO API z Workers: přímé volání (proxy odstraněna)
FIO voláme z workeru přímo (`src/lib/fio.ts`). `fioapi.fio.cz` občas vrací
přechodnou chybu **525** (TLS handshake mezi Cloudflare a FIO). Relay `fio-proxy/`
nebyl nikdy nasazený a 4. 11. 2026 byl odstraněn (bezpečnostní úklid: neudržovaný
kontejner s FIO tokenem). Historie je v gitu a v `docs/payment-matching-fix-2026-06.md`.
Podpora `FIO_PROXY_URL` + `FIO_PROXY_SECRET` v `fioProxyFromEnv()` zůstává, ale bez
nasazené proxy se nepoužívá. Pokud 525 začne blokovat platby, vzorem je retry
`fioFetchJson()` ve vibecoding-site (`src/lib/fio-payment.ts`).

- Creditas tímhle netrpí (modernější API), volá se napřímo.

## Párování plateb je cross-bank
`scanBankPayments` v `src/scheduled.ts` paruje každou pending převodovou objednávku
proti **oběma** bankám (FIO i Creditas), ne jen proti té z `paymentMethod`. Lidé
totiž reálně platí, kam mají uložený účet (Creditas objednávka zaplacená na starý
FIO účet apod.). Transakce se zapíše do sloupce podle banky, kde se našla.
`scanFioPayments` je zpětně kompatibilní wrapper delegující sem.

## Ruční potvrzení platby
Platba, kterou automat nezachytil (typicky FIO 525 nebo cross-bank), se potvrdí
v adminu tlačítkem „Potvrdit platbu" u pending objednávky → `kind='manual'`
(reálné peníze, počítá se do revenue; **ne** `comp`, to je grant zdarma).
`manuallyConfirmPayment()` v `src/lib/admin-users.ts`.

## Prodej jednoho videa (lesson_purchase)
Od 25. 10. 2026 (rozhodnutí Patricka): video s `lesson.priceCzk` si koupí i člověk bez předplatného,
jen kartou (Stripe `mode: payment`), na `lesson.accessDays` dní (výchozí 120). Cena a dny v adminu
u úpravy lekce. Předplatitelé video mají v ceně. Kód: `src/lib/lesson-access.ts`, větev `type: "lesson"`
v `handleCheckoutCompleted`, `/checkout/lesson/:slug`, `src/lib/lesson-expiry-reminders.ts`.
- Nákup je ve vlastní tabulce `lesson_purchase`, **nikdy v `purchase`**: `hasAccess()` dává celou
  platformu za jakýkoli aktivní řádek purchase a čte z ní newsletter, připomínky obnovy i tržby.
- `lesson_purchase.id` je vlastní řada id. Ve fakturaci má `jobKind = 'lesson_purchase'` (customId
  `vk-lesson-<id>`), v `conversion_log` `source = 'lesson'` (Meta event_id `lesson-<id>`). Dotazy na
  `invoice_job.purchaseId` musí `jobKind` rozlišovat.
- VS s prefixem **35** i u karty: tržba z videa je poznat na faktuře a ve Stripe. Tržby z videí jsou
  v přehledu adminu zvlášť, do „Zaplaceno celkem“ se nepočítají.
- Prodávat jde jen video mimo hlavní Bunny library (`bunnyLibraryId` není NULL), hlavní nemá ochranu tokenem.
- Kupující nedostává onboarding ani newsletter; jen potvrzení, fakturu a připomínku 7 dní před koncem
  s nabídkou předplatného (předplatitelům se nepošle). Refund se řeší ručně (`status = 'refunded'`).

## Bunny — více video library
Lekce má `bunnyLibraryId` (NULL = hlavní library z `BUNNY_LIBRARY_ID` /
`BUNNY_API_KEY` / `BUNNY_TOKEN_KEY` / `BUNNY_PULL_ZONE`). Další library se
konfigurují JSON secretem `BUNNY_EXTRA_LIBRARIES`
(`{"655172": {"apiKey","tokenKey","pullZone","pullZoneToken?","name?"}}`).
Každá library má **vlastní** Stream API klíč i Token Authentication Key —
account klíč Stream API nepřijímá a token key přes API nejde získat. Library
pro lekci vždy přes `resolveBunnyLibrary()` v `src/lib/bunny-library.ts`,
nikdy napřímo `env.BUNNY_*`.

## Značka a provozovatel
Údaje provozovatele, doména, admin e-maily a odesílatel jsou v `src/config/site.ts`,
barvy v `src/styles/input.css` (`:root` tokeny a `@theme`, kde je Tailwind `indigo-*`
přemapovaný na zlatou škálu a `gray-*` na teplé neutrály). Nic z toho nepiš natvrdo
do šablon. Design pravidla jsou v `.impeccable.md`.

## Upstream
Repo je fork `tangero/videokurzy`. Remote `upstream` slouží jen ke stahování
(push je zablokovaný). Do upstreamu nikdy nepushuj; vylepšení pro Patricka se
posílají jako pull request z forku.

## Secrets a externí API
- `.dev.vars` obsahuje **placeholder** hodnoty (`BUNNY_LIBRARY_ID="smoke_test"`,
  krátké klíče). Ostré secrets žijí jen v Cloudflare dashboardu.
- Cokoli volá reálné externí API (bunny statistiky, Resend CLI/automations)
  **musí běžet z nasazeného workeru** nebo s klíčem dodaným za běhu
  (`RESEND_API_KEY=re_... bash script.sh`). Lokální volání s `.dev.vars` selže.
- Resend automatizace se spravují přes `resend` CLI a skripty v `scripts/resend/`
  (event schémata používají **camelCase** `eventName`, ne `event_name`).

## Deploy infrastructure
- Produkce běží na Cloudflare worker **`videokurzy`** (default, bez `--env`),
  bound na `kurzy.jakdelatprojekty.cz`.
- Secrets a non-sensitive vars (např. `COOKIE_DOMAIN`, `BUNNY_PULL_ZONE`) se
  nastavují v Cloudflare dashboardu (Workers & Pages → videokurzy → Settings →
  Variables and Secrets). **Ne** přes `wrangler secret put` — to historicky
  chodilo na jiný worker.
- `npm run deploy` = `wrangler deploy` (bez `--env`). Nesahá se na to.

## Cloudflare Queues
- Webhooky jedou přes frontu **`videokurzy-webhooks`** (producer `WEBHOOK_QUEUE`).
  Po vyčerpání retry padají do **`videokurzy-webhooks-dlq`** (dead-letter),
  kterou obsluhuje `handleDlq` v `src/queue.ts` (alert adminovi, žádný retry).
- Obě fronty musí existovat **před deployem**, jinak `wrangler deploy` selže na
  referenci neexistující fronty. Vytvoření:
  `wrangler queues create videokurzy-webhooks-dlq`.
- Rozcestník konzumentů je v `src/index.tsx` (`queue:` export) — rozlišuje podle
  `batch.queue` (sufix `-dlq` → `handleDlq`, jinak `handleQueue`).
