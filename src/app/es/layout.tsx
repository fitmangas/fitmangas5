import { HtmlLang } from '@/components/Marketing/HtmlLang';

export default function EsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HtmlLang lang="es" />
      {children}
    </>
  );
}
