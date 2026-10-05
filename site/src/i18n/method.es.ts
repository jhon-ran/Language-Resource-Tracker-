import type { MethodContent, MethodData, Formatters } from './method';

export default function es(d: MethodData, f: Formatters): MethodContent {
  const c = d.crosswalk;
  const r = d.risk;
  const rv = d.review_list;
  return {
    title: 'Método',
    lede: 'Qué mide Glototeca, de dónde salen los datos, cómo se decide que dos nombres son la misma lengua, y qué no sabemos todavía.',
    contents: 'En esta página',
    measures: {
      title: 'Qué mide y qué no',
      paragraphs: [
        `Glototeca registra, una vez por semana, qué recursos digitales públicos existen para cada una de las ${f.n(d.totals.groups)} agrupaciones lingüísticas del catálogo del INALI: conjuntos de datos, modelos, corpus de voz, treebanks y soporte en una herramienta de reconocimiento de voz. Los pone junto a dos datos de contexto: cuántas personas hablan la lengua y qué tan en riesgo está.`,
        'Mide presencia en fuentes públicas, no calidad ni utilidad. Que una lengua tenga un conjunto de datos no dice si es bueno, si la comunidad lo conoce o si le sirve. Y que no aparezca nada no significa que no exista nada: significa que nada aparece en las fuentes que revisamos.',
      ],
      statesTitle: 'Los cuatro estados de un valor',
      states: {
        measured: {
          name: 'Medido',
          example: 'Ayapaneco: {value} conjuntos de datos en Hugging Face llevan su etiqueta.',
        },
        'measured-zero': {
          name: 'Revisado, sin resultados',
          example: 'Ayapaneco: se revisó Universal Dependencies, que podría contener un treebank de cualquier lengua, y no hay ninguno. Es un cero de verdad.',
        },
        'not-covered': {
          name: 'La fuente no cubre esta lengua',
          example: 'Ayapaneco: Common Voice publica una lista cerrada de lenguas y esta no está en ella. No es un cero: la fuente no la contempla.',
        },
        unresolved: {
          name: 'Identidad sin resolver',
          example: 'Ku’ahl: no tiene código ISO 639-3, así que no hay con qué buscarlo en ninguna fuente. El valor se desconoce y así se muestra.',
        },
      },
      noScoreTitle: 'Sin puntaje único',
      noScore: 'Los indicadores nunca se combinan en una calificación. Sumar conjuntos de datos con treebanks, o ponderar uno contra otro, produciría un número que parece preciso y no significa nada. Cada indicador se muestra por separado, con su fuente y su fecha.',
      scope: `México es el piloto. La meta a largo plazo es aplicar el mismo método a todas las lenguas de la lista de referencia de Glottolog (${f.n(d.glottolog_reference_languages)} lenguas habladas en la versión 5.3); hoy el sitio solo cubre México.`,
    },
    sources: {
      title: 'De dónde vienen los datos',
      lede: `Ocho fuentes, todas públicas y sin costo. Cinco se consultan cada semana; tres son publicaciones fijas que se cargaron una vez. La instantánea más reciente es del ${f.date}.`,
      columns: { source: 'Fuente', provides: 'Qué aporta', access: 'Cómo se obtiene', cadence: 'Frecuencia', version: 'Versión registrada' },
      weekly: 'Semanal',
      fixed: 'Fija',
      rows: {
        glottolog: { name: 'Glottolog', provides: 'Identidad de cada lengua y su estado de amenaza', access: 'Versión fechada, descargada de Zenodo y fijada por su DOI' },
        huggingface: { name: 'Hugging Face', provides: 'Conjuntos de datos y modelos etiquetados con la lengua', access: 'API pública, sin cuenta' },
        common_voice: { name: 'Common Voice', provides: 'Si hay corpus de voz y de cuántas variedades', access: 'Metadatos de cada versión, publicados en GitHub' },
        universal_dependencies: { name: 'Universal Dependencies', provides: 'Treebanks publicados', access: 'Versiones semestrales en GitHub' },
        omnilingual_asr: { name: 'Omnilingual ASR', provides: 'Si el modelo de reconocimiento de voz declara soporte', access: 'Lista de lenguas del propio modelo, por código' },
        inegi: { name: 'INEGI, Censo 2020', provides: 'Hablantes de 3 años y más, por lengua', access: 'Tabulado oficial del censo, descargado una vez' },
        inali_catalog: { name: 'INALI, Catálogo de las Lenguas Indígenas Nacionales (2008)', provides: `Las ${f.n(d.totals.variants)} variantes: nombres, autodenominaciones y localidades`, access: 'PDF oficial, leído con un programa y verificado por su huella digital' },
        inali_risk: { name: 'INALI, Lenguas indígenas nacionales en riesgo de desaparición (2012)', provides: 'Grado de riesgo de cada variante', access: 'PDF oficial, leído con un programa y verificado por su huella digital' },
      },
      note: 'Ninguna fuente requiere pago ni clave. Lo que una fuente publica bajo sus propias condiciones sigue bajo esas condiciones.',
    },
    identity: {
      title: 'Cómo se resuelve la identidad',
      paragraphs: [
        'Cada fuente nombra las lenguas a su manera. El INALI habla de agrupaciones y variantes; Hugging Face y Common Voice usan códigos ISO 639-3; Glottolog usa sus propios identificadores. Antes de contar nada hay que decidir qué código corresponde a qué agrupación. Esa tabla de correspondencias se hizo una sola vez, a mano, y se verificó contra las referencias cruzadas del propio Glottolog. Todo lo demás la lee automáticamente.',
        `De las ${f.n(d.totals.groups)} agrupaciones, ${f.n(c.resolved)} quedaron resueltas: ${f.n(c.exact)} corresponden a una sola lengua de Glottolog, ${f.n(c.many_to_one)} reúnen varias y ${f.n(c.macrolanguage)} es una macrolengua. Las ${f.n(c.unresolved)} restantes (${c.unresolved_groups.map((g) => g.name).join(', ')}) no se resolvieron, y así aparecen en el sitio. Una identidad dudosa se marca; nunca se adivina.`,
      ],
      storyTitle: 'Un riesgo que se encontró a tiempo',
      story: [
        'Varias agrupaciones del catálogo son lenguas mayas que también se hablan en Guatemala, o que se hablan sobre todo allá. Una forma natural de construir la tabla habría sido quedarse solo con las lenguas que Glottolog ubica en México.',
        `Al revisar, encontramos que para cinco de ellas (Awakateko, Ixil, Kaqchikel, Q’anjob’al y Q’eqchí’) Glottolog no registra presencia en México. Con ese filtro habrían desaparecido de la tabla sin dejar rastro, y el sitio habría mostrado ${f.n(d.totals.groups - 5)} agrupaciones como si fueran todas.`,
        `No pasó, porque la correspondencia se hace por código ISO exacto, sin filtrar por país. Aun así se revisaron una por una las ${f.n(c.many_to_one)} agrupaciones que se resolvieron por nombre, para confirmar que ninguna estuviera expuesta al mismo problema. El caso quedó como regla: ningún filtro puede quitar una lengua en silencio.`,
      ],
    },
    error: {
      title: 'Un error que encontramos',
      paragraphs: [
        `El catálogo de 2008 y el libro de riesgo de 2012 son dos publicaciones del INALI sobre las mismas ${f.n(d.totals.variants)} variantes. Al cruzarlas, ${f.n(r.joins.exact)} nombres coinciden letra por letra. Entre los que no, hay ${f.n(r.direction_conflicts.length)} que difieren en una sola palabra, y esa palabra es una dirección: donde una publicación dice «noreste», la otra dice «noroeste».`,
        'No es una variante ortográfica. Son dos direcciones distintas. Lo que permite saber que se trata de la misma variante es otra evidencia: el número de localidades que cada publicación le asigna.',
      ],
      columns: { catalog: 'Catálogo de 2008', book: 'Libro de riesgo de 2012', catalogLocalities: 'Localidades (2008)', bookLocalities: 'Localidades (2012)' },
      after: [
        'Lo más probable es que el error esté en el catálogo de 2008, aunque no podemos descartar que esté en el libro de 2012. No tenemos forma de saberlo desde los documentos.',
        'Por eso no lo corregimos. El sitio conserva el nombre tal como lo imprime el catálogo, vincula cada variante con su renglón del libro de riesgo, y dice en la página de la variante cómo se hizo el vínculo. La discrepancia queda marcada en los datos, a la vista, para que el INALI o cualquier especialista pueda resolverla.',
      ],
    },
    limits: {
      title: 'Limitaciones',
      lede: 'Lo que conviene saber antes de citar una cifra de este sitio.',
      items: [
        {
          title: 'El riesgo y los hablantes son de censos distintos',
          text: `Los grados de riesgo se calcularon con el censo de ${r.census_year}. El número de hablantes que mostramos es del censo de 2020. Entre uno y otro pasaron veinte años: una variante puede estar hoy mejor o peor de lo que dice su grado.`,
        },
        {
          title: 'La mayoría de las variantes no tiene identificador propio',
          text: `Solo ${f.n(d.variants.with_glottocode)} de las ${f.n(d.totals.variants)} variantes llevan un Glottocode, y es el de su agrupación, no uno propio. Las otras ${f.n(d.variants.without_glottocode)} pertenecen a agrupaciones que corresponden a varias lenguas de Glottolog, y no hay una forma confiable de asignarlas. Por eso los recursos digitales se miden por agrupación y no por variante.`,
        },
        {
          title: 'Hay puntos en revisión',
          text: `${f.n(rv.total)} casos esperan una revisión manual: transcripciones con signos de tono que no pudimos confirmar, nombres de municipio que no aparecen en la lista del INEGI, y dos erratas geográficas del catálogo. Mientras tanto, ${f.n(d.variants.ipa_status['in-review'] ?? 0)} de las ${f.n(d.variants.autonym_rows)} transcripciones fonéticas no se publican. Nada de esto se rellenó con una suposición.`,
        },
        {
          title: 'Un umbral del grado de riesgo es inferido',
          text: `Las reglas que el INALI publica para asignar los grados reproducen ${f.n(r.stated_rules.reproduced)} de los ${f.n(r.stated_rules.of)} grados publicados. Un umbral de niños hablantes de alrededor de 15% reproduce los ${f.n(r.stated_rules.of)} grados publicados bajo las reglas declaradas para distinguir el grado 2 del 3; el texto del INALI no declara ese valor explícitamente: es una inferencia hecha a partir de los datos, confirmada contra todos los casos conocidos pero no confirmada como la regla real de la fuente. El sitio no la usa: siempre muestra el grado publicado.`,
        },
        {
          title: 'Una columna del libro de riesgo no está explicada',
          text: 'El libro publica una «proporción de hablantes» por variante sin decir respecto a qué población se calcula. La mostramos como se publica, sin interpretarla.',
        },
        {
          title: 'Dedicado a la lengua es un criterio nuestro',
          text: 'Muchos repositorios de Hugging Face etiquetan cientos de lenguas a la vez. Para distinguirlos, contamos aparte los que están etiquetados para tres agrupaciones o menos. Ese corte lo elegimos nosotros; con otro corte las cifras cambiarían.',
        },
      ],
    },
    license: {
      title: 'Licencia',
      paragraphs: [
        'El código es de uso libre bajo la licencia MIT. Los datos que Glototeca produce (la tabla de correspondencias, las instantáneas semanales y los archivos derivados) se publican bajo Creative Commons Atribución 4.0 (CC BY 4.0): se pueden usar y adaptar citando la fuente.',
        'Esa licencia cubre nuestro trabajo, no el de otros. Las cifras del INEGI, los catálogos del INALI y la clasificación de Glottolog pertenecen a sus autores y conservan sus propias condiciones; Glototeca no puede volver a licenciarlos. Quien reutilice esos datos debe consultar y citar la fuente original.',
        'Un caso sigue abierto: los grados de riesgo se extrajeron de un libro del INALI de 2012 que reserva todos los derechos. No se publican bajo CC BY 4.0; su redistribución depende de la respuesta del INALI, y el estado actual está en la página de Datos.',
      ],
      files: 'Los textos completos están en el repositorio: LICENSE (código) y LICENSE-DATA (datos).',
    },
    cite: {
      title: 'Cómo citar',
      intro: 'Si usas estos datos en un artículo, reportaje o investigación, por favor cítalos así.',
      subtitle: 'Mapa de recursos digitales de las lenguas indígenas de México',
      datasetLabel: 'Conjunto de datos',
      copy: 'Copiar',
      copied: 'Copiado',
      failed: 'No se pudo copiar',
      snapshotLine: 'Los datos corresponden a la instantánea del {date}.',
      accessLine: 'Fecha de consulta:',
      doiNote: 'Todavía no hay un DOI permanente. Mientras tanto, cita la dirección del sitio y tu fecha de consulta.',
    },
    indigenous: {
      title: 'Datos indígenas',
      paragraphs: [
        'Este sitio registra solo metadatos públicos y enlaces: que algo existe, dónde está publicado y cuándo se vio. No copia, aloja ni redistribuye grabaciones, textos ni materiales de ninguna lengua. El contenido privado o resguardado por las comunidades nunca se cuenta.',
        'Un cero en estas tablas no dice que una lengua carezca de recursos. Dice que no hay nada publicado en las fuentes que revisamos. El conocimiento que una comunidad guarda para sí no está aquí, y no debe estar.',
        'Tomamos como guía los principios CARE para la gobernanza de datos indígenas. No los cumplimos por declararlo; esto es lo que hacemos hoy respecto a cada uno:',
      ],
      care: [
        { name: 'Beneficio colectivo', text: 'El sitio es abierto y gratuito, pensado para que las propias comunidades puedan ver dónde está su lengua.' },
        { name: 'Autoridad para controlar', text: 'No reunimos datos de las comunidades ni decidimos sobre ellos. Solo señalamos lo que terceros ya publicaron.' },
        { name: 'Responsabilidad', text: 'Cada cifra lleva su fuente y su fecha, y los errores que encontramos se marcan en lugar de ocultarse.' },
        { name: 'Ética', text: 'No calificamos lenguas ni comunidades con un puntaje, y no presentamos la ausencia de datos como carencia.' },
      ],
      contact: 'Si una comunidad considera que algo de lo que mostramos no debería estar aquí, o está mal, puede decirlo en el repositorio del proyecto y se atenderá.',
    },
  };
}
