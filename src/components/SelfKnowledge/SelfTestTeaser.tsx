'use client';

import { SelfTestReport } from '@/components/SelfKnowledge/SelfTestReport';
import type {
  SelfTestAnalysis,
  SelfTestDefinition,
  SelfTestLang,
  SelfTestScores,
} from '@/lib/self-knowledge/types';

type Props = {
  locale: SelfTestLang;
  test: SelfTestDefinition;
  scores: SelfTestScores;
  analysis: SelfTestAnalysis;
  trialHref: string;
  hubHref: string;
  /** Membre connectée : affiche l’analyse complète */
  showFull?: boolean;
};

/** Wrapper conservé pour les imports existants — délègue au rapport riche. */
export function SelfTestTeaser(props: Props) {
  return (
    <SelfTestReport
      locale={props.locale}
      test={props.test}
      scores={props.scores}
      analysis={props.analysis}
      trialHref={props.trialHref}
      hubHref={props.hubHref}
      showFull={props.showFull ?? false}
    />
  );
}
