import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

type CallItem = { id: number; contact_name: string | null; number: string | null; type: string; time: string; duration_seconds: number };

export default function CallsScreen() {
  const router = useRouter();
  const { childData } = useStore();
  const [calls, setCalls] = useState<CallItem[]>([]);

  useEffect(() => {
    if (!childData?.id) return;
    (async () => {
      const { data } = await supabase.from('calls').select('*').eq('device_id', childData.id).order('time', { ascending: false }).limit(100);
      setCalls(data || []);
    })();
    const channel = supabase.channel('realtime:calls-' + childData.id);
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'calls', filter: `device_id=eq.${childData.id}` }, (payload: any) => {
      const row = payload.new;
      if (!row) return;
      setCalls((prev) => [row, ...prev].slice(0, 100));
    });
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [childData?.id]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'incoming': return 'call-outline';
      case 'outgoing': return 'call-outline'; // Could rotate
      case 'missed': return 'call-outline';
      default: return 'call-outline';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'incoming': return '#28C76F';
      case 'outgoing': return '#4A90E2';
      case 'missed': return '#FF5252';
      default: return '#333';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Call History</Text>
      </View>

      <FlatList
        data={calls}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={[styles.iconBox, { backgroundColor: getColor(item.type) + '20' }]}>
              <Ionicons 
                name={item.type === 'missed' ? 'close' : item.type === 'outgoing' ? 'arrow-up' : 'arrow-down'} 
                size={20} 
                color={getColor(item.type)} 
              />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.name}>{item.contact_name || 'Unknown'}</Text>
              <Text style={styles.number}>{item.number || ''}</Text>
            </View>
            <View style={styles.meta}>
              <Text style={styles.time}>{new Date(item.time).toLocaleString()}</Text>
              <Text style={styles.duration}>{Math.round(item.duration_seconds / 60)}m</Text>
            </View>
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
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  itemContent: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  number: {
    fontSize: 14,
    color: '#888',
  },
  meta: {
    alignItems: 'flex-end',
  },
  time: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  duration: {
    fontSize: 12,
    color: '#888',
  },
});
