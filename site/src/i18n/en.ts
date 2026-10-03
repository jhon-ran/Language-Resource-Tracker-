import type es from './es';

// English UI strings. The type forces the same keys as es.ts, so a
// missing or extra key fails the type check.
const en: Record<keyof typeof es, string> = {
  'site.title': 'Language Resource Tracker',
  'placeholder.text': 'Placeholder page. The site is under construction.',
  'lang.switch': 'Leer en español',
};

export default en;
