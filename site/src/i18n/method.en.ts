import type { MethodContent, MethodData, Formatters } from './method';

export default function en(d: MethodData, f: Formatters): MethodContent {
  const c = d.crosswalk;
  const r = d.risk;
  const rv = d.review_list;
  return {
    title: 'Method',
    lede: 'What Glototeca measures, where the data comes from, how we decide that two names are the same language, and what we do not know yet.',
    contents: 'On this page',
    measures: {
      title: 'What this measures and what it does not',
      paragraphs: [
        `Once a week, Glototeca records which public digital resources exist for each of the ${f.n(d.totals.groups)} language groups in INALI's catalog: datasets, models, speech corpora, treebanks and support in one speech-recognition tool. It sets them beside two pieces of context: how many people speak the language and how much at risk it is.`,
        'It measures presence in public sources, not quality or usefulness. A dataset existing for a language says nothing about whether it is good, whether the community knows about it or whether it serves them. And nothing showing up does not mean nothing exists: it means nothing shows up in the sources we check.',
      ],
      statesTitle: 'The four states of a value',
      states: {
        measured: {
          name: 'Measured',
          example: 'Ayapaneco: {value} datasets on Hugging Face carry its tag.',
        },
        'measured-zero': {
          name: 'Checked, nothing found',
          example: 'Ayapaneco: we checked Universal Dependencies, which could hold a treebank for any language, and there is none. This is a real zero.',
        },
        'not-covered': {
          name: 'Source does not cover this language',
          example: 'Ayapaneco: Common Voice publishes a closed list of languages and this one is not on it. That is not a zero: the source does not include it.',
        },
        unresolved: {
          name: 'Identity unresolved',
          example: 'Ku’ahl: it has no ISO 639-3 code, so there is nothing to look it up by in any source. The value is unknown, and is shown as unknown.',
        },
      },
      noScoreTitle: 'No single score',
      noScore: 'The indicators are never combined into a rating. Adding datasets to treebanks, or weighting one against another, would produce a number that looks precise and means nothing. Each indicator is shown separately, with its source and its date.',
      scope: `Mexico is the pilot. The long-term aim is to apply the same method to every language in Glottolog's reference list (${f.n(d.glottolog_reference_languages)} spoken languages in version 5.3); today the site covers Mexico only.`,
    },
    sources: {
      title: 'Where the data comes from',
      lede: `Eight sources, all public and free. Five are checked every week; three are fixed publications that were loaded once. The latest snapshot is from ${f.date}.`,
      columns: { source: 'Source', provides: 'What it provides', access: 'How it is obtained', cadence: 'Cadence', version: 'Version on record' },
      weekly: 'Weekly',
      fixed: 'Fixed',
      rows: {
        glottolog: { name: 'Glottolog', provides: "Each language's identity and its endangerment status", access: 'A dated release, downloaded from Zenodo and pinned by its DOI' },
        huggingface: { name: 'Hugging Face', provides: 'Datasets and models tagged with the language', access: 'Public API, no account' },
        common_voice: { name: 'Common Voice', provides: 'Whether a speech corpus exists, and for how many varieties', access: 'Metadata for each release, published on GitHub' },
        universal_dependencies: { name: 'Universal Dependencies', provides: 'Released treebanks', access: 'Twice-yearly releases on GitHub' },
        omnilingual_asr: { name: 'Omnilingual ASR', provides: 'Whether the speech-recognition model declares support', access: "The model's own language list, by code" },
        inegi: { name: 'INEGI, 2020 Census', provides: 'Speakers aged 3 and over, by language', access: 'Official census table, downloaded once' },
        inali_catalog: { name: 'INALI, Catálogo de las Lenguas Indígenas Nacionales (2008)', provides: `The ${f.n(d.totals.variants)} variants: names, autonyms and localities`, access: 'Official PDF, read by a program and verified by its checksum' },
        inali_risk: { name: 'INALI, Lenguas indígenas nacionales en riesgo de desaparición (2012)', provides: 'The risk grade of each variant', access: 'Official PDF, read by a program and verified by its checksum' },
      },
      note: 'No source requires payment or a key. What a source publishes under its own terms stays under those terms.',
    },
    identity: {
      title: 'How identity is resolved',
      paragraphs: [
        "Every source names languages its own way. INALI speaks of groups and variants; Hugging Face and Common Voice use ISO 639-3 codes; Glottolog uses its own identifiers. Before counting anything, someone has to decide which code belongs to which group. That table of correspondences was built once, by hand, and checked against Glottolog's own cross-references. Everything else reads it automatically.",
        `Of the ${f.n(d.totals.groups)} groups, ${f.n(c.resolved)} are resolved: ${f.n(c.exact)} correspond to a single Glottolog language, ${f.n(c.many_to_one)} bring several together and ${f.n(c.macrolanguage)} is a macrolanguage. The remaining ${f.n(c.unresolved)} (${c.unresolved_groups.map((g) => g.name).join(', ')}) are not resolved, and the site shows them that way. A doubtful identity is flagged; it is never guessed.`,
      ],
      storyTitle: 'A risk caught in time',
      story: [
        'Several groups in the catalog are Mayan languages that are also spoken in Guatemala, or spoken mainly there. One natural way to build the table would have been to keep only the languages Glottolog places in Mexico.',
        `On checking, we found that for five of them (Awakateko, Ixil, Kaqchikel, Q’anjob’al and Q’eqchí’) Glottolog records no presence in Mexico. With that filter they would have vanished from the table without a trace, and the site would have shown ${f.n(d.totals.groups - 5)} groups as if that were all of them.`,
        `It did not happen, because matching is done by exact ISO code, with no filter by country. Even so, the ${f.n(c.many_to_one)} groups that were resolved by name were checked one by one to confirm none was exposed to the same problem. The case became a rule: no filter may remove a language silently.`,
      ],
    },
    error: {
      title: 'An error we found',
      paragraphs: [
        `The 2008 catalog and the 2012 risk book are two INALI publications about the same ${f.n(d.totals.variants)} variants. When we joined them, ${f.n(r.joins.exact)} names matched letter for letter. Among those that did not, ${f.n(r.direction_conflicts.length)} differ by a single word, and that word is a direction: where one publication says "noreste" (northeast), the other says "noroeste" (northwest).`,
        'This is not a spelling variant. They are two different directions. What shows that each pair is one and the same variant is a different kind of evidence: the number of localities each publication assigns to it.',
      ],
      columns: { catalog: '2008 catalog', book: '2012 risk book', catalogLocalities: 'Localities (2008)', bookLocalities: 'Localities (2012)' },
      after: [
        'The error is most likely in the 2008 catalog, though we cannot rule out that it is in the 2012 book. The documents alone do not settle it.',
        "So we did not correct it. The site keeps the name exactly as the catalog prints it, links each variant to its row in the risk book, and says on the variant's page how the link was made. The discrepancy stays flagged in the data, in plain view, so that INALI or any specialist can resolve it.",
      ],
    },
    limits: {
      title: 'Limitations',
      lede: 'What to know before quoting a figure from this site.',
      items: [
        {
          title: 'Risk and speakers come from different censuses',
          text: `The risk grades were calculated from the ${r.census_year} census. The speaker counts we show are from the 2020 census. Twenty years separate them: a variant may be better or worse off today than its grade says.`,
        },
        {
          title: 'Most variants have no identifier of their own',
          text: `Only ${f.n(d.variants.with_glottocode)} of the ${f.n(d.totals.variants)} variants carry a Glottocode, and it is their group's, not their own. The other ${f.n(d.variants.without_glottocode)} belong to groups that correspond to several Glottolog languages, and there is no reliable way to assign them. That is why digital resources are measured per group, not per variant.`,
        },
        {
          title: 'Some points are under review',
          text: `${f.n(rv.total)} cases are waiting for a manual review: transcriptions with tone marks we could not confirm, municipality names that are not in INEGI's list, and two geographic misprints in the catalog. In the meantime, ${f.n(d.variants.ipa_status['in-review'] ?? 0)} of the ${f.n(d.variants.autonym_rows)} phonetic transcriptions are not published. None of this was filled in with a guess.`,
        },
        {
          title: 'One threshold in the risk grade is inferred',
          text: `The rules INALI publishes for assigning the grades reproduce ${f.n(r.stated_rules.reproduced)} of the ${f.n(r.stated_rules.of)} published grades. A child-speaker threshold around 15% reproduces all ${f.n(r.stated_rules.of)} published grades under the stated rules for grade 2 vs 3; INALI's text does not state this value explicitly — it's a reverse-engineered inference from the data, confirmed against every known case but not confirmed as the source's actual rule. The site does not use it: it always shows the published grade.`,
        },
        {
          title: 'One column in the risk book is not explained',
          text: 'The book publishes a "proportion of speakers" for each variant without saying which population it is a share of. We show it as published, without interpreting it.',
        },
        {
          title: '"Focused on the language" is our own criterion',
          text: 'Many Hugging Face repositories tag hundreds of languages at once. To set those apart, we count separately the ones tagged for three groups or fewer. We chose that cutoff; a different one would change the figures.',
        },
      ],
    },
    license: {
      title: 'License',
      paragraphs: [
        'The code is free to use under the MIT license. The data Glototeca produces (the table of correspondences, the weekly snapshots and the files derived from them) is published under Creative Commons Attribution 4.0 (CC BY 4.0): it may be used and adapted with attribution.',
        "That license covers our work, not anyone else's. INEGI's figures, INALI's catalogs and Glottolog's classification belong to their authors and keep their own terms; Glototeca cannot relicense them. Anyone reusing that data should consult and cite the original source.",
        'One case is still open: the risk grades were extracted from a 2012 INALI book that reserves all rights. They are not published under CC BY 4.0; redistributing them depends on INALI\'s answer, and the current status is on the Data page.',
      ],
    },
    cite: {
      title: 'How to cite',
      intro: 'If you use this data in an article, a news report or research, please cite it like this.',
      subtitle: "Digital resource map of Mexico's indigenous languages",
      datasetLabel: 'Data set',
      copy: 'Copy',
      copied: 'Copied',
      failed: 'Could not copy',
      snapshotLine: 'The data reflects the snapshot of {date}.',
      accessLine: 'Access date:',
      doiNote: 'There is no permanent DOI yet. Until there is one, cite the site address and your access date.',
    },
    indigenous: {
      title: 'Indigenous data',
      paragraphs: [
        'This site records public metadata and links only: that something exists, where it is published and when it was seen. It does not copy, host or redistribute recordings, texts or materials in any language. Community-hosted and private content is never counted.',
        'A zero in these tables does not say that a language lacks resources. It says nothing is published in the sources we check. The knowledge a community keeps to itself is not here, and should not be.',
        'We take the CARE Principles for Indigenous Data Governance as our guide. Declaring them is not the same as meeting them; this is what we do today under each one:',
      ],
      care: [
        { name: 'Collective benefit', text: 'The site is open and free, meant for communities themselves to be able to see where their language stands.' },
        { name: 'Authority to control', text: 'We do not gather community data or make decisions about it. We only point to what others have already published.' },
        { name: 'Responsibility', text: 'Every figure carries its source and date, and the errors we find are flagged, not hidden.' },
        { name: 'Ethics', text: 'We do not rate languages or communities with a score, and we do not present missing data as a deficiency.' },
      ],
    },
  };
}
