import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

type SmsItem = { id: number; contact_name: string | null; number: string | null; message: string; time: string; unread: boolean };

export default function SMSScreen() {
  const router = useRouter();
  const { childData } = useStore();
  const [sms, setSms] = useState<SmsItem[]>([]);

  useEffect(() => {
    if (!childData?.id) return;
    (async () => {
      const { data } = await supabase.from('sms').select('*').eq('device_id', childData.id).order('time', { ascending: false }).limit(100);
      setSms(data || []);
    })();
    const channel = supabase.channel('realtime:sms-' + childData.id);
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'sms', filter: `device_id=eq.${childData.id}` }, (payload: any) => {
      const row = payload.new;
      if (!row) return;
      setSms((prev) => [row, ...prev].slice(0, 100));
    });
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [childData?.id]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <FlatList
        data={sms}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.item, item.unread && styles.unreadItem]}>
            <View style={styles.avatar}>
               <Text style={styles.avatarText}>{(item.contact_name || 'U')[0]}</Text>
            </View>
            <View style={styles.itemContent}>
              <View style={styles.topRow}>
                <Text style={[styles.name, item.unread && styles.unreadText]}>{item.contact_name || item.number || 'Unknown'}</Text>
                <Text style={styles.time}>{new Date(item.time).toLocaleString()}</Text>
              </View>
              <Text style={[styles.message, item.unread && styles.unreadMessage]} numberOfLines={2}>
                {item.message}
              </Text>
            </View>
            {item.unread && <View style={styles.dot} />}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    padding: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  unreadItem: {
    // Highlight if needed
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  itemContent: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  unreadText: {
    fontWeight: 'bold',
    color: '#000',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  message: {
    fontSize: 14,
    color: '#666',
  },
  unreadMessage: {
    color: '#333',
    fontWeight: '500',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4A90E2',
    marginLeft: 10,
  },
});
