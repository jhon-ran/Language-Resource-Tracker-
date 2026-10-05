// Long-form copy for the Method page. Each locale exports one function
// that turns the numbers in src/data/method.json into text, so no figure
// is typed into the prose. Both locales must return the same shape; the
// MethodContent type enforces it at build time.
import type { Locale } from './ui';
import es from './method.es';
import en from './method.en';
import data from '../data/method.json';

export type MethodData = typeof data;

export interface Formatters {
  /** A whole number in the page's language. */
  n: (value: number) => string;
  /** The snapshot date in the page's language. */
  date: string;
}

export interface MethodContent {
  title: string;
  lede: string;
  contents: string;
  measures: {
    title: string;
    paragraphs: string[];
    statesTitle: string;
    /** One real example per state; {value} is filled from the data. */
    states: Record<'measured' | 'measured-zero' | 'not-covered' | 'unresolved', { name: string; example: string }>;
    noScoreTitle: string;
    noScore: string;
    scope: string;
  };
  sources: {
    title: string;
    lede: string;
    columns: { source: string; provides: string; access: string; cadence: string; version: string };
    weekly: string;
    fixed: string;
    rows: Record<
      'glottolog' | 'huggingface' | 'common_voice' | 'universal_dependencies' | 'omnilingual_asr' | 'inegi' | 'inali_catalog' | 'inali_risk',
      { name: string; provides: string; access: string }
    >;
    note: string;
  };
  identity: { title: string; paragraphs: string[]; storyTitle: string; story: string[] };
  error: {
    title: string;
    paragraphs: string[];
    columns: { catalog: string; book: string; catalogLocalities: string; bookLocalities: string };
    after: string[];
  };
  limits: { title: string; lede: string; items: { title: string; text: string }[] };
  license: { title: string; paragraphs: string[]; files: string };
  cite: {
    title: string;
    intro: string;
    subtitle: string;
    datasetLabel: string;
    copy: string;
    copied: string;
    failed: string;
    /** {date} is the snapshot date. */
    snapshotLine: string;
    accessLine: string;
    doiNote: string;
  };
  indigenous: { title: string; paragraphs: string[]; care: { name: string; text: string }[]; contact: string };
}

const content = { es, en } satisfies Record<Locale, (d: MethodData, f: Formatters) => MethodContent>;

export function getMethod(locale: Locale, f: Formatters): { data: MethodData; text: MethodContent } {
  return { data, text: content[locale](data, f) };
}
