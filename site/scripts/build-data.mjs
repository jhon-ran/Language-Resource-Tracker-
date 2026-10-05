// Build-time data layer for the site.
//
// Reads the CSVs committed at the repo root, in /reference and in the
// newest /snapshots/<date>/ folder, and writes small JSON files into
// site/src/data/ for Astro pages to import. Nothing in the site reads a
// CSV: all aggregation happens here.
//
// Run with `npm run build:data` (also runs before `npm run build` and
// `npm run dev`). The output folder is generated and git-ignored.
//
// The four-state model is carried explicitly. Every indicator is written
// as { value, state } with state one of measured / measured-zero /
// not-covered / unresolved; a null value never stands alone.

import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = resolve(SITE, '..');
const OUT = join(SITE, 'src', 'data');

const STATES = ['measured', 'measured-zero', 'not-covered', 'unresolved'];

// The five weekly sources and the indicators each one writes.
const WEEKLY = [
  { file: 'glottolog.csv', indicators: ['endangerment_status'] },
  { file: 'huggingface.csv', indicators: ['datasets_raw', 'datasets_focused', 'models_raw', 'models_focused'] },
  { file: 'common_voice.csv', indicators: ['speech_corpus'] },
  { file: 'universal_dependencies.csv', indicators: ['treebanks'] },
  { file: 'omnilingual_asr.csv', indicators: ['tool_support_asr'] },
];
const INDICATORS = WEEKLY.flatMap((s) => s.indicators);

// "Resource count": how many of the five resource indicators a group has
// something on, i.e. state "measured" with a value above zero. Range 0-5.
// Hugging Face is counted on its focused figures, because the raw ones are
// above zero for nearly every group. Endangerment status is not a resource
// and is not counted.
const RESOURCE_INDICATORS = ['datasets_focused', 'models_focused', 'speech_corpus', 'treebanks', 'tool_support_asr'];
const RESOURCE_COUNT_DEFINITION =
  'number of these indicators in state "measured" with a value above 0: ' + RESOURCE_INDICATORS.join(', ');

// Secondary figure: the plain sum of the Hugging Face focused counts.
const HF_FOCUSED = ['datasets_focused', 'models_focused'];

// Glottolog AES categories, least to most endangered.
const AES_ORDER = ['not endangered', 'threatened', 'shifting', 'moribund', 'nearly extinct', 'extinct'];

const EXPECTED = { groups: 68, variants: 364 };

// ---------------------------------------------------------------- helpers

function fail(message) {
  console.error(`build-data: ${message}`);
  process.exit(1);
}

function check(condition, message) {
  if (!condition) fail(message);
}

/** Minimal RFC 4180 CSV reader: quoted fields, doubled quotes, newlines in quotes. */
function readCsv(relPath) {
  const path = join(REPO, relPath);
  check(existsSync(path), `missing input ${relPath}`);
  const text = readFileSync(path, 'utf8').replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift();
  return rows
    .filter((r) => r.length > 1 || r[0] !== '')
    .map((r) => {
      check(r.length === header.length, `${relPath}: row with ${r.length} cells, header has ${header.length}`);
      return Object.fromEntries(header.map((h, i) => [h, r[i]]));
    });
}

/** Same rule as slug() in tools/parse_inali_catalog.py. */
function slug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Blank -> null; a plain number -> Number; anything else stays text. */
function parseValue(text) {
  if (text === '') return null;
  return /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : text;
}

function groupBy(rows, key) {
  const map = new Map();
  for (const r of rows) {
    const k = typeof key === 'function' ? key(r) : r[key];
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(r);
  }
  return map;
}

let written = 0;
function writeJson(relPath, data) {
  const path = join(OUT, relPath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 1) + '\n');
  written++;
}

// ----------------------------------------------------------------- inputs

const crosswalk = readCsv('crosswalk.csv');
const members = readCsv('crosswalk_members.csv');
const variants = readCsv('variants.csv');
const variantIpa = readCsv('variant_ipa.csv');
const localities = readCsv('variant_localities.csv');
const riskRows = readCsv('risk_grade.csv');
const census = readCsv('reference/inegi_census_2020.csv');
const glottologReference = readCsv('reference/glottolog_reference.csv');
const reviewList = readCsv('review_list.csv');
const riskAliases = readCsv('risk_grade_aliases.csv');
const readJson = (relPath) => {
  const path = join(REPO, relPath);
  check(existsSync(path), `missing input ${relPath}`);
  return JSON.parse(readFileSync(path, 'utf8'));
};
const catalogBuild = readJson('inali_build.json');
const riskBuild = readJson('risk_grade_build.json');

