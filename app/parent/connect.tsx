import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../../store/useStore';
import { Ionicons } from '@expo/vector-icons';

export default function ParentConnectScreen() {
  const router = useRouter();
  const connectToChild = useStore((state) => state.connectToChild);
  const [idInput, setIdInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    if (!idInput.trim()) {
      Alert.alert("Required", "Please enter the Device ID.");
      return;
    }

    setLoading(true);
    // Simulate network delay
    setTimeout(() => {
      const success = connectToChild(idInput);
      setLoading(false);
      
      if (success) {
        router.replace('/parent/dashboard');
      } else {
        Alert.alert("Error", "Could not connect to device. Please check the ID.");
      }
    }, 1500);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Connect to Device</Text>
        <Text style={styles.subtitle}>Enter the ID displayed on your child's phone.</Text>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="key-outline" size={24} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Enter Device ID"
          value={idInput}
          onChangeText={setIdInput}
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleConnect}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Connect</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 30,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    height: 60,
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#333',
    height: '100%',
  },
  button: {
    backgroundColor: '#4A90E2',
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
  }
});
