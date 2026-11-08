// Admin konfigurace — emaily pro notifikace a odesílatel transakčních emailů.
// Hodnoty se odvozují z config/site.ts.
import { ADMIN_EMAIL_LIST, MAIL } from "./site";

/** Emaily admin uživatelů, kam chodí notifikace o nových B2B objednávkách, schválených platbách atd. */
export const ADMIN_EMAILS: readonly string[] = ADMIN_EMAIL_LIST;

/** Odesílatel všech transakčních emailů (magic link, purchase confirmation, reminders). */
export const EMAIL_FROM = MAIL.from;

/** Reply-to adresa (support). */
export const EMAIL_REPLY_TO = MAIL.replyTo;