// Which snapshot is the latest is decided by when its measurements were
// taken (the measured_at column), never by the folder's name. A folder
// name is a label: a manual run can be given any date, including one in
// the future, and snapshots/2026-10-09 is exactly that (measured on
// 2026-10-02). measured_at is the authoritative timestamp for anything
// date-sensitive.
//
// A folder that lacks one of the five source files (a run where a fetcher
// failed) is not eligible, so the site falls back to the newest complete
// snapshot instead of failing to build.
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const snapshotFolders = readdirSync(join(REPO, 'snapshots')).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
check(snapshotFolders.length > 0, 'no snapshot folders');
const snapshotCandidates = [];
const skippedFolders = [];
for (const folder of snapshotFolders) {
  const missing = WEEKLY.filter((source) => !existsSync(join(REPO, 'snapshots', folder, source.file)));
  if (missing.length > 0) {
    console.warn(`build-data: snapshots/${folder} skipped, missing ${missing.map((m) => m.file).join(', ')}`);
    // Newest measured_at among the files that are there, so we can tell
    // below whether this folder would have been the latest.
    let partial = '';
    for (const source of WEEKLY) {
      if (!existsSync(join(REPO, 'snapshots', folder, source.file))) continue;
      for (const r of readCsv(`snapshots/${folder}/${source.file}`)) {
        if (ISO_INSTANT.test(r.measured_at) && r.measured_at > partial) partial = r.measured_at;
      }
    }
    skippedFolders.push({ folder, missing: missing.map((m) => m.file), measured_at: partial || null });
    continue;
  }
  let measuredAt = '';
  for (const source of WEEKLY) {
    for (const r of readCsv(`snapshots/${folder}/${source.file}`)) {
      check(ISO_INSTANT.test(r.measured_at), `snapshots/${folder}/${source.file}: bad measured_at "${r.measured_at}"`);
      if (r.measured_at > measuredAt) measuredAt = r.measured_at;
    }
  }
  snapshotCandidates.push({ folder, measuredAt });
}
check(snapshotCandidates.length > 0, 'no complete snapshot folder');
// Latest measurement wins; on an exact tie, the later folder name.
snapshotCandidates.sort((a, b) => a.measuredAt.localeCompare(b.measuredAt) || a.folder.localeCompare(b.folder));
const latestSnapshot = snapshotCandidates[snapshotCandidates.length - 1];
// A fallback is a skipped folder that would have been the latest had it
// been complete: its measurements are newer than the snapshot in use (or,
// with no readable timestamp, its name sorts after the folder in use).
// The build stays lenient and carries on; deploy-site.yml reads
// `snapshot_fallback` from home.json and fails the run so someone is told.
const snapshotFallback = skippedFolders.filter((s) =>
  s.measured_at ? s.measured_at > latestSnapshot.measuredAt : s.folder > latestSnapshot.folder,
);
for (const s of snapshotFallback) {
  console.warn(
    `build-data: FALLBACK - snapshots/${s.folder} is newer than snapshots/${latestSnapshot.folder} but incomplete (missing ${s.missing.join(', ')}); the site is built from the older snapshot`,
  );
}
/** The folder the data is read from. A label, not a date to show. */
const snapshotFolder = latestSnapshot.folder;
/** The day (UTC) the latest measurements were taken. This is the date the site shows and cites. */
const snapshotDate = latestSnapshot.measuredAt.slice(0, 10);

// ----------------------------------------------------------------- groups

check(crosswalk.length === EXPECTED.groups, `crosswalk.csv has ${crosswalk.length} groups, expected ${EXPECTED.groups}`);
const groupNames = crosswalk.map((r) => r.inali_name);
const groupSlug = new Map(groupNames.map((n) => [n, slug(n)]));
check(new Set(groupSlug.values()).size === groupNames.length, 'two groups share a slug');

