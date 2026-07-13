/** Langue de séance choisie par l'admin (colonne `course_language`). */
export type CourseLanguage = 'fr' | 'es';

export function isCourseLanguage(value: unknown): value is CourseLanguage {
  return value === 'fr' || value === 'es';
}

export function courseLanguageFlag(language: CourseLanguage | null | undefined): string | null {
  if (language === 'fr') return '🇫🇷';
  if (language === 'es') return '🇪🇸';
  return null;
}

export function courseLanguageAriaLabel(language: CourseLanguage, uiLang: 'fr' | 'es' | 'en' = 'fr'): string {
  if (language === 'fr') {
    return uiLang === 'es' ? 'Curso en francés' : uiLang === 'en' ? 'Course in French' : 'Cours en français';
  }
  return uiLang === 'es' ? 'Curso en español' : uiLang === 'en' ? 'Course in Spanish' : 'Cours en espagnol';
}
