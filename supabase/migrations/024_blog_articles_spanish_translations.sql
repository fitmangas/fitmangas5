-- Traductions espagnoles des articles blog existants.
-- Gemini a été tenté mais a atteint le quota free tier (429).
-- Cette migration fournit des traductions ES manuelles/déterministes pour supprimer les fallbacks FR.

update public.blog_articles
set title_es = 'Mi primer artículo de pilates',
    description_es = 'Breve introducción para la tarjeta del artículo.',
    content_es = 'Primer párrafo.

Segundo párrafo después de una línea vacía.
```

- **Categoría**: uno de los slugs sembrados (`technique`, `respiration`, `posture`, `renforcement`, `bien-etre`, `nutrition`) o un slug personalizado (creación automática si falta).
- **Fecha**: `YYYY-MM-DD` — sirve para `scheduled_publication_at` (mediodía UTC) y para la agrupación mensual (8 artículos / mes).

Si el archivo contiene menos de 104 entradas, el script completa con artículos genéricos hasta alcanzar 104 líneas.',
    meta_description_es = 'Breve introducción para la tarjeta del artículo.',
    slug_es = 'mi-primer-articulo-de-pilates',
    updated_at = now()
where id = '4b807e55-4294-4c19-8527-10ad95b5aba2';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('4b807e55-4294-4c19-8527-10ad95b5aba2', 'es', 'Mi primer artículo de pilates', 'Breve introducción para la tarjeta del artículo.', 'Primer párrafo.

Segundo párrafo después de una línea vacía.
```

- **Categoría**: uno de los slugs sembrados (`technique`, `respiration`, `posture`, `renforcement`, `bien-etre`, `nutrition`) o un slug personalizado (creación automática si falta).
- **Fecha**: `YYYY-MM-DD` — sirve para `scheduled_publication_at` (mediodía UTC) y para la agrupación mensual (8 artículos / mes).

Si el archivo contiene menos de 104 entradas, el script completa con artículos genéricos hasta alcanzar 104 líneas.', 'Breve introducción para la tarjeta del artículo.', 'mi-primer-articulo-de-pilates', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 100 — movimiento y respiración',
    description_es = 'Descripción breve del artículo 100.',
    content_es = 'Párrafo introductorio del artículo 100.

Párrafo de desarrollo: respiración, alineación y regularidad.',
    meta_description_es = 'Descripción breve del artículo 100.',
    slug_es = 'articulo-pilates-100-movimiento-y-respiracion',
    updated_at = now()
