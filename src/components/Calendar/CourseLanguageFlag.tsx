import { courseLanguageAriaLabel, courseLanguageFlag, type CourseLanguage } from '@/lib/course-language';

type Props = {
  language?: CourseLanguage | null;
  uiLang?: 'fr' | 'es' | 'en';
  className?: string;
};

/** Drapeau discret (FR / ES) — affiché uniquement si la langue du cours est définie. */
export function CourseLanguageFlag({ language, uiLang = 'fr', className = '' }: Props) {
  const flag = courseLanguageFlag(language);
  if (!flag || !language) return null;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center text-base leading-none md:text-lg ${className}`.trim()}
      role="img"
      aria-label={courseLanguageAriaLabel(language, uiLang)}
      title={courseLanguageAriaLabel(language, uiLang)}
    >
      {flag}
    </span>
  );
}
