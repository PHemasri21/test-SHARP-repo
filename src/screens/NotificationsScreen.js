import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { MockBackend } from '../api/mockBackend';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function loadNotes() {
      const notes = await MockBackend.getNotifications();
      setNotifications(notes);
    }
    loadNotes();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>System Alerts & Notifications</Text>
      <FlatList 
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.time}>{item.time}</Text>
            <Text style={styles.message}>{item.message}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5', padding: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1565C0', marginBottom: 15 },
  card: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#EEE' },
  time: { fontSize: 10, color: '#888', marginBottom: 2 },
  message: { fontSize: 13, color: '#333', fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#666', marginTop: 40 }
});