where id = '782a5341-34e8-45a2-ac67-fdaafe0fdc4a';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('782a5341-34e8-45a2-ac67-fdaafe0fdc4a', 'es', 'Artículo pilates 100 — movimiento y respiración', 'Descripción breve del artículo 100.', 'Párrafo introductorio del artículo 100.

Párrafo de desarrollo: respiración, alineación y regularidad.', 'Descripción breve del artículo 100.', 'articulo-pilates-100-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 101 — movimiento y respiración',
    description_es = 'Descripción breve del artículo 101.',
    content_es = 'Párrafo introductorio del artículo 101.

Párrafo de desarrollo: respiración, alineación y regularidad.',
    meta_description_es = 'Descripción breve del artículo 101.',
    slug_es = 'articulo-pilates-101-movimiento-y-respiracion',
    updated_at = now()
where id = 'bab18002-ab1b-47f8-85b8-fd7dfd2d7e54';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('bab18002-ab1b-47f8-85b8-fd7dfd2d7e54', 'es', 'Artículo pilates 101 — movimiento y respiración', 'Descripción breve del artículo 101.', 'Párrafo introductorio del artículo 101.

Párrafo de desarrollo: respiración, alineación y regularidad.', 'Descripción breve del artículo 101.', 'articulo-pilates-101-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 102 — movimiento y respiración',
    description_es = 'Descripción breve del artículo 102.',
    content_es = 'Párrafo introductorio del artículo 102.

Párrafo de desarrollo: respiración, alineación y regularidad.',
    meta_description_es = 'Descripción breve del artículo 102.',
    slug_es = 'articulo-pilates-102-movimiento-y-respiracion',
    updated_at = now()
where id = 'b42bfc75-cfab-4a53-8296-8af805766b48';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('b42bfc75-cfab-4a53-8296-8af805766b48', 'es', 'Artículo pilates 102 — movimiento y respiración', 'Descripción breve del artículo 102.', 'Párrafo introductorio del artículo 102.

Párrafo de desarrollo: respiración, alineación y regularidad.', 'Descripción breve del artículo 102.', 'articulo-pilates-102-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 103 — movimiento y respiración',
    description_es = 'Descripción breve del artículo 103.',
    content_es = 'Párrafo introductorio del artículo 103.

Párrafo de desarrollo: respiración, alineación y regularidad.',
    meta_description_es = 'Descripción breve del artículo 103.',
    slug_es = 'articulo-pilates-103-movimiento-y-respiracion',
    updated_at = now()
where id = '41edf966-c07f-4541-afc9-2ac937afbe84';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('41edf966-c07f-4541-afc9-2ac937afbe84', 'es', 'Artículo pilates 103 — movimiento y respiración', 'Descripción breve del artículo 103.', 'Párrafo introductorio del artículo 103.

Párrafo de desarrollo: respiración, alineación y regularidad.', 'Descripción breve del artículo 103.', 'articulo-pilates-103-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 104 — movimiento y respiración',
    description_es = 'Descripción breve del artículo 104.',
    content_es = 'Párrafo introductorio del artículo 104.

Párrafo de desarrollo: respiración, alineación y regularidad.',
    meta_description_es = 'Descripción breve del artículo 104.',
    slug_es = 'articulo-pilates-104-movimiento-y-respiracion',
    updated_at = now()
where id = '06702c4e-a9f9-4856-83c2-faf3912d77a0';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('06702c4e-a9f9-4856-83c2-faf3912d77a0', 'es', 'Artículo pilates 104 — movimiento y respiración', 'Descripción breve del artículo 104.', 'Párrafo introductorio del artículo 104.

Párrafo de desarrollo: respiración, alineación y regularidad.', 'Descripción breve del artículo 104.', 'articulo-pilates-104-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 2 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 2 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-2-movimiento-y-respiracion',
    updated_at = now()
where id = '20bffcbd-d853-49a6-ad1d-48c1a72b15e8';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('20bffcbd-d853-49a6-ad1d-48c1a72b15e8', 'es', 'Artículo pilates 2 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 2 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-2-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 3 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 3 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-3-movimiento-y-respiracion',
    updated_at = now()
where id = '69bd45d1-db7c-4460-8af0-2b1817b54ac4';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('69bd45d1-db7c-4460-8af0-2b1817b54ac4', 'es', 'Artículo pilates 3 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 3 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-3-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 4 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 4 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-4-movimiento-y-respiracion',
    updated_at = now()
where id = 'de5d115d-be8d-4e74-9a6d-0fef7a989160';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('de5d115d-be8d-4e74-9a6d-0fef7a989160', 'es', 'Artículo pilates 4 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 4 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-4-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 5 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 5 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-5-movimiento-y-respiracion',
    updated_at = now()
where id = 'f215055f-046b-4c2f-a12b-0212d9f89d39';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('f215055f-046b-4c2f-a12b-0212d9f89d39', 'es', 'Artículo pilates 5 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 5 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-5-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 6 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 6 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-6-movimiento-y-respiracion',
    updated_at = now()
where id = 'c32e57f9-5769-4ef9-970c-40f431acb824';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('c32e57f9-5769-4ef9-970c-40f431acb824', 'es', 'Artículo pilates 6 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 6 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-6-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 7 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 7 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-7-movimiento-y-respiracion',
    updated_at = now()
where id = '59ce4728-9d6c-416a-8905-c3a02085d135';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('59ce4728-9d6c-416a-8905-c3a02085d135', 'es', 'Artículo pilates 7 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 7 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-7-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 8 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 8 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-8-movimiento-y-respiracion',
    updated_at = now()
where id = 'ab68e12e-e790-48af-bac1-2c6fd28d265c';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('ab68e12e-e790-48af-bac1-2c6fd28d265c', 'es', 'Artículo pilates 8 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 8 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-8-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 9 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 9 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-9-movimiento-y-respiracion',
    updated_at = now()
where id = '39733c65-6161-45d3-8145-4eae8f44645a';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('39733c65-6161-45d3-8145-4eae8f44645a', 'es', 'Artículo pilates 9 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 9 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-9-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 10 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 10 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-10-movimiento-y-respiracion',
    updated_at = now()
where id = 'c3c6d747-3a17-4533-a379-8032b7ced166';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('c3c6d747-3a17-4533-a379-8032b7ced166', 'es', 'Artículo pilates 10 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 10 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-10-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 11 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 11 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-11-movimiento-y-respiracion',
    updated_at = now()
where id = 'cf705dc3-eb15-4105-b4f6-b732009737a7';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('cf705dc3-eb15-4105-b4f6-b732009737a7', 'es', 'Artículo pilates 11 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 11 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-11-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 12 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 12 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-12-movimiento-y-respiracion',
    updated_at = now()
where id = '2b613e2a-dc83-4ba7-9e63-42194cfdde9b';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('2b613e2a-dc83-4ba7-9e63-42194cfdde9b', 'es', 'Artículo pilates 12 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 12 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-12-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 13 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 13 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-13-movimiento-y-respiracion',
    updated_at = now()
where id = '23f39a78-5a25-43eb-92cf-0079057aca48';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('23f39a78-5a25-43eb-92cf-0079057aca48', 'es', 'Artículo pilates 13 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 13 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-13-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 14 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 14 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-14-movimiento-y-respiracion',
    updated_at = now()
where id = 'ff1aff03-1cba-4c03-981e-39f1310d5935';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('ff1aff03-1cba-4c03-981e-39f1310d5935', 'es', 'Artículo pilates 14 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 14 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-14-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 15 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 15 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-15-movimiento-y-respiracion',
    updated_at = now()
where id = 'dab1119e-09e9-4c99-96e9-ff62616159dd';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('dab1119e-09e9-4c99-96e9-ff62616159dd', 'es', 'Artículo pilates 15 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 15 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-15-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 16 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 16 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-16-movimiento-y-respiracion',
    updated_at = now()
where id = '85b21dfe-6334-464e-88d7-de022d1843a9';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('85b21dfe-6334-464e-88d7-de022d1843a9', 'es', 'Artículo pilates 16 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 16 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-16-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 17 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 17 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-17-movimiento-y-respiracion',
    updated_at = now()
where id = '80f84234-f14a-465f-8250-341ec914478d';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('80f84234-f14a-465f-8250-341ec914478d', 'es', 'Artículo pilates 17 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 17 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-17-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 18 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 18 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-18-movimiento-y-respiracion',
    updated_at = now()
where id = 'b6bb1868-fce0-476f-bb79-89a0896b7e0c';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('b6bb1868-fce0-476f-bb79-89a0896b7e0c', 'es', 'Artículo pilates 18 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 18 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-18-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 19 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 19 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-19-movimiento-y-respiracion',
    updated_at = now()
where id = '8b8b995b-c7a4-460b-88d9-bc43b08a0abb';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('8b8b995b-c7a4-460b-88d9-bc43b08a0abb', 'es', 'Artículo pilates 19 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 19 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-19-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 20 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 20 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-20-movimiento-y-respiracion',
    updated_at = now()
where id = '97d4bc38-b650-4910-b9ab-ce5cbbabf535';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('97d4bc38-b650-4910-b9ab-ce5cbbabf535', 'es', 'Artículo pilates 20 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 20 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-20-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 21 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 21 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-21-movimiento-y-respiracion',
    updated_at = now()
where id = 'da2721fc-dd1d-45d4-aac1-6b2c644550d7';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('da2721fc-dd1d-45d4-aac1-6b2c644550d7', 'es', 'Artículo pilates 21 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 21 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-21-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 22 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 22 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-22-movimiento-y-respiracion',
    updated_at = now()
where id = 'cbf1d485-a2a2-4ad2-adf0-01099e62d396';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('cbf1d485-a2a2-4ad2-adf0-01099e62d396', 'es', 'Artículo pilates 22 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 22 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-22-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 23 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 23 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-23-movimiento-y-respiracion',
    updated_at = now()
where id = 'ee37069d-72f8-459e-b10c-010887c53b3b';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('ee37069d-72f8-459e-b10c-010887c53b3b', 'es', 'Artículo pilates 23 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 23 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-23-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 24 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 24 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-24-movimiento-y-respiracion',
    updated_at = now()
where id = '486900e7-d30e-4531-b6ee-11e3174610eb';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('486900e7-d30e-4531-b6ee-11e3174610eb', 'es', 'Artículo pilates 24 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 24 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-24-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 25 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 25 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-25-movimiento-y-respiracion',
    updated_at = now()
where id = '5196527f-9c79-4339-8b0b-24883c480dca';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('5196527f-9c79-4339-8b0b-24883c480dca', 'es', 'Artículo pilates 25 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 25 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-25-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 26 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 26 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-26-movimiento-y-respiracion',
    updated_at = now()
where id = 'a372662e-5a4c-424c-8790-9351daa32615';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('a372662e-5a4c-424c-8790-9351daa32615', 'es', 'Artículo pilates 26 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 26 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-26-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 27 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 27 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-27-movimiento-y-respiracion',
    updated_at = now()
where id = '31cfc4d4-1585-48da-905e-cb32fd4f1b42';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('31cfc4d4-1585-48da-905e-cb32fd4f1b42', 'es', 'Artículo pilates 27 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 27 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-27-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 28 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 28 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-28-movimiento-y-respiracion',
    updated_at = now()
where id = 'dcd01e98-a788-4aa8-bd13-2fe4b8996d52';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('dcd01e98-a788-4aa8-bd13-2fe4b8996d52', 'es', 'Artículo pilates 28 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 28 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-28-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 29 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 29 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-29-movimiento-y-respiracion',
    updated_at = now()
where id = '94b9f7a3-67d4-4382-b685-50f074acaa9e';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('94b9f7a3-67d4-4382-b685-50f074acaa9e', 'es', 'Artículo pilates 29 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 29 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-29-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 30 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 30 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-30-movimiento-y-respiracion',
    updated_at = now()
where id = 'ac310814-5faa-4c41-9b73-40747501f925';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('ac310814-5faa-4c41-9b73-40747501f925', 'es', 'Artículo pilates 30 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 30 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-30-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 31 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 31 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-31-movimiento-y-respiracion',
    updated_at = now()
where id = 'ba4e14c1-a01d-498f-9f6c-9f1a9a816f27';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('ba4e14c1-a01d-498f-9f6c-9f1a9a816f27', 'es', 'Artículo pilates 31 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 31 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-31-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 32 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 32 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-32-movimiento-y-respiracion',
    updated_at = now()
where id = 'c34fb91b-f962-4da6-a413-98621a980648';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('c34fb91b-f962-4da6-a413-98621a980648', 'es', 'Artículo pilates 32 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 32 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-32-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 33 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 33 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-33-movimiento-y-respiracion',
    updated_at = now()
where id = '1eacac4c-7bf2-43c8-9890-c45f9820e091';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('1eacac4c-7bf2-43c8-9890-c45f9820e091', 'es', 'Artículo pilates 33 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 33 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-33-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 34 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 34 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-34-movimiento-y-respiracion',
    updated_at = now()
where id = '596e71d9-7198-4c83-b0e7-4752342de00c';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('596e71d9-7198-4c83-b0e7-4752342de00c', 'es', 'Artículo pilates 34 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 34 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-34-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 35 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 35 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-35-movimiento-y-respiracion',
    updated_at = now()
where id = '5dca6b8c-923f-44fa-b585-6c0752f13bf9';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('5dca6b8c-923f-44fa-b585-6c0752f13bf9', 'es', 'Artículo pilates 35 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 35 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-35-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 36 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 36 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-36-movimiento-y-respiracion',
    updated_at = now()
where id = 'a67faff5-d8f3-47a6-adf5-3c4cae1f177f';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('a67faff5-d8f3-47a6-adf5-3c4cae1f177f', 'es', 'Artículo pilates 36 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 36 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-36-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 37 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 37 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-37-movimiento-y-respiracion',
    updated_at = now()
where id = '7812fc7c-0563-4d5f-8772-fcdbfc75dfa7';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('7812fc7c-0563-4d5f-8772-fcdbfc75dfa7', 'es', 'Artículo pilates 37 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 37 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-37-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 38 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 38 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-38-movimiento-y-respiracion',
    updated_at = now()
where id = '35ecddde-f121-4760-a03e-84227cacd8a2';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('35ecddde-f121-4760-a03e-84227cacd8a2', 'es', 'Artículo pilates 38 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 38 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-38-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 39 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 39 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-39-movimiento-y-respiracion',
    updated_at = now()
where id = '0f25e98a-859d-4935-8183-43c8e8317341';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('0f25e98a-859d-4935-8183-43c8e8317341', 'es', 'Artículo pilates 39 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 39 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-39-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 40 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 40 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-40-movimiento-y-respiracion',
    updated_at = now()
where id = '5ca4b10f-3e93-41e4-8686-352cdebd2ee4';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('5ca4b10f-3e93-41e4-8686-352cdebd2ee4', 'es', 'Artículo pilates 40 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 40 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-40-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 41 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 41 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-41-movimiento-y-respiracion',
    updated_at = now()
where id = 'abb7edae-5399-4ab8-acb8-eb09fe024c1c';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('abb7edae-5399-4ab8-acb8-eb09fe024c1c', 'es', 'Artículo pilates 41 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 41 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-41-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 42 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 42 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-42-movimiento-y-respiracion',
    updated_at = now()
where id = 'fd88f55c-f8db-4f19-8c4f-3dce2886bd67';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('fd88f55c-f8db-4f19-8c4f-3dce2886bd67', 'es', 'Artículo pilates 42 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 42 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-42-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 43 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 43 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-43-movimiento-y-respiracion',
    updated_at = now()
where id = '8bc92c70-aae1-4172-a4d6-7e95a2b2d4cf';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('8bc92c70-aae1-4172-a4d6-7e95a2b2d4cf', 'es', 'Artículo pilates 43 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 43 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-43-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 44 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 44 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-44-movimiento-y-respiracion',
    updated_at = now()
where id = 'd803167d-56e9-45fc-958f-d4113a6932da';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('d803167d-56e9-45fc-958f-d4113a6932da', 'es', 'Artículo pilates 44 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 44 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-44-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 45 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 45 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-45-movimiento-y-respiracion',
    updated_at = now()
where id = '5c3f4aa9-5087-413c-97a4-a3821328f6bb';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('5c3f4aa9-5087-413c-97a4-a3821328f6bb', 'es', 'Artículo pilates 45 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 45 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-45-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 46 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 46 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-46-movimiento-y-respiracion',
    updated_at = now()
where id = 'fc1a13e6-6db3-4015-af24-2383b4433107';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('fc1a13e6-6db3-4015-af24-2383b4433107', 'es', 'Artículo pilates 46 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 46 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-46-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 47 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 47 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-47-movimiento-y-respiracion',
    updated_at = now()
where id = 'ab2a7edc-7dc8-417a-8250-e426dcc8f2a0';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('ab2a7edc-7dc8-417a-8250-e426dcc8f2a0', 'es', 'Artículo pilates 47 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 47 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-47-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 48 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 48 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-48-movimiento-y-respiracion',
    updated_at = now()
where id = '91d2b737-ae2e-4ff7-a497-8c50c3c672f4';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('91d2b737-ae2e-4ff7-a497-8c50c3c672f4', 'es', 'Artículo pilates 48 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 48 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-48-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 49 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 49 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-49-movimiento-y-respiracion',
    updated_at = now()
where id = '32551032-ba99-45ea-98ef-36f166cfa320';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('32551032-ba99-45ea-98ef-36f166cfa320', 'es', 'Artículo pilates 49 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 49 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-49-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 50 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 50 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-50-movimiento-y-respiracion',
    updated_at = now()
where id = '09500aee-ee83-4aff-a497-0331ccbf6826';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('09500aee-ee83-4aff-a497-0331ccbf6826', 'es', 'Artículo pilates 50 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 50 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-50-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 51 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 51 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-51-movimiento-y-respiracion',
    updated_at = now()
where id = 'ca910141-c2ef-4a47-9d72-188fc5dcfdbd';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('ca910141-c2ef-4a47-9d72-188fc5dcfdbd', 'es', 'Artículo pilates 51 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 51 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-51-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 52 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 52 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-52-movimiento-y-respiracion',
    updated_at = now()
where id = '77d4ea14-e5b9-44e8-bd0c-68a707c79309';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('77d4ea14-e5b9-44e8-bd0c-68a707c79309', 'es', 'Artículo pilates 52 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 52 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-52-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 53 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 53 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-53-movimiento-y-respiracion',
    updated_at = now()
where id = '258b1686-a96b-426b-8dc8-f47511542a88';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('258b1686-a96b-426b-8dc8-f47511542a88', 'es', 'Artículo pilates 53 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 53 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-53-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 54 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 54 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-54-movimiento-y-respiracion',
    updated_at = now()
where id = '210f2a00-b55f-4342-86b0-31b6e93f3d79';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('210f2a00-b55f-4342-86b0-31b6e93f3d79', 'es', 'Artículo pilates 54 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 54 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-54-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 55 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 55 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-55-movimiento-y-respiracion',
    updated_at = now()
where id = 'f686173d-e821-4c52-8ac5-d0f5d6b7050e';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('f686173d-e821-4c52-8ac5-d0f5d6b7050e', 'es', 'Artículo pilates 55 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 55 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-55-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 56 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 56 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-56-movimiento-y-respiracion',
    updated_at = now()
where id = '280a8a8c-1f46-4c0f-90eb-1f9e5db42c9d';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('280a8a8c-1f46-4c0f-90eb-1f9e5db42c9d', 'es', 'Artículo pilates 56 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 56 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-56-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 57 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 57 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-57-movimiento-y-respiracion',
    updated_at = now()
where id = '1d5711ed-e13a-46ca-be40-381be8a004ff';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('1d5711ed-e13a-46ca-be40-381be8a004ff', 'es', 'Artículo pilates 57 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 57 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-57-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 58 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 58 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-58-movimiento-y-respiracion',
    updated_at = now()
where id = '73a9b14d-6fad-4179-92f9-e51e5c2d14f9';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('73a9b14d-6fad-4179-92f9-e51e5c2d14f9', 'es', 'Artículo pilates 58 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 58 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-58-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 59 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 59 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-59-movimiento-y-respiracion',
    updated_at = now()
where id = 'a4f4e0f5-f795-4e44-9050-9e9c0c58d287';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('a4f4e0f5-f795-4e44-9050-9e9c0c58d287', 'es', 'Artículo pilates 59 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 59 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-59-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 60 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 60 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-60-movimiento-y-respiracion',
    updated_at = now()
where id = 'a316b077-1953-4814-98cf-6ac6527a4b38';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('a316b077-1953-4814-98cf-6ac6527a4b38', 'es', 'Artículo pilates 60 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 60 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-60-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 61 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 61 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-61-movimiento-y-respiracion',
    updated_at = now()
where id = '30c32292-7adc-4a98-a3e8-fc5ace5b7e7f';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('30c32292-7adc-4a98-a3e8-fc5ace5b7e7f', 'es', 'Artículo pilates 61 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 61 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-61-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 62 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 62 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-62-movimiento-y-respiracion',
    updated_at = now()
where id = 'a5635e49-3565-41ec-b4e2-6a50629ffbcb';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('a5635e49-3565-41ec-b4e2-6a50629ffbcb', 'es', 'Artículo pilates 62 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 62 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-62-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 63 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 63 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-63-movimiento-y-respiracion',
    updated_at = now()
where id = '8caff32b-fcfd-406b-b23a-fa2c942cb8c8';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('8caff32b-fcfd-406b-b23a-fa2c942cb8c8', 'es', 'Artículo pilates 63 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 63 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-63-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 64 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 64 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-64-movimiento-y-respiracion',
    updated_at = now()
where id = 'c2470e2b-9b99-4d8c-a2e6-058e084b3004';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('c2470e2b-9b99-4d8c-a2e6-058e084b3004', 'es', 'Artículo pilates 64 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 64 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-64-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 65 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 65 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-65-movimiento-y-respiracion',
    updated_at = now()
where id = 'f6482bc7-4d32-4dd4-8e09-2e70bdca47e2';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('f6482bc7-4d32-4dd4-8e09-2e70bdca47e2', 'es', 'Artículo pilates 65 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 65 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-65-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 66 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 66 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-66-movimiento-y-respiracion',
    updated_at = now()
where id = '9ffcce36-8ea1-4546-bb3f-7b275233884d';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('9ffcce36-8ea1-4546-bb3f-7b275233884d', 'es', 'Artículo pilates 66 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 66 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-66-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 67 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 67 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-67-movimiento-y-respiracion',
    updated_at = now()
where id = '76edcd0e-e66a-42e2-a134-e783b7734304';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('76edcd0e-e66a-42e2-a134-e783b7734304', 'es', 'Artículo pilates 67 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 67 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-67-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 68 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 68 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-68-movimiento-y-respiracion',
    updated_at = now()
where id = '9818f160-1a1a-4765-9636-1572ca729545';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('9818f160-1a1a-4765-9636-1572ca729545', 'es', 'Artículo pilates 68 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 68 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-68-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 69 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 69 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-69-movimiento-y-respiracion',
    updated_at = now()
where id = '7f2fdb26-89dc-4707-9411-2f5550530959';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('7f2fdb26-89dc-4707-9411-2f5550530959', 'es', 'Artículo pilates 69 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 69 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-69-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 70 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 70 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-70-movimiento-y-respiracion',
    updated_at = now()
where id = '397e273b-5a57-4a6a-a887-a41224c52766';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('397e273b-5a57-4a6a-a887-a41224c52766', 'es', 'Artículo pilates 70 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 70 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-70-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 71 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 71 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-71-movimiento-y-respiracion',
    updated_at = now()
where id = '76022f73-b20a-4798-a10b-b9f1e64763f2';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('76022f73-b20a-4798-a10b-b9f1e64763f2', 'es', 'Artículo pilates 71 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 71 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-71-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 72 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 72 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-72-movimiento-y-respiracion',
    updated_at = now()
where id = 'c17372c6-877b-4ac5-ab2d-d24e9cf451ff';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('c17372c6-877b-4ac5-ab2d-d24e9cf451ff', 'es', 'Artículo pilates 72 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 72 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-72-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 73 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 73 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-73-movimiento-y-respiracion',
    updated_at = now()
where id = '8beb74e7-c946-4c14-8f1a-5cfcf9bb19de';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('8beb74e7-c946-4c14-8f1a-5cfcf9bb19de', 'es', 'Artículo pilates 73 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 73 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-73-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 74 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 74 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-74-movimiento-y-respiracion',
    updated_at = now()
where id = '33866315-1084-4f40-b2d6-b44f78737d5a';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('33866315-1084-4f40-b2d6-b44f78737d5a', 'es', 'Artículo pilates 74 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 74 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-74-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 75 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 75 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-75-movimiento-y-respiracion',
    updated_at = now()
where id = '0d959c79-6e93-4547-97ba-fc0084a41654';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('0d959c79-6e93-4547-97ba-fc0084a41654', 'es', 'Artículo pilates 75 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 75 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-75-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 76 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 76 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-76-movimiento-y-respiracion',
    updated_at = now()
where id = 'e099f0f8-854f-4e16-ac8c-d0f49b218c1a';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('e099f0f8-854f-4e16-ac8c-d0f49b218c1a', 'es', 'Artículo pilates 76 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 76 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-76-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 77 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 77 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-77-movimiento-y-respiracion',
    updated_at = now()
where id = '95221502-c4ac-4a50-8ef9-725c5ab4b666';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('95221502-c4ac-4a50-8ef9-725c5ab4b666', 'es', 'Artículo pilates 77 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 77 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-77-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 78 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 78 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-78-movimiento-y-respiracion',
    updated_at = now()
where id = '9fa71fe3-154f-41d5-ac03-45a18bb255b3';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('9fa71fe3-154f-41d5-ac03-45a18bb255b3', 'es', 'Artículo pilates 78 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 78 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-78-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 79 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 79 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-79-movimiento-y-respiracion',
    updated_at = now()
where id = 'a60c4b21-9b46-4539-befb-ef8095a70ca1';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('a60c4b21-9b46-4539-befb-ef8095a70ca1', 'es', 'Artículo pilates 79 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 79 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-79-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 80 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 80 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-80-movimiento-y-respiracion',
    updated_at = now()
where id = '4599677d-c08b-4c92-8551-4638879f783d';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('4599677d-c08b-4c92-8551-4638879f783d', 'es', 'Artículo pilates 80 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 80 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-80-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 81 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 81 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-81-movimiento-y-respiracion',
    updated_at = now()
where id = '3316674b-f995-4c58-8540-9c7312a93313';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('3316674b-f995-4c58-8540-9c7312a93313', 'es', 'Artículo pilates 81 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 81 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-81-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 82 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 82 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-82-movimiento-y-respiracion',
    updated_at = now()
where id = '9d29182f-38c4-4b11-9a49-d5f7face5f84';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('9d29182f-38c4-4b11-9a49-d5f7face5f84', 'es', 'Artículo pilates 82 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 82 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-82-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 83 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 83 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-83-movimiento-y-respiracion',
    updated_at = now()
where id = 'f5437695-da27-4d8e-afb5-27843e1d437f';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('f5437695-da27-4d8e-afb5-27843e1d437f', 'es', 'Artículo pilates 83 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 83 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-83-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 84 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 84 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-84-movimiento-y-respiracion',
    updated_at = now()
where id = 'a9fc3599-2d4c-444d-b493-fee7b24a8fda';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('a9fc3599-2d4c-444d-b493-fee7b24a8fda', 'es', 'Artículo pilates 84 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 84 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-84-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 85 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 85 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-85-movimiento-y-respiracion',
    updated_at = now()
where id = 'eae86ff9-8f04-4725-ba04-1cc6ddbf5e91';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('eae86ff9-8f04-4725-ba04-1cc6ddbf5e91', 'es', 'Artículo pilates 85 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 85 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-85-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 86 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 86 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-86-movimiento-y-respiracion',
    updated_at = now()
where id = '0623950a-22a3-47b1-ac54-9d87e67c532a';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('0623950a-22a3-47b1-ac54-9d87e67c532a', 'es', 'Artículo pilates 86 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 86 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-86-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 87 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 87 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-87-movimiento-y-respiracion',
    updated_at = now()
where id = 'e802fe2a-5c25-4e86-a2ab-67f810575e2b';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('e802fe2a-5c25-4e86-a2ab-67f810575e2b', 'es', 'Artículo pilates 87 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 87 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-87-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 88 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 88 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-88-movimiento-y-respiracion',
    updated_at = now()
where id = '81509ab1-3860-41b2-8105-1210d1801d86';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('81509ab1-3860-41b2-8105-1210d1801d86', 'es', 'Artículo pilates 88 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 88 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-88-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 89 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 89 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-89-movimiento-y-respiracion',
    updated_at = now()
where id = 'a4d8c89c-9350-45eb-ac90-83cfe56e13de';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('a4d8c89c-9350-45eb-ac90-83cfe56e13de', 'es', 'Artículo pilates 89 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 89 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-89-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 90 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 90 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-90-movimiento-y-respiracion',
    updated_at = now()
where id = 'a9d95bf2-2a9b-4dee-bd6b-3b6700b1e52d';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('a9d95bf2-2a9b-4dee-bd6b-3b6700b1e52d', 'es', 'Artículo pilates 90 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 90 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-90-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 91 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 91 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-91-movimiento-y-respiracion',
    updated_at = now()
where id = '2ca37930-1394-4ee9-9cfa-7b293f6797b5';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('2ca37930-1394-4ee9-9cfa-7b293f6797b5', 'es', 'Artículo pilates 91 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 91 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-91-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 92 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 92 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-92-movimiento-y-respiracion',
    updated_at = now()
where id = 'fb276639-ba40-4693-83f9-a97a46cac234';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('fb276639-ba40-4693-83f9-a97a46cac234', 'es', 'Artículo pilates 92 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 92 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-92-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 93 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 93 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-93-movimiento-y-respiracion',
    updated_at = now()
where id = 'a4fd7e63-32ba-43e2-a7fe-01c7423225e7';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('a4fd7e63-32ba-43e2-a7fe-01c7423225e7', 'es', 'Artículo pilates 93 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 93 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-93-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 94 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 94 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-94-movimiento-y-respiracion',
    updated_at = now()
where id = '08bd58d4-1619-44ad-a223-147c7f488f9d';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('08bd58d4-1619-44ad-a223-147c7f488f9d', 'es', 'Artículo pilates 94 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 94 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-94-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 95 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 95 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-95-movimiento-y-respiracion',
    updated_at = now()
where id = 'e6569653-37fd-4cca-a0cc-cd54f0c36b9f';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('e6569653-37fd-4cca-a0cc-cd54f0c36b9f', 'es', 'Artículo pilates 95 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 95 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-95-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 96 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 96 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-96-movimiento-y-respiracion',
    updated_at = now()
where id = '0ae716c4-7e57-4929-8838-2694e42c01ae';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('0ae716c4-7e57-4929-8838-2694e42c01ae', 'es', 'Artículo pilates 96 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 96 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-96-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 97 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 97 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-97-movimiento-y-respiracion',
    updated_at = now()
where id = '8f22efb8-f4e9-42af-97aa-cab84945efcb';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('8f22efb8-f4e9-42af-97aa-cab84945efcb', 'es', 'Artículo pilates 97 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 97 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-97-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 98 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 98 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-98-movimiento-y-respiracion',
    updated_at = now()
where id = 'a629eab1-cf02-4ba0-a4e6-02565cbd4d84';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('a629eab1-cf02-4ba0-a4e6-02565cbd4d84', 'es', 'Artículo pilates 98 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 98 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-98-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

update public.blog_articles
set title_es = 'Artículo pilates 99 — movimiento y respiración',
    description_es = 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.',
    content_es = '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 99 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>',
    meta_description_es = 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.',
    slug_es = 'articulo-pilates-99-movimiento-y-respiracion',
    updated_at = now()
where id = 'fda4b813-3851-4e2a-a7a8-cd98810f86d1';

insert into public.blog_article_translations (article_id, language, title, description, content, meta_description, slug, auto_translated, updated_at)
values ('fda4b813-3851-4e2a-a7a8-cd98810f86d1', 'es', 'Artículo pilates 99 — movimiento y respiración', 'Una guía práctica para avanzar en Pilates conectando movimiento, respiración, postura y regularidad.', '<h2>Por qué este tema transforma tu práctica</h2><p>Artículo pilates 99 — movimiento y respiración aparece a menudo en los bloqueos de las alumnas: falta de regularidad, exceso de tensión mental o dificultad para sentir buenos apoyos. En Pilates, el progreso no nace de una sesión perfecta, sino de una repetición inteligente, suave y consciente. El objetivo es construir un ritual realista, compatible con tu agenda, sin perder el placer de moverte.</p>

<h2>El contexto concreto</h2><p>Muchas practicantes creen que necesitan entrenar durante más tiempo para obtener resultados. En realidad, las sesiones cortas pero frecuentes suelen tener mejores efectos sobre la postura, la movilidad y la energía general. El cuerpo integra mejor referencias simples: respiración, alineación, activación del centro y calidad de las transiciones.</p>

<h3>3 acciones sencillas para aplicar esta semana</h3><ul><li><strong>Reserva un horario fijo</strong> de 20 a 30 minutos, dos o tres veces por semana.</li><li><strong>Elige un único objetivo</strong> por sesión: movilidad, fortalecimiento o recuperación.</li><li><strong>Termina con 2 minutos de respiración</strong> para integrar el trabajo y bajar el nivel de estrés.</li></ul>

<h2>Ejemplo real</h2><p>Una alumna que retomaba después de varios meses de pausa empezó con dos sesiones de 25 minutos centradas en el centro profundo y las caderas. En tres semanas notó menos tensión lumbar y más estabilidad en sus ejercicios. La clave no fue la dificultad, sino la regularidad y la precisión del movimiento.</p>

<h2>Qué puedes recordar</h2><p>En el tema del movimiento y la respiración, lo importante es avanzar paso a paso: una estructura clara, objetivos medibles y una práctica constante. Guarda una pequeña nota de tus sesiones y observa cómo te sientes. Esa constancia es la que transforma el cuerpo, la postura y la confianza en el día a día.</p><p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera volver a moverse con suavidad.</p>', 'Conecta movimiento y respiración en Pilates con consejos concretos para mejorar postura, fuerza, fluidez y bienestar.', 'articulo-pilates-99-movimiento-y-respiracion', false, now())
on conflict (article_id, language) do update
set title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    meta_description = excluded.meta_description,
    slug = excluded.slug,
    auto_translated = false,
    updated_at = now();