// Weekly indicators: group -> indicator -> { value, state, ... }
const indicators = new Map(groupNames.map((n) => [n, {}]));
for (const source of WEEKLY) {
  const rows = readCsv(`snapshots/${snapshotFolder}/${source.file}`);
  for (const r of rows) {
    check(indicators.has(r.inali_name), `${source.file}: unknown group ${r.inali_name}`);
    check(source.indicators.includes(r.indicator), `${source.file}: unexpected indicator ${r.indicator}`);
    check(STATES.includes(r.state), `${source.file}: unknown state ${r.state}`);
    check(r.snapshot_date === snapshotFolder, `${source.file}: row labelled ${r.snapshot_date} in snapshots/${snapshotFolder}`);
    indicators.get(r.inali_name)[r.indicator] = {
      value: parseValue(r.value),
      state: r.state,
      source: r.source,
      // snapshot_date is the folder label carried in the CSV, not a date to display.
      snapshot_date: r.snapshot_date,
      measured_at: r.measured_at,
      detail: r.detail,
    };
  }
}
for (const n of groupNames) {
  for (const i of INDICATORS) check(indicators.get(n)[i], `no ${i} row for ${n} in snapshots/${snapshotFolder}`);
}

// Census speakers (static reference layer).
const speakers = new Map();
for (const r of census) {
  check(indicators.has(r.inali_name), `census: unknown group ${r.inali_name}`);
  check(STATES.includes(r.state), `census: unknown state ${r.state}`);
  speakers.set(r.inali_name, {
    value: parseValue(r.value),
    state: r.state,
    indicator: r.indicator,
    reference_period: Number(r.reference_period),
    source: r.source,
    retrieved_at: r.retrieved_at,
    detail: r.detail,
  });
}
for (const n of groupNames) check(speakers.has(n), `no census row for ${n}`);

// --------------------------------------------------------------- variants

const variantRows = groupBy(variants, 'variant'); // one row per autonym
check(variantRows.size === EXPECTED.variants, `variants.csv has ${variantRows.size} variants, expected ${EXPECTED.variants}`);

const ipaByKey = new Map();
for (const r of variantIpa) {
  const key = `${r.variant}\u0000${r.autonym}`;
  check(!ipaByKey.has(key), `variant_ipa.csv: duplicate ${r.variant} / ${r.autonym}`);
  ipaByKey.set(key, r);
}

const risk = new Map();
for (const r of riskRows) {
  check(variantRows.has(r.variant), `risk_grade.csv: unknown variant ${r.variant}`);
  check(!risk.has(r.variant), `risk_grade.csv: two rows for ${r.variant}`);
  risk.set(r.variant, {
    grade: Number(r.grade),
    grade_label: r.grade_label,
    census_year: Number(r.risk_grade_census_year),
    rank: Number(r.rank),
    speakers_30pct_localities: parseValue(r.speakers_30pct_localities),
    localities_30pct: parseValue(r.localities_30pct),
    child_proportion: parseValue(r.child_proportion),
    speakers_total: parseValue(r.speakers_total),
    localities_total: parseValue(r.localities_total),
    speaker_proportion: parseValue(r.speaker_proportion),
    family_printed: r.family_printed,
    group_printed: r.group_printed,
    variant_printed: r.variant_printed,
    join: r.join,
  });
}

const localitiesByVariant = groupBy(localities, 'variant');

function localitySummary(variant) {
  const rows = localitiesByVariant.get(variant) ?? [];
  const municipioKey = (r) => `${r.state_code}/${r.municipio_code || 'name:' + r.municipio}`;
  const byState = [...groupBy(rows, 'state_code')].map(([code, rs]) => ({
    state_code: code,
    state: rs[0].state,
    municipios: new Set(rs.map(municipioKey)).size,
    localities: rs.length,
  }));
  byState.sort((a, b) => b.localities - a.localities || a.state_code.localeCompare(b.state_code));
  return {
    source: 'INALI, Catálogo de las Lenguas Indígenas Nacionales (2008)',
    states: byState.length,
    municipios: new Set(rows.map(municipioKey)).size,
    localities: rows.length,
    // Rows whose municipio could not be given an INEGI code; they are
    // still counted above, by printed name.
    localities_without_municipio_code: rows.filter((r) => r.municipio_code === '').length,
    by_state: byState,
  };
}

