import type es from './es';

// English UI strings. The type forces the same keys as es.ts, so a
// missing or extra key fails the type check.
const en: Record<keyof typeof es, string> = {
  'site.tagline': "a map of the world's languages and their digital resources",
  'lang.switch': 'Leer en español',
};

export default en;
