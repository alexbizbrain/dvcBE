import { NotificationPriority } from '@prisma/client';

/**
 * Notification Event Types
 * Based on real-world best practices from successful apps
 */
export enum NotificationEvent {
  // Claim Status Events (Admin-triggered)
  CLAIM_SUBMITTED = 'CLAIM_SUBMITTED',
  CLAIM_DISQUALIFIED = 'CLAIM_DISQUALIFIED',
  CLAIM_DV_CREATED = 'CLAIM_DV_CREATED',
  CLAIM_SUBMITTED_TO_INSURER = 'CLAIM_SUBMITTED_TO_INSURER',
  CLAIM_IN_NEGOTIATION = 'CLAIM_IN_NEGOTIATION',
  CLAIM_FINAL_OFFER = 'CLAIM_FINAL_OFFER',
  CLAIM_SETTLED = 'CLAIM_SETTLED',
  CLAIM_PAID = 'CLAIM_PAID',
  CLAIM_CLOSED = 'CLAIM_CLOSED',
  CLAIM_REPAIR_PENDING = 'CLAIM_REPAIR_PENDING',

  // User Action Events
  USER_CLAIM_CREATED = 'USER_CLAIM_CREATED',
  USER_CLAIM_UPDATED = 'USER_CLAIM_UPDATED',
  USER_DOCUMENT_UPLOADED = 'USER_DOCUMENT_UPLOADED',

  // System Events
  DOCUMENT_REQUESTED = 'DOCUMENT_REQUESTED',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  QUERY_RESPONSE = 'QUERY_RESPONSE',
}

/**
 * Event Configuration
 * Defines how each event should be handled
 */
export interface EventConfig {
  // Show in-app notification immediately (with 1-hour throttle)
  inApp: boolean;

  // Include in daily digest email
  emailDigest: boolean;

  // Include in daily digest SMS
  smsDigest: boolean;

  // Priority level
  priority: NotificationPriority;

  // Human-readable title template
  titleTemplate: string;

  // Body message template
  bodyTemplate: string;

  // Whether this notification requires user action
  requiresAction: boolean;
}

/**
 * Event Configurations
 * Based on real-world best practices:
 * - HIGH priority: Money/critical status changes → In-app + Email + SMS
 * - NORMAL priority: Important updates → In-app + Email
 * - LOW priority: Status tracking → Email only (daily digest)
 */
