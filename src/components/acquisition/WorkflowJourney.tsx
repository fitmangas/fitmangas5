'use client';

import type { AcqWorkflow } from '@/lib/acquisition/types';

import { ColumnConnector, JourneyConnectorsOverlay } from './JourneyConnectors';
import { JourneyBoard, JourneyColumn, TaskCard } from './JourneyParts';
import { acq } from './tokens';

type Props = {
  workflows: AcqWorkflow[];
  selectedConversationId: string | null;
  pending: boolean;
  onRunDemo: (workflowId: string) => void;
};

const COLUMN_TITLES = ['Déclencheur', 'Qualification', 'Action', 'Relance'];
const CONNECTOR_CURVES: Array<'flat' | 'dip' | 'rise'> = ['flat', 'rise', 'dip', 'flat'];

export function WorkflowJourney({ workflows, selectedConversationId, pending, onRunDemo }: Props) {
  const columns = COLUMN_TITLES.map((title, colIdx) => {
    const cards: Array<{ wf: AcqWorkflow; actionIdx: number; active: boolean }> = [];
    workflows.forEach((wf) => {
      if (colIdx === 0) {
        cards.push({ wf, actionIdx: -1, active: false });
      } else {
        const actionIdx = colIdx - 1;
        if (wf.actions[actionIdx]) {
          cards.push({
            wf,
            actionIdx,
            active: colIdx === 2 && actionIdx === 0 && wf.enabled,
          });
        }
      }
    });
    return { title, cards };
  });

  return (
    <JourneyBoard
      title="Moteur de workflows"
      subtitle="Déclencheur → conditions → actions"
      connectors={<JourneyConnectorsOverlay columnCount={columns.length} className="top-14 h-[58%]" />}
    >
      <div className="relative z-[2] flex min-w-[920px] items-stretch overflow-x-auto pb-2 pt-2">
        {columns.map((col, ci) => (
          <div key={col.title} className="flex flex-1 items-stretch">
            {ci > 0 ? (
              <ColumnConnector
                variant={ci <= 2 ? 'conversion' : 'muted'}
                curve={CONNECTOR_CURVES[ci] ?? 'flat'}
              />
            ) : null}
            <JourneyColumn title={col.title} className={ci > 0 ? '-ml-0.5' : ''}>
              {col.cards.map(({ wf, actionIdx, active }, ti) => {
                if (actionIdx === -1) {
                  return (
                    <TaskCard
                      key={`${wf.id}-trigger`}
                      title={wf.name.slice(0, 42)}
                      subtitle={wf.triggerType.replace(/_/g, ' ')}
                      icons={['calendar']}
                      className={ti > 0 ? '-mt-2' : ''}
                    />
                  );
                }
                const action = wf.actions[actionIdx]!;
                return (
                  <div key={`${wf.id}-${actionIdx}`} className={ti > 0 ? '-mt-2' : ''}>
                    <TaskCard
                      title={action.type.replace(/_/g, ' ')}
                      subtitle={wf.enabled ? 'Actif' : 'Off'}
                      active={active}
                      icons={active ? ['check', 'calendar'] : ['check']}
                      className={active ? '-translate-y-0.5' : ''}
                    />
                    {ci === columns.length - 1 && selectedConversationId ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onRunDemo(wf.id)}
                        className="mt-2 w-full rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white"
                        style={{ backgroundColor: acq.terracotta }}
                      >
                        Tester
                      </button>
                    ) : null}
                  </div>
                );
              })}
              {!col.cards.length ? (
                <TaskCard title="Aucune action" subtitle="Vide" compact className="opacity-60" />
              ) : null}
            </JourneyColumn>
          </div>
        ))}
      </div>
      {!selectedConversationId ? (
        <p className="relative z-[2] mt-4 px-1 text-xs" style={{ color: acq.mutedLight }}>
          Sélectionne un fil (onglet Conversations) pour tester un workflow.
        </p>
      ) : null}
    </JourneyBoard>
  );
}
