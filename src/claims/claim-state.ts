import { ClaimStatus } from '@prisma/client';

export const Allowed: Record<ClaimStatus, ClaimStatus[]> = {
  DISQUALIFIED: [],
  INPROGRESS: [
    'REPAIR_COST_PENDING',
    'DV_CLAIM_CREATED',
    'SUBMITTED_TO_INSURER',
  ],
  REPAIR_COST_PENDING: ['DV_CLAIM_CREATED', 'INPROGRESS'],
  DV_CLAIM_CREATED: ['SUBMITTED_TO_INSURER', 'INPROGRESS'],
  SUBMITTED_TO_INSURER: ['NEGOTIATION', 'FINAL_OFFER_MADE'],
  NEGOTIATION: ['FINAL_OFFER_MADE', 'SUBMITTED_TO_INSURER'],
  FINAL_OFFER_MADE: ['CLAIM_SETTLED', 'NEGOTIATION'],
  CLAIM_SETTLED: ['CLAIM_PAID', 'CLOSED'],
  CLAIM_PAID: ['CLOSED'],
  CLOSED: [],
};

export function ensureTransition(oldS: ClaimStatus, newS: ClaimStatus) {
  if (!Allowed[oldS]?.includes(newS)) {
    throw new Error(`Illegal transition: ${oldS} ➜ ${newS}`);
  }
}