const variantsByGroup = new Map(groupNames.map((n) => [n, []]));
const variantRecords = new Map();
for (const [id, rows] of variantRows) {
  const first = rows[0];
  check(variantsByGroup.has(first.group), `variants.csv: ${id} is in unknown group ${first.group}`);
  check(id === slug(id), `variants.csv: ${id} is not a clean slug`);
  const autonyms = rows.map((r) => {
    const ipa = ipaByKey.get(`${id}\u0000${r.autonym}`);
    check(ipa, `no variant_ipa.csv row for ${id} / ${r.autonym}`);
    return {
      autonym: r.autonym,
      autonym_appendix4: r.autonym_appendix4,
      // ipa is null while ipa_status is "in-review".
      ipa: ipa.ipa === '' ? null : ipa.ipa,
      ipa_status: ipa.ipa_status,
    };
  });
  const record = {
    variant: id,
    spanish_name: first.spanish_name,
    family: first.family,
    group: { name: first.group, slug: groupSlug.get(first.group) },
    // Only variants of a group that maps to a single Glottolog languoid
    // carry a Glottocode, and it is the group's, not the variant's own.
    glottocode: first.variant_glottocode
      ? { value: first.variant_glottocode, level: 'group' }
      : { value: null, level: null },
    autonyms,
    risk: risk.get(id) ?? null,
    localities: localitySummary(id),
  };
  check(record.risk, `no risk grade for ${id}`);
  variantRecords.set(id, record);
  variantsByGroup.get(first.group).push(record);
}

// ------------------------------------------------------------ group rollup

/** Highest-risk variant decides the group's grade (grade 1 is the highest risk). */
function riskRollup(name) {
  const vs = variantsByGroup.get(name);
  check(vs.length > 0, `group ${name} has no variants`);
  const worst = vs.reduce((a, b) => (b.risk.grade < a.risk.grade ? b : a));
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const v of vs) counts[v.risk.grade]++;
  return {
    grade: worst.risk.grade,
    grade_label: worst.risk.grade_label,
    rule: 'highest-risk variant',
    census_year: worst.risk.census_year,
    variants: vs.length,
    variants_by_grade: counts,
  };
}

function resourceCount(name) {
  const all = indicators.get(name);
  const states = RESOURCE_INDICATORS.map((i) => all[i].state);
  const counted = RESOURCE_INDICATORS.filter((i) => all[i].state === 'measured' && all[i].value > 0);
  // No indicator could be looked up at all: the count is unknown, not 0.
  if (states.every((st) => st === 'unresolved')) return { value: null, state: 'unresolved', indicators: [] };
  if (states.every((st) => st === 'not-covered')) return { value: null, state: 'not-covered', indicators: [] };
  return { value: counted.length, state: counted.length ? 'measured' : 'measured-zero', indicators: counted };
}

function hfFocusedTotal(name) {
  const parts = HF_FOCUSED.map((i) => indicators.get(name)[i]);
  if (parts.some((p) => p.state === 'unresolved')) return { value: null, state: 'unresolved' };
  if (parts.some((p) => p.state === 'not-covered')) return { value: null, state: 'not-covered' };
  const value = parts.reduce((sum, p) => sum + p.value, 0);
  return { value, state: value === 0 ? 'measured-zero' : 'measured' };
}

const membersByGroup = groupBy(members, 'inali_name');
const groups = crosswalk.map((c) => {
  const name = c.inali_name;
  return {
    name,
    slug: groupSlug.get(name),
    family: variantsByGroup.get(name)[0].family,
    identity: {
      inali_name: name,
      match_type: c.match_type,
      glottocode: c.canonical_glottocode || null,
      iso639_3: c.raw_iso639_3 ? c.raw_iso639_3.split(';') : [],
      collective_code: c.collective_code || null,
      source: c.source,
      members: (membersByGroup.get(name) ?? []).map((m) => ({
        iso639_3: m.iso639_3,
        glottocode: m.glottocode,
        glottolog_name: m.glottolog_name,
        scope: m.scope,
        scope_note: m.scope_note || null,
      })),
    },
    speakers: speakers.get(name),
    risk: riskRollup(name),
    indicators: indicators.get(name),
    resource_count: resourceCount(name),
    hf_focused_total: hfFocusedTotal(name),
  };
});

