import webPush from 'web-push';
import { supabaseServer } from '../../server';
import { db } from './db';
import { PushSubscriptionRecord } from '../types/crm';

// Default VAPID keys for CoreIQ Operator web push
// If not configured in env, fallback to these valid VAPID keys
let VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
let VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:operator@coreiq.com';

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  // Generate once and keep in memory so notifications work out-of-the-box on Cloud Run
  try {
    const keys = webPush.generateVAPIDKeys();
    VAPID_PUBLIC_KEY = keys.publicKey;
    VAPID_PRIVATE_KEY = keys.privateKey;
  } catch (err) {
    console.error('Failed to generate fallback VAPID keys', err);
  }
}

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  } catch (err) {
    console.error('Failed to initialize VAPID details', err);
  }
}

export function getPublicVapidKey(): string {
  return VAPID_PUBLIC_KEY;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, any>;
}

export async function sendPushNotification(
  eventType: 'new_lead' | 'money_in' | 'build_needed' | 'retainer_due' | 'human_requested',
  payload: PushPayload
): Promise<{ success: boolean; sentCount: number; errors: string[] }> {
  const settings = db.getBusinessSettings();
  if (settings.push_events && settings.push_events[eventType] === false) {
    return { success: true, sentCount: 0, errors: [] };
  }

  // Load subscriptions from Supabase first, fallback to local memory
  let subscriptions: PushSubscriptionRecord[] = [];

  if (supabaseServer) {
    try {
      const { data } = await supabaseServer.from('push_subscriptions').select('*');
      if (data && data.length > 0) {
        subscriptions = data;
      }
    } catch {
      // Fallback
    }
  }

  if (subscriptions.length === 0) {
    subscriptions = (db.get() as any).push_subscriptions || [];
  }

  if (subscriptions.length === 0) {
    return { success: true, sentCount: 0, errors: [] };
  }

  const notificationBody = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icon.svg',
    badge: payload.badge || '/icon.svg',
    url: payload.url || '/',
    tag: payload.tag || eventType,
    data: payload.data || {},
  });

  let sentCount = 0;
  const errors: string[] = [];

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        notificationBody
      );
      sentCount++;
    } catch (err: any) {
      errors.push(`Endpoint ${sub.endpoint.slice(-10)}: ${err.message}`);
      // Remove stale subscription (410 Gone or 404)
      if (err.statusCode === 410 || err.statusCode === 404) {
        if (supabaseServer) {
          await supabaseServer.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
        const data = db.get() as any;
        if (data.push_subscriptions) {
          data.push_subscriptions = data.push_subscriptions.filter((s: any) => s.endpoint !== sub.endpoint);
          db.save();
        }
      }
    }
  }

  return { success: sentCount > 0 || subscriptions.length === 0, sentCount, errors };
}
