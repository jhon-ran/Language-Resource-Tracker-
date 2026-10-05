// Prose for the Data page, both locales. Facts that the pipeline knows
// (cadence, schedule, recorded version, last measurement, licence terms)
// are NOT here: they come from src/data/data.json. This file only says, in
// words, what each source is for.
import type { Locale } from './ui';

export type SourceId =
  | 'glottolog' | 'huggingface' | 'common_voice' | 'universal_dependencies'
  | 'omnilingual_asr' | 'inegi' | 'inali_catalog' | 'inali_risk';
export type AccessKind = 'release' | 'api' | 'repository' | 'file' | 'document';

interface DataContent {
  title: string;
  lede: string;
  intro: { title: string; paragraphs: string[]; kindsTitle: string; kinds: { name: string; text: string }[]; method: string };
  sources: {
    title: string;
    lede: string;
    labels: { measures: string; access: string; cadence: string; version: string; measured: string; terms: string; original: string; derived: string };
    weekly: string; // {day} {time}
    fixed: string;
    access: Record<AccessKind, string>;
    termsMissing: string;
    terms: Record<SourceId, { label: string; note?: string }>;
    permission: Record<'to-request' | 'requested' | 'granted' | 'denied', string>; // {date}
    termsRecorded: string; // {date}
    originalLink: string;
    soon: string;
    soonNote: string;
    rows: Record<SourceId, { name: string; measures: string }>;
  };
  licensing: { title: string; paragraphs: string[]; link: string };
}

