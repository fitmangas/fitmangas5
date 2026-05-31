import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

type Props = {
  label?: string;
  className?: string;
};

export function CompteDashboardBackLink({ label = 'Dashboard', className = '' }: Props) {
  return (
    <Link
      href="/compte"
      className={`inline-flex items-center gap-0.5 text-xs text-luxury-muted transition hover:text-luxury-ink ${className}`.trim()}
    >
      <ChevronLeft size={16} strokeWidth={2} aria-hidden />
      {label}
    </Link>
  );
}
