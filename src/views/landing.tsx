import type { FC } from "hono/jsx";
import { Layout } from "./layout";
import { LessonSearchForm } from "./lesson-search";
import { SITE } from "../config/site";

type DiscountStageView =
  | { kind: "off" }
  | {
      kind: "auto";
      percent: number;
      label: string;
      slotsTotal: number;
      slotsLeft: number;
      slotsUsed: number;
      codeActive: boolean;
    }
  | {
      kind: "code-only";
      percent: number;
      label: string;
      codeExpiresAt: Date | null;
    };

interface LandingProps {
  user?: { name: string | null; email: string; role?: string } | null;
  modules?: Array<{
    id: number;
    title: string;
    lessons: Array<{
      id: number;
      slug: string;
      title: string;
      durationSeconds: number;
      isFree: boolean;
      sortOrder: number;
    }>;
  }>;
  userHasAccess?: boolean;
  priceIndividual?: number;
  priceOrganization?: number;
  benefitsIndividual?: string[];
  benefitsOrganization?: string[];
  discount?: DiscountStageView;
  /** Videa ke koupi i bez předplatného (lesson_purchase). */
  lessonsForSale?: LessonForSaleCard[];
}

interface LessonForSaleCard {
  slug: string;
  title: string;
  durationSeconds: number;
  description: string;
  image: string | null;
  priceCzk: number;
  accessDays: number;
  /** Přihlášený uživatel bez předplatného ho už koupil: do kdy ho vidí. */
  ownedUntil: string | null;
}

function fmtDuration(seconds: number): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtTotalDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

// Reference: nahraďte skutečnými citacemi se souhlasem účastníků.
const TESTIMONIALS = [
  { body: "[citace účastníka 1]", name: "[jméno 1]", role: "[role 1]", initials: "[AB]" },
  { body: "[citace účastníka 2]", name: "[jméno 2]", role: "[role 2]", initials: "[CD]" },
  { body: "[citace účastníka 3]", name: "[jméno 3]", role: "[role 3]", initials: "[EF]" },
];

// Ceny se do FAQ vkládají z ceníku (site_config), ne napevno — jinak se text
// rozejde s cenou po každé změně ceníku.
const faqItems = (priceOrganization: number) => [
  { q: "[otázka 1]", a: "[odpověď 1]" },
  { q: "[otázka 2]", a: "[odpověď 2]" },
  { q: "[otázka 3]", a: "[odpověď 3]" },
  { q: "[otázka k firemní licenci]", a: `[odpověď k firemní licenci] ${fmtPrice(priceOrganization)}/rok` },
  { q: "[otázka 5]", a: "[odpověď 5]" },
];

const CheckIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const LockIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

// Video na prodej samostatně: mince místo zámku nebo přehrávání.
const CoinIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
  </svg>
);

const PlaySmIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);

const ArrowIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

function fmtPrice(czk: number): string {
  return czk.toLocaleString("cs-CZ") + " Kč";
}

/**
 * Český plurál pro „zbývá X objedná*". 1 → poslední objednávka,
 * 2–4 → zbývají N objednávky, 5+ → zbývá N objednávek.
 */
function fmtRemainingOrders(n: number): string {
  if (n <= 0) return "vyprodáno";
  if (n === 1) return "zbývá poslední objednávka";
  if (n >= 2 && n <= 4) return `zbývají ${n} objednávky`;
  return `zbývá ${n} objednávek`;
}

/** Práh, od kterého se začíná zobrazovat urgency badge u slevy. */
const URGENCY_THRESHOLD = 25;