const es: DataContent = {
  title: 'Datos',
  lede: 'Qué se mide, de dónde viene cada dato y bajo qué condiciones lo publica su fuente. Las descargas de Glototeca todavía no están disponibles; cada fuente original sí, y aquí está el enlace a cada una.',
  intro: {
    title: 'Qué entendemos por recursos digitales',
    paragraphs: [
      'Nos referimos a los elementos técnicos necesarios para construir herramientas de lenguaje: traductores, reconocimiento de voz, correctores, teclados predictivos. No a contenido cultural como libros, música, video o sitios web escritos en la lengua.',
      'La distinción importa porque son cosas distintas. Una lengua puede tener una literatura abundante y ningún corpus con el que entrenar un modelo; lo contrario también ocurre. Este sitio mide solo lo segundo, y no dice nada sobre la vitalidad cultural de una lengua.',
    ],
    kindsTitle: 'Los cinco tipos que se cuentan',
    kinds: [
      { name: 'Conjuntos de datos', text: 'Colecciones de texto o audio preparadas para que un programa las lea.' },
      { name: 'Modelos', text: 'Sistemas ya entrenados que declaran trabajar con la lengua.' },
      { name: 'Corpus de voz', text: 'Grabaciones con su transcripción, la base del reconocimiento de voz.' },
      { name: 'Treebanks', text: 'Oraciones con su análisis gramatical anotado a mano.' },
      { name: 'Soporte en reconocimiento de voz', text: 'Si un modelo de reconocimiento declara la lengua entre las que admite.' },
    ],
    method: 'Cómo se mide cada uno, y los cuatro estados de un valor, están en la página de Método.',
  },
  sources: {
    title: 'Las fuentes, una por una',
    lede: 'Ocho fuentes. Para cada una: qué aporta, cómo la consulta Glototeca, bajo qué condiciones se publica y dónde obtener la versión original.',
    labels: { measures: 'Qué aporta', access: 'Cómo se obtiene', cadence: 'Frecuencia', version: 'Versión registrada', measured: 'Última medición', terms: 'Licencia o términos de la fuente', original: 'Fuente original', derived: 'Versión procesada por Glototeca' },
    weekly: 'Semanal: consulta programada cada {day} a las {time} UTC',
    fixed: 'Fija: publicación cargada una sola vez, no se vuelve a medir',
    access: {
      release: 'Versión fechada y fijada por su DOI, descargada de Zenodo',
      api: 'API pública, sin cuenta ni clave',
      repository: 'Archivos publicados en el repositorio público de la fuente',
      file: 'Tabulado oficial, descargado directamente',
      document: 'PDF oficial, leído con un programa y verificado por su huella digital',
    },
    termsMissing: 'Aún no registrados en este proyecto. Consulte los términos en la fuente original antes de reutilizar sus datos.',
    permission: {
      'to-request': 'Los grados de riesgo que muestra este sitio se extrajeron de esta publicación con derechos reservados. Se solicitará al INALI permiso para redistribuirlos como datos abiertos con atribución; todavía no se ha pedido ni confirmado.',
      requested: 'Los grados de riesgo que muestra este sitio se extrajeron de esta publicación con derechos reservados. Permiso de redistribución solicitado al INALI el {date}; pendiente de confirmación.',
      granted: 'El INALI autorizó el {date} la redistribución de los grados de riesgo como datos abiertos con atribución.',
      denied: 'El INALI no autorizó ({date}) la redistribución de los grados de riesgo.',
    },
    termsRecorded: 'consultado el {date}',
    // Wording of each source's terms. The record is reference/source_terms.csv
    // (licence, link, date checked); if a licence there changes, change it here.
    terms: {
      glottolog: { label: 'CC BY 4.0', note: 'Indicada en el registro de Zenodo de la versión 5.3.' },
      huggingface: { label: 'Por repositorio, más los Términos de Servicio de la plataforma', note: 'Cada conjunto de datos y cada modelo declara su propia licencia. Glototeca solo cuenta los listados; no copia su contenido.' },
      common_voice: { label: 'CC0-1.0 en Scripted Speech 27.0', note: 'Sin confirmar para Spontaneous Speech 5.0: no se encontró su ficha con la licencia. El repositorio de metadatos que se consulta es MPL-2.0.' },
      universal_dependencies: { label: 'Por treebank', note: 'Cada treebank trae su propia licencia, por lo general una variante de Creative Commons; algunas no permiten uso comercial.' },
      omnilingual_asr: { label: 'Apache 2.0 (código y modelos); CC-BY-4.0 (su corpus)' },
      inegi: { label: 'Términos de libre uso del INEGI', note: 'Permiten copiar, distribuir, adaptar y explotar comercialmente la información. Exigen dar crédito como «Fuente: INEGI, [producto]» y avisar de cualquier transformación sin presentarla como hecha o avalada por el INEGI.' },
      inali_catalog: { label: 'Sin licencia declarada', note: 'El documento, publicado en el Diario Oficial de la Federación el 14 de enero de 2008, no contiene aviso de derechos, licencia ni condiciones de reproducción. Se revisaron sus 256 páginas.' },
      inali_risk: { label: 'Todos los derechos reservados (D.R. © 2012 INALI)', note: 'La página legal prohíbe la reproducción total o parcial sin autorización por escrito.' },
    },
    originalLink: 'Ir a la fuente',
    soon: 'Próximamente',
    soonNote: 'La descarga todavía no existe.',
    rows: {
      glottolog: { name: 'Glottolog', measures: 'Da a cada lengua un identificador estable y su estado de amenaza; es la base para saber de qué lengua habla cada una de las demás fuentes.' },
      huggingface: { name: 'Hugging Face', measures: 'Cuenta los conjuntos de datos y los modelos etiquetados con la lengua en el mayor repositorio público de ambos.' },
      common_voice: { name: 'Common Voice', measures: 'Indica si existe un corpus de voz abierto para la lengua, la materia prima del reconocimiento de voz.' },
      universal_dependencies: { name: 'Universal Dependencies', measures: 'Cuenta los treebanks publicados, el recurso con que se construyen analizadores gramaticales.' },
      omnilingual_asr: { name: 'Omnilingual ASR', measures: 'Indica si un modelo de reconocimiento de voz de amplia cobertura declara soporte para la lengua.' },
      inegi: { name: 'INEGI, Censo de Población y Vivienda 2020', measures: 'Da el número de hablantes de 3 años y más por lengua, contra el cual se leen los recursos.' },
      inali_catalog: { name: 'INALI, Catálogo de las Lenguas Indígenas Nacionales (2008)', measures: 'Define las {groups} agrupaciones y sus {variants} variantes, con autodenominaciones y localidades: la unidad de registro del sitio.' },
      inali_risk: { name: 'INALI, Lenguas indígenas nacionales en riesgo de desaparición (2012)', measures: 'Da el grado de riesgo de cada variante, que acompaña a cada medición de recursos.' },
    },
  },
  licensing: {
    title: 'Sobre las licencias',
    paragraphs: [
      'Aquí conviven dos cosas con condiciones distintas.',
      'El trabajo propio de Glototeca se publica bajo CC BY 4.0: la correspondencia entre agrupaciones, códigos ISO 639-3 y Glottocodes; las mediciones semanales con sus cuatro estados; la resolución a nivel de variante; y los hallazgos sobre errores de dirección en los nombres de variantes. Podrá descargarse desde esta página cuando esa función exista.',
      'Los datos tomados de terceros conservan la licencia que publique cada fuente, indicada arriba con la fecha en que se consultó. Glototeca no afirma tener derecho a redistribuirlos en bloque hasta confirmarlo fuente por fuente.',
      'Hay un caso abierto. Los grados de riesgo provienen de un libro del INALI de 2012 que reserva todos los derechos. Su situación no está resuelta en ningún sentido: no se publican bajo CC BY 4.0 como si lo estuviera, y dependen de la respuesta del INALI. El estado actual aparece en la ficha de esa fuente.',
    ],
    link: 'Declaración formal de licencias, en la página de Método',
  },
};

