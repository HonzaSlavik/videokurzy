// Značka a provozovatel platformy na jednom místě.
//
// Všechno, co se liší mezi provozovateli (název, doména, kontakty, IČO,
// bankovní účet), patří sem. Kód i šablony čtou hodnoty odsud, nikde jinde
// nemají být natvrdo. Hodnoty "DOPLNIT" je nutné vyplnit před nasazením.

/** Značka a adresy webu. */
export const SITE = {
  /** Název platformy (titulky, e-maily, Fakturoid). */
  name: "Jak dělat projekty",
  /** Monogram v logu hlavičky (2–3 znaky). */
  monogram: "jdp",
  /** Podtitul pod názvem v hlavičce. */
  tagline: "videokurzy projektového řízení",
  /** Host, na kterém platforma běží (bez protokolu). */
  host: "jakdelatprojekty.cz",
  /** Kanonická adresa webu bez koncového lomítka. */
  url: "https://jakdelatprojekty.cz",
  /**
   * Doména, pod kterou smí vést návratové odkazy po přihlášení
   * (apex i libovolná subdoména). Viz lib/callback-allowlist.ts.
   */
  rootDomain: "jakdelatprojekty.cz",
  /** Výchozí popis webu (meta description, OG). */
  description: "Videokurzy o tom, jak vést projekty v praxi.",
  /** Hlavní lektor / autor kurzů (texty v e-mailech a OG popisech). */
  author: "Honza Slavík",
  /**
   * Další weby, kam smí magic link po ověření vracet (např. diskuse pod
   * články na hlavním webu). Musí ležet pod rootDomain, jinak je odmítne
   * i lib/callback-allowlist.ts.
   */
  trustedOrigins: ["https://jakdelatprojekty.cz", "https://www.jakdelatprojekty.cz"] as string[],
} as const;

/** Provozovatel (dodavatel na dokladech, správce osobních údajů). */
export const OPERATOR = {
  name: "DOPLNIT",
  ico: "DOPLNIT",
  /** DIČ, pokud je provozovatel plátce DPH; jinak prázdné. */
  dic: "" as string,
  address: "DOPLNIT",
  city: "DOPLNIT",
  zip: "DOPLNIT",
  country: "Česká republika",
  email: "DOPLNIT",
  /** Telefon do patičky a právních textů; prázdné = nezobrazovat. */
  phone: "" as string,
} as const;

/**
 * E-maily administrátorů: dostávají upozornění na objednávky a po přihlášení
 * mají přístup do /admin. Bez vyplnění nemá admin práva nikdo.
 */
export const ADMIN_EMAIL_LIST: readonly string[] = ["DOPLNIT"];

/** E-mailová komunikace. */
export const MAIL = {
  /** Odesílatel transakčních e-mailů (doména musí být ověřená v Resend). */
  from: `${SITE.name} <kurzy@${SITE.rootDomain}>`,
  /** Adresa pro odpovědi a podporu. */
  replyTo: OPERATOR.email,
  /** Odesílatel osobních e-mailů od lektora (uvítání nového uživatele). */
  personalFrom: `${SITE.author} <${OPERATOR.email}>`,
  /** Kdo „podepisuje" transakční e-maily. */
  signature: SITE.author,
} as const;

/** Bankovní účet pro platby převodem (FIO). */
export const BANK_ACCOUNT = {
  iban: "DOPLNIT",
  account: "DOPLNIT",
  bic: "FIOBCZPP",
  bankName: "Fio banka, a.s.",
  /** Název příjemce na QR platbě (SPAYD). */
  recipient: OPERATOR.name,
} as const;

/** Poštovní adresa provozovatele na jeden řádek (odstoupení, doklady). */
export const OPERATOR_POSTAL = `${OPERATOR.name}, ${OPERATOR.address}, ${OPERATOR.zip} ${OPERATOR.city}`;
