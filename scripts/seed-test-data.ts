import { createClient } from '@supabase/supabase-js';

type Tier = 'online_individual_monthly' | 'online_group_monthly' | 'onsite_group_single' | 'onsite_individual_single';

function mustGetEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${name}`);
  }
  return value;
}

async function main() {
  const supabaseUrl = mustGetEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = mustGetEnv('SUPABASE_SERVICE_ROLE_KEY');
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin+seed@fitmangas.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const usersToCreate: Array<{ email: string; password: string; tier: Tier; firstName: string; lastName: string }> = [
    {
      email: adminEmail,
      password: adminPassword,
      tier: 'online_individual_monthly',
      firstName: 'Admin',
      lastName: 'Owner',
    },
    {
      email: 'type1.individual@fitmangas.local',
      password: 'Password123!',
      tier: 'online_individual_monthly',
      firstName: 'Camille',
      lastName: 'Individuel',
    },
    {
      email: 'type2.group@fitmangas.local',
      password: 'Password123!',
      tier: 'online_group_monthly',
      firstName: 'Sofia',
      lastName: 'Collectif',
    },
    {
      email: 'type3.onsitegroup@fitmangas.local',
      password: 'Password123!',
      tier: 'onsite_group_single',
      firstName: 'Julie',
      lastName: 'PresentielGroup',
    },
    {
      email: 'type4.onsiteindividual@fitmangas.local',
      password: 'Password123!',
      tier: 'onsite_individual_single',
      firstName: 'Nora',
      lastName: 'PresentielInd',
    },
  ];

  const createdUsers: Array<{ id: string; email: string; tier: Tier }> = [];

  for (const user of usersToCreate) {
    const existing = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const maybeUser = existing.data.users.find((item) => item.email?.toLowerCase() === user.email.toLowerCase());
    const authUser =
      maybeUser ??
      (
        await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { first_name: user.firstName, last_name: user.lastName },
        })
      ).data.user;

    if (!authUser) throw new Error(`Impossible de créer l'utilisateur ${user.email}`);

    await supabase
      .from('profiles')
      .upsert({
        id: authUser.id,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.email === adminEmail ? 'admin' : 'member',
        customer_tier: user.tier,
        onboarding_completed: true,
      })
      .throwOnError();

    createdUsers.push({ id: authUser.id, email: user.email, tier: user.tier });
  }

  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), 1, 9, 0, 0);
  const sampleCourses = Array.from({ length: 12 }, (_, index) => {
    const starts = new Date(base.getTime() + index * 2 * 24 * 60 * 60 * 1000);
    starts.setHours(index % 2 === 0 ? 9 : 18, 0, 0, 0);
    const ends = new Date(starts.getTime() + 60 * 60 * 1000);
    const online = index % 3 !== 0;
    const individual = index % 4 === 0;
    return {
      slug: `seed-course-${index + 1}`,
      title: `Cours test ${index + 1} ${online ? 'Online' : 'Présentiel'} ${individual ? 'Individuel' : 'Collectif'}`,
      description: 'Cours généré automatiquement pour tester la matrice de droits.',
      course_format: online ? 'online' : 'onsite',
      course_category: individual ? 'individual' : 'group',
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      timezone: 'Europe/Paris',
      capacity_max: online ? null : 12,
      location: online ? null : 'Studio Nantes',
      live_url: online ? `https://meet.example.com/room-${index + 1}` : null,
      replay_url: online ? `https://vimeo.com/example-${index + 1}` : null,
      is_published: true,
      auto_add_for_monthly: online,
      created_by: createdUsers[0].id,
    };
  });

  const insertedCourses = await supabase
    .from('courses')
    .upsert(sampleCourses, { onConflict: 'slug' })
    .select('id, course_format, course_category')
    .throwOnError();

  const type3User = createdUsers.find((item) => item.tier === 'onsite_group_single');
  const type4User = createdUsers.find((item) => item.tier === 'onsite_individual_single');
  if (!type3User || !type4User) throw new Error('Utilisateurs type 3/4 introuvables.');

  const onsiteGroup = (insertedCourses.data ?? []).find(
    (course) => course.course_format === 'onsite' && course.course_category === 'group',
  );
  const onsiteIndividual = (insertedCourses.data ?? []).find(
    (course) => course.course_format === 'onsite' && course.course_category === 'individual',
  );

  const enrollments = [];
  if (onsiteGroup) {
    enrollments.push({
      user_id: type3User.id,
      course_id: onsiteGroup.id,
      source: 'single_purchase',
      status: 'booked',
      price_cents: 1000,
      currency: 'eur',
    });
    enrollments.push({
      user_id: type4User.id,
      course_id: onsiteGroup.id,
      source: 'single_purchase',
      status: 'booked',
      price_cents: 1000,
      currency: 'eur',
    });
  }
  if (onsiteIndividual) {
    enrollments.push({
      user_id: type4User.id,
      course_id: onsiteIndividual.id,
      source: 'single_purchase',
      status: 'booked',
      price_cents: 5000,
      currency: 'eur',
    });
  }

  if (enrollments.length) {
    await supabase
      .from('enrollments')
      .upsert(enrollments, { onConflict: 'user_id,course_id' })
      .throwOnError();
  }

  const subs = createdUsers
    .filter((item) => item.tier === 'online_group_monthly' || item.tier === 'online_individual_monthly')
    .map((item) => ({
      user_id: item.id,
      tier: item.tier,
      status: 'active',
      starts_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      price_cents: item.tier === 'online_group_monthly' ? 3900 : 26900,
      currency: 'eur',
      interval: 'month',
      auto_renews: true,
      stripe_subscription_id: `seed_sub_${item.id.slice(0, 8)}`,
    }));

  if (subs.length) {
    await supabase.from('subscriptions').upsert(subs, { onConflict: 'stripe_subscription_id' }).throwOnError();
  }

  console.log('Seed terminé.');
  console.log('Utilisateurs:', createdUsers.map((item) => `${item.email} (${item.tier})`).join(', '));
  console.log('Cours créés/mis à jour:', insertedCourses.data?.length ?? 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