// ----------------------------------------------------------------- output

rmSync(OUT, { recursive: true, force: true });

const pick = ({ value, state }) => ({ value, state });

// 1. home.json
const aesCounts = new Map();
let aesUnresolved = 0;
for (const g of groups) {
  const e = g.indicators.endangerment_status;
  if (e.state === 'measured') aesCounts.set(e.value, (aesCounts.get(e.value) ?? 0) + 1);
  else aesUnresolved++;
}
for (const status of aesCounts.keys()) check(AES_ORDER.includes(status), `unknown AES category ${status}`);

const spokenL1 = glottologReference.find((r) => r.category === 'Spoken_L1_Language');
check(spokenL1 && /^\d+$/.test(spokenL1.languoids), 'reference/glottolog_reference.csv has no Spoken_L1_Language count');

writeJson('home.json', {
  // The day the latest measurements were taken (from measured_at).
  latest_snapshot: snapshotDate,
  // The folder they were read from: a label only, never shown as a date.
  snapshot_folder: snapshotFolder,
  snapshot_measured_at: latestSnapshot.measuredAt,
  // Empty unless a newer but incomplete snapshot folder was passed over.
  snapshot_fallback: snapshotFallback,
  // The day this build ran (UTC). Used as the default access date in citations.
  built_on: new Date().toISOString().slice(0, 10),
  totals: { groups: groups.length, variants: variantRecords.size },
  glottolog_reference_languages: {
    value: Number(spokenL1.languoids),
    state: 'measured',
    definition: 'Glottolog languoids in the category "Spoken L1 Language"',
    source: spokenL1.source,
  },
  resource_count_definition: RESOURCE_COUNT_DEFINITION,
  hf_focused_total_definition: HF_FOCUSED.join(' + '),
  risk_grade_definition: 'INALI 2012 grade of the highest-risk variant; 1 = muy alto, 4 = no inmediato',
  scatter: groups.map((g) => ({
    group: g.name,
    slug: g.slug,
    speakers: g.speakers.value,
    speakers_state: g.speakers.state,
    resource_count: g.resource_count.value,
    resource_count_state: g.resource_count.state,
    hf_focused_total: g.hf_focused_total.value,
    hf_focused_total_state: g.hf_focused_total.state,
    risk_grade: g.risk.grade,
    risk_grade_label: g.risk.grade_label,
    variants: g.risk.variants,
    variants_by_grade: g.risk.variants_by_grade,
  })),
  endangerment_breakdown: {
    source: groups[0].indicators.endangerment_status.source,
    rows: [
      ...AES_ORDER.map((status) => ({ status, state: 'measured', groups: aesCounts.get(status) ?? 0 })),
      { status: null, state: 'unresolved', groups: aesUnresolved },
    ],
  },
});