export const EVENT_CONFIGURATIONS: Record<NotificationEvent, EventConfig> = {
  // ===== HIGH PRIORITY EVENTS =====
  // Critical events that need immediate attention

  [NotificationEvent.CLAIM_FINAL_OFFER]: {
    inApp: true,
    emailDigest: true,
    smsDigest: true,
    priority: NotificationPriority.HIGH,
    titleTemplate: '💰 Final Settlement Offer Ready',
    bodyTemplate:
      'Your final settlement offer is ready for review. Please check your dashboard.',
    requiresAction: true,
  },

  [NotificationEvent.CLAIM_SETTLED]: {
    inApp: true,
    emailDigest: true,
    smsDigest: true,
    priority: NotificationPriority.HIGH,
    titleTemplate: '✅ Claim Settled',
    bodyTemplate:
      'Great news! Your claim has been settled. Payment will be processed soon.',
    requiresAction: false,
  },

  [NotificationEvent.CLAIM_PAID]: {
    inApp: true,
    emailDigest: true,
    smsDigest: true,
    priority: NotificationPriority.HIGH,
    titleTemplate: '💵 Payment Processed',
    bodyTemplate:
      'Your settlement payment has been processed. Please check your account.',
    requiresAction: false,
  },

  [NotificationEvent.CLAIM_DISQUALIFIED]: {
    inApp: true,
    emailDigest: true,
    smsDigest: false, // Bad news - email only
    priority: NotificationPriority.HIGH,
    titleTemplate: '⚠️ Claim Status Update',
    bodyTemplate:
      'Your claim does not meet eligibility requirements. Please contact us for details.',
    requiresAction: true,
  },

  [NotificationEvent.PAYMENT_PROCESSED]: {
    inApp: true,
    emailDigest: true,
    smsDigest: true,
    priority: NotificationPriority.HIGH,
    titleTemplate: '💳 Payment Complete',
    bodyTemplate: 'Your payment has been successfully processed.',
    requiresAction: false,
  },

  // ===== NORMAL PRIORITY EVENTS =====
  // Important updates that users should know about

  [NotificationEvent.CLAIM_SUBMITTED_TO_INSURER]: {
    inApp: true,
    emailDigest: true,
    smsDigest: false,
    priority: NotificationPriority.NORMAL,
    titleTemplate: '📤 Claim Submitted to Insurer',
    bodyTemplate:
      'Your claim has been submitted to the insurance company for review.',
    requiresAction: false,
  },

  [NotificationEvent.CLAIM_IN_NEGOTIATION]: {
    inApp: true,
    emailDigest: true,
    smsDigest: false,
    priority: NotificationPriority.NORMAL,
    titleTemplate: '🔄 Claim Under Negotiation',
    bodyTemplate:
      'We are actively negotiating your claim with the insurance company.',
    requiresAction: false,
  },

  [NotificationEvent.CLAIM_DV_CREATED]: {
    inApp: true,
    emailDigest: true,
    smsDigest: false,
    priority: NotificationPriority.NORMAL,
    titleTemplate: '📋 Diminished Value Claim Created',
    bodyTemplate: 'Your DV claim has been created and is being processed.',
    requiresAction: false,
  },

  [NotificationEvent.DOCUMENT_REQUESTED]: {
    inApp: true,
    emailDigest: true,
    smsDigest: false,
    priority: NotificationPriority.NORMAL,
    titleTemplate: '📄 Documents Required',
    bodyTemplate:
      'Additional documents are needed to process your claim. Please upload them in your dashboard.',
    requiresAction: true,
  },

  [NotificationEvent.QUERY_RESPONSE]: {
    inApp: true,
    emailDigest: true,
    smsDigest: false,
    priority: NotificationPriority.NORMAL,
    titleTemplate: '💬 Response to Your Query',
    bodyTemplate: 'We have responded to your inquiry. Check your messages.',
    requiresAction: false,
  },

  // ===== LOW PRIORITY EVENTS =====
  // Tracking/informational updates - daily digest only

  [NotificationEvent.CLAIM_SUBMITTED]: {
    inApp: false, // Don't show in-app (user just did this)
    emailDigest: true,
    smsDigest: false,
    priority: NotificationPriority.LOW,
    titleTemplate: '✅ Claim Submitted Successfully',
    bodyTemplate:
      'Your claim has been submitted successfully. We will review it shortly.',
    requiresAction: false,
  },

  [NotificationEvent.CLAIM_REPAIR_PENDING]: {
    inApp: false, // Status tracking only
    emailDigest: true,
    smsDigest: false,
    priority: NotificationPriority.LOW,
    titleTemplate: '⏳ Awaiting Repair Information',
    bodyTemplate: 'We are waiting for repair cost information for your claim.',
    requiresAction: false,
  },

  [NotificationEvent.CLAIM_CLOSED]: {
    inApp: false, // Status tracking only
    emailDigest: true,
    smsDigest: false,
    priority: NotificationPriority.LOW,
    titleTemplate: '📁 Claim Closed',
    bodyTemplate:
      'Your claim has been closed. Thank you for using our services.',
    requiresAction: false,
  },

  [NotificationEvent.USER_CLAIM_CREATED]: {
    inApp: false, // User just did this
    emailDigest: true,
    smsDigest: false,
    priority: NotificationPriority.LOW,
    titleTemplate: '📝 Claim Started',
    bodyTemplate:
      'You have started a new claim. Complete all steps to submit it.',
    requiresAction: false,
  },

  [NotificationEvent.USER_CLAIM_UPDATED]: {
    inApp: false, // User just did this
    emailDigest: false, // Too noisy
    smsDigest: false,
    priority: NotificationPriority.LOW,
    titleTemplate: '✏️ Claim Updated',
    bodyTemplate: 'Your claim information has been updated.',
    requiresAction: false,
  },

  [NotificationEvent.USER_DOCUMENT_UPLOADED]: {
    inApp: false, // User just did this
    emailDigest: false, // Too noisy
    smsDigest: false,
    priority: NotificationPriority.LOW,
    titleTemplate: '📎 Document Uploaded',
    bodyTemplate: 'Your document has been uploaded successfully.',
    requiresAction: false,
  },
};

/**
 * Map ClaimStatus to NotificationEvent
 */
export const STATUS_TO_EVENT_MAP: Record<string, NotificationEvent> = {
  INPROGRESS: NotificationEvent.CLAIM_SUBMITTED,
  DISQUALIFIED: NotificationEvent.CLAIM_DISQUALIFIED,
  REPAIR_COST_PENDING: NotificationEvent.CLAIM_REPAIR_PENDING,
  DV_CLAIM_CREATED: NotificationEvent.CLAIM_DV_CREATED,
  SUBMITTED_TO_INSURER: NotificationEvent.CLAIM_SUBMITTED_TO_INSURER,
  NEGOTIATION: NotificationEvent.CLAIM_IN_NEGOTIATION,
  FINAL_OFFER_MADE: NotificationEvent.CLAIM_FINAL_OFFER,
  CLAIM_SETTLED: NotificationEvent.CLAIM_SETTLED,
  CLAIM_PAID: NotificationEvent.CLAIM_PAID,
  CLOSED: NotificationEvent.CLAIM_CLOSED,
};