const en: DataContent = {
  title: 'Data',
  lede: 'What is measured, where each figure comes from, and the terms its source publishes it under. Glototeca\'s own downloads are not available yet; every original source is, and each one is linked here.',
  intro: {
    title: 'What we mean by digital resources',
    paragraphs: [
      'This means the technical building blocks for language tools: translators, speech recognition, spell-checkers, predictive keyboards. It does not mean cultural content such as books, music, video or websites written in the language.',
      'The distinction matters because they are different things. A language can have a large literature and no corpus a model could be trained on; the reverse also happens. This site measures only the second, and says nothing about a language\'s cultural vitality.',
    ],
    kindsTitle: 'The five kinds that are counted',
    kinds: [
      { name: 'Datasets', text: 'Collections of text or audio prepared for a program to read.' },
      { name: 'Models', text: 'Trained systems that declare they work with the language.' },
      { name: 'Speech corpora', text: 'Recordings with their transcriptions, the basis of speech recognition.' },
      { name: 'Treebanks', text: 'Sentences with their grammatical analysis annotated by hand.' },
      { name: 'Speech recognition support', text: 'Whether a recognition model lists the language among those it supports.' },
    ],
    method: 'How each one is measured, and the four states a value can have, are on the Method page.',
  },
  sources: {
    title: 'The sources, one by one',
    lede: 'Eight sources. For each: what it provides, how Glototeca reads it, the terms it is published under, and where to get the original.',
    labels: { measures: 'What it provides', access: 'How it is obtained', cadence: 'Cadence', version: 'Recorded version', measured: 'Last measured', terms: 'Source licence or terms', original: 'Original source', derived: 'Glototeca\'s processed version' },
    weekly: 'Weekly: scheduled fetch every {day} at {time} UTC',
    fixed: 'Fixed: a publication loaded once, not re-measured',
    access: {
      release: 'Dated release pinned by its DOI, downloaded from Zenodo',
      api: 'Public API, no account or key',
      repository: 'Files published in the source\'s public repository',
      file: 'Official table, downloaded directly',
      document: 'Official PDF, read by a program and verified by its checksum',
    },
    termsMissing: 'Not yet recorded in this project. Check the terms at the original source before reusing its data.',
    permission: {
      'to-request': 'The risk grades shown on this site were extracted from this all-rights-reserved publication. Permission to redistribute them as open data, with attribution, will be requested from INALI; it has not yet been asked for or confirmed.',
      requested: 'The risk grades shown on this site were extracted from this all-rights-reserved publication. Redistribution permission requested from INALI on {date}; pending confirmation.',
      granted: 'On {date} INALI authorised redistribution of the risk grades as open data with attribution.',
      denied: 'INALI did not authorise ({date}) redistribution of the risk grades.',
    },
    termsRecorded: 'checked {date}',
    terms: {
      glottolog: { label: 'CC BY 4.0', note: 'Stated on the Zenodo record for release 5.3.' },
      huggingface: { label: 'Per repository, plus the platform Terms of Service', note: 'Each dataset and model states its own licence. Glototeca only counts the listings; it does not copy their content.' },
      common_voice: { label: 'CC0-1.0 on Scripted Speech 27.0', note: 'Unconfirmed for Spontaneous Speech 5.0: its listing with the licence was not found. The metadata repository that is read is MPL-2.0.' },
      universal_dependencies: { label: 'Per treebank', note: 'Each treebank carries its own licence, usually a Creative Commons variant; some do not allow commercial use.' },
      omnilingual_asr: { label: 'Apache 2.0 (code and models); CC-BY-4.0 (its corpus)' },
      inegi: { label: 'INEGI Terms of Free Use (Términos de libre uso)', note: 'They allow copying, distributing, adapting and commercial use. They require credit as "Fuente: INEGI, [product]" and disclosure of any transformation, without presenting it as done or endorsed by INEGI.' },
      inali_catalog: { label: 'No license stated', note: 'The document, published in the Diario Oficial de la Federación on 14 January 2008, contains no rights notice, licence or reproduction terms. All 256 pages were checked.' },
      inali_risk: { label: 'All rights reserved (D.R. © 2012 INALI)', note: 'The legal page prohibits reproduction in whole or in part without written permission.' },
    },
    originalLink: 'Go to the source',
    soon: 'Coming soon',
    soonNote: 'The download does not exist yet.',
    rows: {
      glottolog: { name: 'Glottolog', measures: 'Gives each language a stable identifier and its endangerment status; it is how every other source is tied to the right language.' },
      huggingface: { name: 'Hugging Face', measures: 'Counts the datasets and models tagged with the language in the largest public repository of both.' },
      common_voice: { name: 'Common Voice', measures: 'Shows whether an open speech corpus exists for the language, the raw material of speech recognition.' },
      universal_dependencies: { name: 'Universal Dependencies', measures: 'Counts released treebanks, the resource grammatical parsers are built from.' },
      omnilingual_asr: { name: 'Omnilingual ASR', measures: 'Shows whether a wide-coverage speech recognition model declares support for the language.' },
      inegi: { name: 'INEGI, 2020 Population and Housing Census', measures: 'Gives the number of speakers aged 3 and over per language, against which resources are read.' },
      inali_catalog: { name: 'INALI, Catálogo de las Lenguas Indígenas Nacionales (2008)', measures: 'Defines the {groups} groups and their {variants} variants, with autonyms and localities: the site\'s unit of record.' },
      inali_risk: { name: 'INALI, Lenguas indígenas nacionales en riesgo de desaparición (2012)', measures: 'Gives each variant\'s risk grade, shown beside every resource measurement.' },
    },
  },
  licensing: {
    title: 'A note on licences',
    paragraphs: [
      'Two things with different terms sit side by side here.',
      'Glototeca\'s own work is published under CC BY 4.0: the crosswalk between groups, ISO 639-3 codes and Glottocodes; the weekly measurements with their four states; the variant-level resolution; and the findings on direction errors in variant names. It will be downloadable from this page once that feature exists.',
      'Data drawn from third parties keeps whatever licence each source publishes, shown above with the date it was checked. Glototeca does not claim the right to redistribute it in bulk until that is confirmed source by source.',
      'One case is open. The risk grades come from a 2012 INALI book that reserves all rights. Their status is not settled either way: they are not published under CC BY 4.0 as if it were, and they depend on INALI\'s answer. The current status is on that source\'s card.',
    ],
    link: 'Formal licence statement, on the Method page',
  },
};

export const getData = (locale: Locale): DataContent => (locale === 'es' ? es : en);