// 1b. method.json: every number the Method page quotes, so none is typed
// into the page by hand.
const countBy = (rows, key) => {
  const out = {};
  for (const r of rows) {
    const k = typeof key === 'function' ? key(r) : r[key];
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
};
const matchTypes = countBy(crosswalk, 'match_type');
const allVariants = [...variantRecords.values()];
const allAutonyms = allVariants.flatMap((v) => v.autonyms);

// INALI's stated rules for the four grades (2012 book, conditions table),
// applied as written, to count how many published grades they reproduce.
function statedGrade(r) {
  const many = r.localities_30pct > 1 && r.speakers_30pct_localities > 1000;
  if (r.localities_30pct === 0 || r.speakers_30pct_localities < 100) return 1;
  if (r.child_proportion < 25) return many ? 3 : 2;
  return many ? 4 : 3;
}
const ruleMisses = allVariants.filter((v) => statedGrade(v.risk) !== v.risk.grade);

const firstGroup = groups[0];
writeJson('method.json', {
  latest_snapshot: snapshotDate,
  totals: { groups: groups.length, variants: allVariants.length },
  glottolog_reference_languages: Number(spokenL1.languoids),
  crosswalk: {
    exact: matchTypes.exact ?? 0,
    many_to_one: matchTypes['many-to-one'] ?? 0,
    macrolanguage: matchTypes.macrolanguage ?? 0,
    unresolved: matchTypes.unresolved ?? 0,
    resolved: crosswalk.length - (matchTypes.unresolved ?? 0),
    unresolved_groups: groups.filter((g) => g.identity.match_type === 'unresolved').map((g) => ({ name: g.name, slug: g.slug })),
  },
  // The source string each fetcher recorded in the latest snapshot.
  sources: {
    glottolog: firstGroup.indicators.endangerment_status.source,
    huggingface: firstGroup.indicators.datasets_raw.source,
    common_voice: firstGroup.indicators.speech_corpus.source,
    universal_dependencies: firstGroup.indicators.treebanks.source,
    omnilingual_asr: firstGroup.indicators.tool_support_asr.source,
    inegi: firstGroup.speakers.source,
    inali_catalog: catalogBuild.source,
    inali_risk: riskBuild.source,
  },
  variants: {
    with_glottocode: allVariants.filter((v) => v.glottocode.value !== null).length,
    without_glottocode: allVariants.filter((v) => v.glottocode.value === null).length,
    autonym_rows: allAutonyms.length,
    ipa_status: countBy(allAutonyms, 'ipa_status'),
  },
  review_list: { total: reviewList.length, by_reason: countBy(reviewList, 'reason') },
  risk: {
    census_year: allVariants[0].risk.census_year,
    by_grade: countBy(allVariants, (v) => v.risk.grade),
    joins: countBy(allVariants, (v) => v.risk.join),
    stated_rules: {
      reproduced: allVariants.length - ruleMisses.length,
      of: allVariants.length,
      // The misses, to show what the unstated cutoff would have to be.
      missed_published_grades: countBy(ruleMisses, (v) => v.risk.grade),
      missed_child_proportion_max: ruleMisses.length ? Math.max(...ruleMisses.map((v) => v.risk.child_proportion)) : null,
    },
    // Names where the 2008 catalog and the 2012 risk book print different
    // direction words for what the locality counts show is one variant.
    direction_conflicts: riskAliases
      .filter((a) => a.kind === 'direction-conflict')
      .map((a) => {
        const v = variantRecords.get(a.variant);
        check(v, `risk_grade_aliases.csv: unknown variant ${a.variant}`);
        return {
          variant: v.variant,
          group: v.group,
          catalog_name: v.spanish_name,
          risk_book_name: a.risk_name,
          catalog_localities: v.localities.localities,
          risk_book_localities: v.risk.localities_total,
          risk_book_rank: v.risk.rank,
        };
      }),
  },
});

// 2. groups.json
// ---- data.json: the Data page's source register ---------------------------
// One entry per source. Cadence, version and last measurement come from the
// pipeline; the weekly schedule is read from the snapshot workflow itself;
// licence terms come from reference/source_terms.csv, where a blank stays a
// blank (the page then says the terms are not recorded yet, it never guesses).
const cronMatch = /cron:\s*"(\d+) (\d+) \* \* (\d)"/.exec(readFileSync(join(REPO, '.github/workflows/snapshot.yml'), 'utf8'));
check(cronMatch, 'snapshot.yml: weekly cron line not found');
const sourceTerms = new Map(readCsv('reference/source_terms.csv').map((r) => [r.source, r]));
// Where a researcher can get the authoritative version. Addresses the
// fetchers already use, or the publisher's own landing page.
const SOURCE_REGISTER = [
  { id: 'glottolog', file: 'glottolog.csv', access: 'release', url: 'https://doi.org/10.5281/zenodo.18840967' },
  { id: 'huggingface', file: 'huggingface.csv', access: 'api', url: 'https://huggingface.co/docs/hub/api' },
  { id: 'common_voice', file: 'common_voice.csv', access: 'repository', url: 'https://github.com/common-voice/cv-dataset' },
  { id: 'universal_dependencies', file: 'universal_dependencies.csv', access: 'repository', url: 'https://universaldependencies.org/' },
  { id: 'omnilingual_asr', file: 'omnilingual_asr.csv', access: 'repository', url: 'https://github.com/facebookresearch/omnilingual-asr' },
  { id: 'inegi', file: null, access: 'file', url: 'https://www.inegi.org.mx/programas/ccpv/2020/#tabulados' },
  { id: 'inali_catalog', file: null, access: 'document', url: 'https://www.inali.gob.mx/pdf/CLIN_completo.pdf' },
  { id: 'inali_risk', file: null, access: 'document', url: 'https://site.inali.gob.mx/pdf/libro_lenguas_indigenas_nacionales_en_riesgo_de_desaparicion.pdf' },
];
const recordedSource = {
  glottolog: firstGroup.indicators.endangerment_status.source,
  huggingface: firstGroup.indicators.datasets_raw.source,
  common_voice: firstGroup.indicators.speech_corpus.source,
  universal_dependencies: firstGroup.indicators.treebanks.source,
  omnilingual_asr: firstGroup.indicators.tool_support_asr.source,
  inegi: firstGroup.speakers.source,
  inali_catalog: catalogBuild.source,
  inali_risk: riskBuild.source,
};
writeJson('data.json', {
  latest_snapshot: snapshotDate,
  totals: { groups: groups.length, variants: allVariants.length },
  schedule: { weekday: Number(cronMatch[3]), hour_utc: Number(cronMatch[2]), minute_utc: Number(cronMatch[1]) },
  sources: SOURCE_REGISTER.map((src) => {
    const terms = sourceTerms.get(src.id);
    check(terms, `reference/source_terms.csv: no row for ${src.id}`);
    check(['', 'to-request', 'requested', 'granted', 'denied'].includes(terms.permission_status), `source_terms.csv: unknown permission_status for ${src.id}`);
    check(!['requested', 'granted', 'denied'].includes(terms.permission_status) || /^\d{4}-\d{2}-\d{2}$/.test(terms.permission_date), `source_terms.csv: ${src.id} needs permission_date`);
    let measuredAt = null;
    if (src.file) {
      for (const r of readCsv(`snapshots/${snapshotFolder}/${src.file}`)) {
        if (measuredAt === null || r.measured_at > measuredAt) measuredAt = r.measured_at;
      }
    }
    return {
      id: src.id,
      cadence: src.file ? 'weekly' : 'fixed',
      access: src.access,
      url: src.url,
      recorded_source: recordedSource[src.id],
      measured_at: measuredAt,
      license: terms.license || null,
      terms_url: terms.terms_url || null,
      terms_recorded_on: terms.recorded_on || null,
      // Only set where reuse depends on an answer from the publisher.
      permission_status: terms.permission_status || null,
      permission_date: terms.permission_date || null,
    };
  }),
});

writeJson('groups.json', {
  latest_snapshot: snapshotDate,
  groups: groups.map((g) => ({
    name: g.name,
    slug: g.slug,
    family: g.family,
    match_type: g.identity.match_type,
    speakers: pick(g.speakers),
    risk_grade: { grade: g.risk.grade, grade_label: g.risk.grade_label, variants: g.risk.variants },
    resource_count: pick(g.resource_count),
    hf_focused_total: pick(g.hf_focused_total),
    indicators: Object.fromEntries(INDICATORS.map((i) => [i, pick(g.indicators[i])])),
  })),
});

// 3. groups/<slug>.json
for (const g of groups) {
  writeJson(`groups/${g.slug}.json`, {
    name: g.name,
    slug: g.slug,
    family: g.family,
    latest_snapshot: snapshotDate,
    identity: g.identity,
    speakers: g.speakers,
    risk: g.risk,
    resource_count: g.resource_count,
    hf_focused_total: g.hf_focused_total,
    indicators: g.indicators,
    variants: variantsByGroup.get(g.name).map((v) => ({
      variant: v.variant,
      spanish_name: v.spanish_name,
      autonyms: v.autonyms.map((a) => a.autonym),
      risk_grade: v.risk.grade,
      risk_grade_label: v.risk.grade_label,
    })),
  });
}

// 4. variants/<variant-id>.json
for (const v of variantRecords.values()) writeJson(`variants/${v.variant}.json`, v);

console.log(`build-data: snapshot measured ${snapshotDate} (folder snapshots/${snapshotFolder}), ${groups.length} groups, ${variantRecords.size} variants, ${written} files -> src/data/`);