export const LandingPage: FC<LandingProps> = ({
  user,
  modules = [],
  userHasAccess = false,
  priceIndividual = 2000,
  priceOrganization = 15000,
  benefitsIndividual = [],
  benefitsOrganization = [],
  discount = { kind: "off" },
  lessonsForSale = [],
}) => {
  const allLessons = modules.flatMap((m) => m.lessons);
  const totalSeconds = allLessons.reduce((s, l) => s + l.durationSeconds, 0);
  const lessonCount = allLessons.length;
  const freeCount = allLessons.filter((l) => l.isFree).length;
  const saleBySlug = new Map(lessonsForSale.map((l) => [l.slug, l]));
  const canAccessAll = userHasAccess;
  const showAutoDiscount = discount.kind === "auto";
  const showCodeHint = discount.kind === "code-only";
  const discountedIndividual = showAutoDiscount
    ? Math.floor((priceIndividual * (100 - discount.percent)) / 100)
    : priceIndividual;
  const discountedOrganization = showAutoDiscount
    ? Math.floor((priceOrganization * (100 - discount.percent)) / 100)
    : priceOrganization;
  return (
  <Layout user={user}>
    <div class="container">
      {/* Hero */}
      <section class="hero">
        <div>
          <div class="eyebrow">[nadtitulek]</div>
          <h1>[hlavní nadpis]</h1>
          <p class="lede">
            [úvodní odstavec: komu je kurz určený a co si z něj odnese]
          </p>
          <div class="hero-actions">
            <a class="btn btn-lg" href="#cenik">
              koupit kurz{" "}
              <span class="arrow">
                <ArrowIcon />
              </span>
            </a>
            <a class="btn btn-ghost btn-lg" href="#obsah">
              {freeCount > 0 ? `${freeCount === 1 ? "první epizoda" : `první ${freeCount} epizody`} zdarma` : "část epizod zdarma"}
            </a>
          </div>
          <div class="hero-meta">
            <span>{lessonCount > 0 ? `${lessonCount} epizod` : "10 epizod"}</span>
            <span class="dot"></span>
            <span>{totalSeconds > 0 ? `${fmtTotalDuration(totalSeconds)} videa` : "4 h 45 min videa"}</span>
            <span class="dot"></span>
            <span>[jazyk a lektor]</span>
          </div>
        </div>
        <div class="card" aria-hidden="true" style="display:flex;align-items:center;justify-content:center;min-height:260px;color:var(--muted)">
          [obrázek nebo ukázka z kurzu]
        </div>
      </section>

      {/* Videa ke koupi samostatně */}
      {lessonsForSale.length > 0 && (
        <section class="section" id="videa">
          <div class="section-header">
            <div>
              <div class="kicker">jednotlivá videa</div>
              <h2>Záznamy, které si koupíte i&nbsp;bez předplatného.</h2>
            </div>
          </div>
          <div class="sale-grid">
            {lessonsForSale.map((l) => (
              <article class="card sale-card">
                <a href={`/watch/${l.slug}`} class="sale-thumb" aria-hidden="true" tabindex={-1}>
                  {l.image && <img src={l.image} alt="" loading="lazy" />}
                  {l.durationSeconds > 0 && <span class="sale-duration mono">{fmtTotalDuration(l.durationSeconds)}</span>}
                </a>
                <div class="sale-body">
                  <h3><a href={`/watch/${l.slug}`}>{l.title}</a></h3>
                  {l.description && <p class="sale-desc">{l.description}</p>}
                  <dl class="sale-prices">
                    <div class={canAccessAll ? "" : "is-current"}>
                      <dt>bez předplatného</dt>
                      <dd>
                        <strong>{l.priceCzk.toLocaleString("cs-CZ")}&nbsp;Kč</strong>
                        <span class="muted"> · přístup na {l.accessDays}&nbsp;dní</span>
                      </dd>
                    </div>
                    <div class={canAccessAll ? "is-current" : ""}>
                      <dt>předplatitelé</dt>
                      <dd>v ceně předplatného</dd>
                    </div>
                  </dl>
                  {canAccessAll ? (
                    <a class="btn btn-block" href={`/watch/${l.slug}`}>přehrát (máte v předplatném)</a>
                  ) : l.ownedUntil ? (
                    <a class="btn btn-block" href={`/watch/${l.slug}`}>přehrát (koupeno, do {l.ownedUntil})</a>
                  ) : (
                    <div class="sale-actions">
                      <a class="btn" href={`/checkout/lesson/${l.slug}`}>
                        koupit za {l.priceCzk.toLocaleString("cs-CZ")}&nbsp;Kč
                      </a>
                      <a class="btn btn-ghost" href="#cenik">nebo předplatné</a>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Obsah kurzu */}
      <section class="section" id="obsah">
        <div class="section-header">
          <div>
            <div class="kicker">obsah kurzu</div>
            <h2>[název kurzu]</h2>
          </div>
          <div class="section-subtitle">
            {freeCount > 0 && (
              <span class="pill">
                {freeCount === 1 ? "první epizoda zdarma" : `první ${freeCount} epizody zdarma`}
              </span>
            )}
          </div>
        </div>
        {modules.length > 0 && (
          <div style="margin:-8px 0 20px;max-width:420px">
            <LessonSearchForm action="/hledat" />
          </div>
        )}
        <div class="module-list">
          {modules.map((m, mi) => (
            <div class="module">
              <div class="module-head">
                <div>
                  <div class="module-index">
                    modul {String(mi + 1).padStart(2, "0")}
                  </div>
                  <h3 class="module-title">{m.title}</h3>
                </div>
                <div class="module-meta">
                  {m.lessons.length} epizod
                </div>
              </div>
              {m.lessons.map((l, li) => {
                // Prodávané video je označené pro všechny, předplatitelé ho mají v ceně.
                const sale = l.isFree ? undefined : saleBySlug.get(l.slug);
                const accessible = l.isFree || canAccessAll || !!sale?.ownedUntil;
                // Video ke koupi vede na svou stránku s nabídkou koupě, ne na ceník.
                const href = accessible || sale ? `/watch/${l.slug}` : "/#cenik";
                return (
                  <a href={href} class={`lesson no-underline ${accessible || sale ? "" : "locked"}`}
                    style="display:flex;align-items:center;gap:inherit;color:inherit">
                    <span class="lesson-num">{String(li + 1).padStart(2, "0")}</span>
                    <span class="lesson-icon">
                      {sale ? (
                        <span style="color:var(--accent)">
                          <CoinIcon />
                        </span>
                      ) : accessible ? (
                        <span style="color:var(--accent)">
                          <PlaySmIcon />
                        </span>
                      ) : (
                        <span style="color:var(--muted)">
                          <LockIcon />
                        </span>
                      )}
                    </span>
                    <div class="lesson-title">
                      {l.title}
                      {sale && (
                        <span class="lesson-sub">
                          {sale.ownedUntil
                            ? `koupeno samostatně, přístup do ${sale.ownedUntil}`
                            : `${sale.priceCzk.toLocaleString("cs-CZ")} Kč (předplatitelé zdarma)`}
                        </span>
                      )}
                    </div>
                    <span class="lesson-duration">{fmtDuration(l.durationSeconds)}</span>
                  </a>
                );
              })}
            </div>
          ))}
          {modules.length === 0 && (
            <p style="color:var(--muted);text-align:center;padding:2rem 0">
              Obsah kurzu se připravuje.
            </p>
          )}
        </div>
      </section>

      {/* Ceník */}
      <section class="section" id="cenik">
        <div class="section-header">
          <div>
            <div class="kicker">ceník</div>
            <h2>[nadpis ceníku]</h2>
          </div>
        </div>
        {!user && (
          <div
            class="card"
            style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px;padding:14px 18px;margin-bottom:24px;text-align:center"
          >
            <span style="color:var(--muted)">Už jste kurz koupili?</span>
            <a class="btn btn-ghost btn-sm" href="/login">přihlásit se</a>
          </div>
        )}
        <div class="pricing-grid">
          <div class="price-card featured">
            <div>
              <span class="pill">pro jednotlivce</span>
              <h3 style="margin-top:10px">Osobní předplatné</h3>
            </div>
            {showAutoDiscount ? (
              <>
                <div
                  style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap"
                  class="price-number"
                >
                  <span>{fmtPrice(discountedIndividual)}<small>/ rok</small></span>
                  <span style="font-size:0.55em;color:var(--muted);text-decoration:line-through;font-weight:400">
                    {fmtPrice(priceIndividual)}
                  </span>
                </div>
                <div
                  style="display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:#fef3c7;color:#92400e;font-size:0.78rem;font-weight:600;margin-top:-4px;margin-bottom:8px"
                >
                  🔥 {discount.label || `Sleva ${discount.percent} %`}
                  {discount.slotsLeft <= URGENCY_THRESHOLD && (
                    <> — {fmtRemainingOrders(discount.slotsLeft)}</>
                  )}
                </div>
              </>
            ) : (
              <div class="price-number">
                {fmtPrice(priceIndividual)}<small>/ rok</small>
              </div>
            )}
            <ul class="price-features">
              {benefitsIndividual.map((b) => (
                <li>
                  <span class="check"><CheckIcon /></span>
                  {b}
                </li>
              ))}
            </ul>
            <a href="/checkout/individual" class="btn btn-block btn-lg" style="text-decoration:none">
              koupit za {fmtPrice(showAutoDiscount ? discountedIndividual : priceIndividual)}
            </a>
            <div class="mono muted" style="text-align:center">
              platba kartou nebo převodem
            </div>
            {showCodeHint && (
              <div class="mono muted" style="text-align:center;font-size:0.75rem">
                💌 Máte zaváděcí kód? Vlož ho v košíku.
              </div>
            )}
          </div>
          <div class="price-card">
            <div>
              <span class="pill pill-ghost">pro firmy</span>
              <h3 style="margin-top:10px">Firemní licence</h3>
            </div>
            {showAutoDiscount ? (
              <>
                <div
                  style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap"
                  class="price-number"
                >
                  <span>{fmtPrice(discountedOrganization)}<small>/ rok</small></span>
                  <span style="font-size:0.55em;color:var(--muted);text-decoration:line-through;font-weight:400">
                    {fmtPrice(priceOrganization)}
                  </span>
                </div>
                <div
                  style="display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:#fef3c7;color:#92400e;font-size:0.78rem;font-weight:600;margin-top:-4px;margin-bottom:8px"
                >
                  🔥 {discount.label || `Sleva ${discount.percent} %`}
                  {discount.slotsLeft <= URGENCY_THRESHOLD && (
                    <> — {fmtRemainingOrders(discount.slotsLeft)}</>
                  )}
                </div>
              </>
            ) : (
              <div class="price-number">
                {fmtPrice(priceOrganization)}<small>/ rok</small>
              </div>
            )}
            <ul class="price-features">
              {benefitsOrganization.map((b) => (
                <li>
                  <span class="check"><CheckIcon /></span>
                  {b}
                </li>
              ))}
            </ul>
            <a href="/checkout/organization" class="btn btn-ghost btn-block btn-lg" style="text-decoration:none">
              koupit firemní licenci
            </a>
            <div class="mono muted" style="text-align:center">
              platba kartou nebo převodem, aktivace do 24&nbsp;h po&nbsp;schválení
            </div>
            {showCodeHint && (
              <div class="mono muted" style="text-align:center;font-size:0.75rem">
                💌 Máte zaváděcí kód? Vlož ho v košíku.
              </div>
            )}
          </div>
        </div>
        {lessonsForSale.length > 0 && !canAccessAll && (
          <p class="muted" style="text-align:center;margin-top:20px">
            Chcete jen jedno video? Některé záznamy{" "}
            <a href="#videa">koupíte i samostatně</a>.
          </p>
        )}
      </section>

      {/* Testimonials */}
      <section class="section" id="reference">
        <div class="section-header">
          <div>
            <div class="kicker">reference</div>
            <h2>[nadpis referencí]</h2>
          </div>
        </div>
        <div class="quotes">
          {TESTIMONIALS.map((t) => (
            <div class="quote-card">
              <div class="quote-body">&bdquo;{t.body}&ldquo;</div>
              <div class="quote-person">
                <div class="quote-avatar">{t.initials}</div>
                <div>
                  <div class="quote-name">{t.name}</div>
                  <div class="quote-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bio */}
      <section class="section" id="bio">
        <div class="section-header">
          <div>
            <div class="kicker">lektor</div>
            <h2>[nadpis sekce o lektorovi]</h2>
          </div>
        </div>
        <div class="bio">
          <div class="bio-photo">
            <div style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;background:var(--surface, #f3f4f6);color:var(--muted)">
              [fotka lektora]
            </div>
            <span>[kontaktní e-mail]</span>
          </div>
          <div>
            <h3>{SITE.author}</h3>
            <div class="bio-sub">[role lektora]</div>
            <div class="bio-tags">
              <span class="pill pill-ghost">[štítek 1]</span>
              <span class="pill pill-ghost">[štítek 2]</span>
              <span class="pill pill-ghost">[štítek 3]</span>
            </div>
            <p>[medailonek: zkušenosti a čím je lektor užitečný účastníkům]</p>
            <p>[styl výuky]</p>
            <div class="bio-links">
              <a href="#">[odkaz 1]</a>
              <a href="#">[odkaz 2]</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section class="section" id="faq">
        <div class="section-header">
          <div>
            <div class="kicker">faq</div>
            <h2>[nadpis FAQ]</h2>
          </div>
        </div>
        <div class="faq">
          {faqItems(priceOrganization).map((f, i) => (
            <details open={i === 0 ? true : undefined}>
              <summary>{f.q}</summary>
              <div class="faq-body">{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section class="section" id="newsletter" style="text-align:center">
        <div style="max-width:560px;margin:0 auto">
          <div class="kicker" style="justify-content:center">newsletter</div>
          <h2
            style="font-family:var(--font-head);font-size:clamp(1.5rem,2vw,1.9rem);font-weight:600;letter-spacing:-0.01em;margin:8px 0 12px"
          >
            [nadpis newsletteru]
          </h2>
          <p style="color:var(--muted);margin:0 0 24px;font-size:1rem">
            [co a jak často newsletter posílá]
          </p>
          <div id="newsletter-form">
            <form
              hx-post="/api/leads/newsletter"
              hx-target="#newsletter-form"
              hx-swap="innerHTML"
              class="hstack"
              style="gap:10px;max-width:420px;margin:0 auto"
            >
              <input
                type="email"
                name="email"
                required
                placeholder="vas@email.cz"
                class="input"
                autocomplete="email"
              />
              <button type="submit" class="btn btn-sm" style="white-space:nowrap">
                odebírat
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  </Layout>
  );
};
