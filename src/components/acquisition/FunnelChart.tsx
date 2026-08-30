'use client';

import type { AcqConversation, FunnelStep } from '@/lib/acquisition/types';

import { AvatarStack, type AvatarPerson } from './AvatarStack';
import { contactDisplayName, contactsWithRealHandles } from './avatar-guards';
import { ColumnConnector, JourneyConnectorsOverlay } from './JourneyConnectors';
import { JourneyBoard, JourneyColumn, TaskCard } from './JourneyParts';

type Props = {
  steps: FunnelStep[];
  activeStepId?: string;
  conversations?: AcqConversation[];
};

const STAGE_BY_STEP: Record<string, string[]> = {
  reach: ['new'],
  clicks: ['qualified'],
  trial: ['trial'],
  paid: ['paid'],
  retention: ['member'],
};

const COLUMN_LABELS: Record<string, string> = {
  reach: 'Portée',
  clicks: 'Intérêt',
  trial: 'Essais 7j',
  paid: 'Payant',
  retention: 'Rétention',
};

const CONNECTOR_CURVES: Array<'flat' | 'dip' | 'rise'> = ['flat', 'dip', 'rise', 'dip', 'flat'];

function peopleForStep(stepId: string, conversations: AcqConversation[]): AvatarPerson[] {
  const stages = STAGE_BY_STEP[stepId] ?? [];
  return contactsWithRealHandles(conversations)
    .filter((c) => stages.includes(c.lifecycleStage))
    .slice(0, 6)
    .map((c) => ({
      id: c.id,
      name: contactDisplayName(c)!,
      imageUrl: null,
    }));
}

function formatHint(step: FunnelStep, index: number): string | undefined {
  if (step.rateFromPrevious == null || index === 0) return undefined;
  if (step.id === 'retention') return `${step.rateFromPrevious} % retenues`;
  return `${step.rateFromPrevious} % vs étape précédente`;
}

export function FunnelChart({ steps, activeStepId = 'trial', conversations = [] }: Props) {
  const realContacts = contactsWithRealHandles(conversations);
  const headerPeople: AvatarPerson[] = realContacts.slice(0, 9).map((c) => ({
    id: c.id,
    name: contactDisplayName(c)!,
    imageUrl: null,
  }));

  return (
    <JourneyBoard
      title="Parcours de conversion"
      subtitle="Portée → Clics → Essais 7j → Payant → Rétention"
      action={undefined}
      headerExtra={headerPeople.length ? <AvatarStack people={headerPeople} max={9} size="md" /> : null}
      connectors={<JourneyConnectorsOverlay columnCount={steps.length} className="top-12 h-[62%]" />}
    >
      <div className="relative z-[2] flex min-w-[920px] items-stretch overflow-x-auto pb-1 pt-2">
        {steps.map((step, i) => {
          const active = step.id === activeStepId;
          const people = peopleForStep(step.id, conversations);
          const hint = formatHint(step, i);

          return (
            <div key={step.id} className="flex flex-1 items-stretch">
              {i > 0 ? (
                <ColumnConnector
                  variant={i <= 2 ? 'conversion' : 'muted'}
                  curve={CONNECTOR_CURVES[i] ?? 'flat'}
                />
              ) : null}
              <JourneyColumn title={COLUMN_LABELS[step.id] ?? step.label} className={i > 0 ? '-ml-0.5' : ''}>
                <TaskCard
                  title={step.label}
                  subtitle={step.value.toLocaleString('fr-FR')}
                  active={active}
                  icons={active ? ['check', 'calendar'] : i === 0 ? ['calendar'] : ['check']}
                  className={active ? 'z-20 -translate-y-0.5' : i > 0 ? '-mt-2' : ''}
                />
                {hint ? (
                  <TaskCard
                    title="Taux de passage"
                    subtitle={hint}
                    compact
                    icons={['check']}
                    className="-mt-2 opacity-95"
                  />
                ) : null}
                {people.length > 0 ? (
                  <div
                    className="-mt-2 rounded-[14px] px-3 py-2.5"
                    style={{ backgroundColor: '#FFFFFF', boxShadow: '0 12px 32px rgba(35,32,29,0.06)' }}
                  >
                    <AvatarStack people={people} max={5} size="sm" />
                    {people.length > 1 ? (
                      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#78716C]">
                        {people.length} contactes
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </JourneyColumn>
            </div>
          );
        })}
      </div>
    </JourneyBoard>
  );
}
