import type { UiKey } from '../i18n/ui';

/**
 * The five resource indicators, in their fixed order. `cat` names the
 * indicator's color token (--cat-<cat> in global.css): a color always
 * means the same indicator, on every page.
 */
export const INDICATORS = [
  { id: 'datasets', main: 'datasets_focused', raw: 'datasets_raw', source: 'Hugging Face', label: 'ind.datasets', unit: 'ind.datasets.unit' },
  { id: 'models', main: 'models_focused', raw: 'models_raw', source: 'Hugging Face', label: 'ind.models', unit: 'ind.models.unit' },
  { id: 'speech', main: 'speech_corpus', raw: null, source: 'Common Voice', label: 'ind.speech', unit: 'ind.speech.unit' },
  { id: 'treebanks', main: 'treebanks', raw: null, source: 'Universal Dependencies', label: 'ind.treebanks', unit: 'ind.treebanks.unit' },
  { id: 'asr', main: 'tool_support_asr', raw: null, source: 'Omnilingual ASR', label: 'ind.asr', unit: 'ind.asr.unit' },
] as const satisfies readonly {
  id: string;
  main: IndicatorKey;
  raw: IndicatorKey | null;
  source: string;
  label: UiKey;
  unit: UiKey;
}[];

export type IndicatorKey =
  | 'endangerment_status'
  | 'datasets_raw'
  | 'datasets_focused'
  | 'models_raw'
  | 'models_focused'
  | 'speech_corpus'
  | 'treebanks'
  | 'tool_support_asr';

export type State = 'measured' | 'measured-zero' | 'not-covered' | 'unresolved';

/** A value with its state, as written by scripts/build-data.mjs. */
export interface Measured {
  value: number | string | null;
  state: string;
}

export interface IndicatorDetail extends Measured {
  source: string;
  snapshot_date: string;
  measured_at: string;
  detail: string;
}

/** Shape of src/data/groups/<slug>.json. */
export interface GroupDetail {
  name: string;
  slug: string;
  family: string;
  latest_snapshot: string;
  identity: {
    inali_name: string;
    match_type: string;
    glottocode: string | null;
    iso639_3: string[];
    collective_code: string | null;
    source: string;
    members: { iso639_3: string; glottocode: string; glottolog_name: string; scope: string; scope_note: string | null }[];
  };
  speakers: Measured & { reference_period: number; source: string; detail: string };
  risk: {
    grade: number;
    grade_label: string;
    census_year: number;
    variants: number;
    variants_by_grade: Record<'1' | '2' | '3' | '4', number>;
  };
  resource_count: Measured & { indicators: string[] };
  indicators: Record<IndicatorKey, IndicatorDetail>;
  variants: { variant: string; spanish_name: string; autonyms: string[]; risk_grade: number; risk_grade_label: string }[];
}

/** Shape of src/data/variants/<variant-id>.json. */
export interface VariantDetail {
  variant: string;
  spanish_name: string;
  family: string;
  group: { name: string; slug: string };
  glottocode: { value: string | null; level: string | null };
  autonyms: { autonym: string; autonym_appendix4: string; ipa: string | null; ipa_status: string }[];
  risk: {
    grade: number;
    grade_label: string;
    census_year: number;
    rank: number;
    speakers_30pct_localities: number | null;
    localities_30pct: number | null;
    child_proportion: number | null;
    speakers_total: number | null;
    localities_total: number | null;
    speaker_proportion: number | null;
    family_printed: string;
    group_printed: string;
    variant_printed: string;
    join: string;
  };
  localities: {
    source: string;
    states: number;
    municipios: number;
    localities: number;
    localities_without_municipio_code: number;
    by_state: { state_code: string; state: string; municipios: number; localities: number }[];
  };
}

export const intlLocale = (locale: string) => (locale === 'es' ? 'es-MX' : 'en-US');

/** "2026-10-09" -> a date in the page's language. */
export function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}
