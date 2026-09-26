'use client';

import { useState, useTransition } from 'react';
import { Lightbulb, RefreshCw } from 'lucide-react';

import { acq } from '@/components/acquisition/tokens';
import type { ActionResult } from '@/app/admin/croissance/ads-actions';
import type { ActionPlanItem } from '@/lib/acquisition/ads/action-plan';
import type { CoachAdvice } from '@/lib/ac acquisition/ads/coach';
