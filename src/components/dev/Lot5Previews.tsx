'use client';

import { useState } from 'react';

import { SignupCheckoutModal } from '@/components/SignupCheckoutModal';
import { translations, type Course } from '@/types';

export function PreviewTrialModal() {
  const options = translations.FR.courses.visio;
  const [course, setCourse] = useState<Course | null>(options[0] ?? null);
  return (
    <SignupCheckoutModal
      course={course}
      courseOptions={options}
      onSelectCourse={setCourse}
      lang="FR"
      onClose={() => setCourse(options[0] ?? null)}
    />
  );
}
