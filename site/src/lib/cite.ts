// Citation text for the Method page. Used twice: at build time, to write
// the citations into the page, and in the browser, to replace the access
// date with the reader's own date. Both must format dates the same way,
// which is why the formatting lives here.

export type CiteLocale = 'es' | 'en';

/** The project's citation author: personal authorship, not organizational. */
export const AUTHOR = { family: 'Rangel', given: 'Jhonnatan' };

const LONG_LOCALE = { es: 'es-MX', en: 'en-US' } as const;

// MLA abbreviates every month except May, June and July.
const MLA_MONTHS = {
  es: ['ene.', 'feb.', 'mar.', 'abr.', 'mayo', 'jun.', 'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'],
  en: ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'],
} as const;

/** "2026-10-09" -> a Date at UTC midnight, so the day never shifts. */
export function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** Today in the reader's own time zone, as YYYY-MM-DD. */
export function localIsoDate(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** APA style: "5 de octubre de 2026" / "October 5, 2026". */
export function longDate(iso: string, locale: CiteLocale): string {
  return new Intl.DateTimeFormat(LONG_LOCALE[locale], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    parseIsoDate(iso),
  );
}

/** MLA style: "5 oct. 2026" / "5 Oct. 2026". */
export function mlaDate(iso: string, locale: CiteLocale): string {
  const d = parseIsoDate(iso);
  return `${d.getUTCDate()} ${MLA_MONTHS[locale][d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export interface CiteInput {
  locale: CiteLocale;
  /** Date of the snapshot the data reflects, YYYY-MM-DD. */
  snapshot: string;
  /** Date the reader accessed the site, YYYY-MM-DD. */
  access: string;
  url: string;
  title: string;
  subtitle: string;
  /** "[Data set]" in the page's language. */
  datasetLabel: string;
}

export function apa(c: CiteInput): string {
  const year = parseIsoDate(c.snapshot).getUTCFullYear();
  const retrieved =
    c.locale === 'es' ? `Recuperado el ${longDate(c.access, 'es')}, de ${c.url}` : `Retrieved ${longDate(c.access, 'en')}, from ${c.url}`;
  return `${AUTHOR.family}, ${AUTHOR.given[0]}. (${year}). ${c.title}: ${c.subtitle} [${c.datasetLabel}]. ${retrieved}`;
}

/** MLA carries the snapshot date only; the access date is in the APA form. */
export function mla(c: CiteInput): string {
  return `${AUTHOR.family}, ${AUTHOR.given}. “${c.title}.” ${c.title}, ${mlaDate(c.snapshot, c.locale)}, ${c.url}.`;
}
