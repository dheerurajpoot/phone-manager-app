import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ChildSetupScreenWeb() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconHeader}>
          <Ionicons name="warning-outline" size={50} color="#FF9F43" />
        </View>
        <Text style={styles.title}>Mobile Device Required</Text>
        <Text style={styles.subtitle}>
          Child Mode (Monitoring Agent) is only available on Android and iOS devices. 
          Please install this app on the phone you wish to monitor.
        </Text>
        
        <Text style={styles.note}>
          You can still use the Web version as a **Parent** to monitor other devices.
        </Text>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.replace('/')}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#50E3C2',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    maxWidth: 500,
    alignItems: 'center',
    width: '100%',
  },
  iconHeader: {
    marginBottom: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  note: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '500',
    backgroundColor: '#F5F7FA',
    padding: 10,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
