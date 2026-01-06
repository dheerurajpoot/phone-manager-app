import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

type MediaItem = { id: number; file_path: string; mime_type: string; created_at: string };

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const IMAGE_SIZE = width / COLUMN_COUNT;

export default function GalleryScreen() {
  const router = useRouter();
  const { childData } = useStore();
  const [items, setItems] = useState<{ id: number; url: string }[]>([]);

  useEffect(() => {
    if (!childData?.id) return;
    (async () => {
      const { data } = await supabase.from('media').select('*').eq('device_id', childData.id).order('created_at', { ascending: false }).limit(60);
      const signed: { id: number; url: string }[] = [];
      for (const m of (data || []) as MediaItem[]) {
        const { data: signedUrl } = await supabase.storage.from('media').createSignedUrl(m.file_path, 60 * 60);
        if (signedUrl?.signedUrl) {
          signed.push({ id: m.id, url: signedUrl.signedUrl });
        }
      }
      setItems(signed);
    })();
    const channel = supabase.channel('realtime:media-' + childData.id);
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'media', filter: `device_id=eq.${childData.id}` }, async (payload: any) => {
      const row = payload.new as MediaItem;
      const { data: signedUrl } = await supabase.storage.from('media').createSignedUrl(row.file_path, 60 * 60);
      if (signedUrl?.signedUrl) {
        setItems((prev) => [{ id: row.id, url: signedUrl.signedUrl }, ...prev]);
      }
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
        <Text style={styles.headerTitle}>Gallery</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.imageContainer}>
            <Image source={{ uri: item.url }} style={styles.image} />
          </TouchableOpacity>
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
    paddingBottom: 20,
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    padding: 1,
  },
  image: {
    flex: 1,
    backgroundColor: '#eee',
  },
});
