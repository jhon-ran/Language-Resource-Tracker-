import type es from './es';

// English UI strings. The type forces the same keys as es.ts, so a
// missing or extra key fails the type check.
const en: Record<keyof typeof es, string> = {
  'site.tagline': 'digital resources for the languages of Mexico',
  'lang.switch.label': 'Language',
  'theme.toggle': 'Switch between light and dark theme',
  'nav.label': 'Main',
  'nav.home': 'Home',
  'nav.languages': 'Languages',
  'nav.data': 'Data',
  'nav.method': 'Method',
  'nav.soon': 'coming soon',
  'skip': 'Skip to content',

  'footer.about': "Open, weekly snapshots of the digital resources that exist for Mexico's indigenous languages.",
  'footer.principle.title': 'Indigenous data',
  'footer.principle.text': 'This site records public metadata and links only. Community-hosted and private content is never counted.',
  'footer.sources': 'Sources',

  'home.eyebrow': 'Open data · updated weekly',
  'home.title': 'Which languages have data, models and corpora, and which do not?',
  'home.lede': "Every week we record which datasets, models, speech corpora, treebanks and tools exist for Mexico's 68 language groups, set beside their risk grade and number of speakers.",
  'home.stats.title': 'Latest snapshot',
  'home.stats.groups': 'Language groups',
  'home.stats.groups.note': "INALI's catalog",
  'home.stats.variants': 'Language variants',
  'home.stats.variants.note': 'Each with an INALI risk grade',
  'home.stats.reference': 'Languages in the reference list',
  'home.stats.reference.note': 'Glottolog 5.3, spoken L1 languages',
  'home.stats.date': 'Snapshot date',
  'home.stats.date.note': 'Weekly, append-only',
  'home.stats.principle': 'Every value is stored with the date it was measured. Indicators are never blended into a single score.',

  'scatter.title': 'More speakers does not always mean more resources',
  'scatter.lede': "Each dot is a language group. Further right, more speakers; further up, more kinds of digital resource. Color shows INALI's risk grade.",
  'scatter.x': 'Speakers aged 3 and over (2020 Census, log scale)',
  'scatter.y': 'Kinds of resource with at least one record (of 5)',
  'scatter.legend': 'Risk grade (INALI 2012), highest-risk variant',
  'scatter.grade.1': 'Very high',
  'scatter.grade.2': 'High',
  'scatter.grade.3': 'Medium',
  'scatter.grade.4': 'No immediate risk',
  'scatter.tip.speakers': 'Speakers',
  'scatter.tip.resources': 'Kinds of resource',
  'scatter.tip.risk': 'Risk',
  'scatter.tip.variants': 'variants at this grade',
  'scatter.of': 'of',
  'scatter.note.resources': 'The five kinds: datasets and models on Hugging Face focused on the language, a speech corpus in Common Voice, treebanks in Universal Dependencies, and support in Omnilingual ASR.',
  'scatter.note.spread': 'Within each row the dots are spread slightly up and down so they do not overlap.',
  'scatter.note.missing': 'Not shown in the chart',
  'scatter.missing.speakers': 'no row in the census',
  'scatter.missing.resources': 'identity unresolved',
  'scatter.aria': 'Scatter plot of the language groups: speakers against kinds of digital resource, colored by risk grade.',
};

export default en;
