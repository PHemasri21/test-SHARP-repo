import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';

const INITIAL_TICKETS = [
  { id: '1', title: 'Main printer offline', description: 'Office printer not responding', category: 'Hardware', priority: 'High', status: 'Open', customerName: 'John Doe', contact: '9876543210', assignedAgent: null, comments: [], rating: null },
  { id: '2', title: 'CRM Database Sync Error', description: 'Timeout when fetching customer records', category: 'Software', priority: 'Medium', status: 'In Progress', customerName: 'Alice Smith', contact: '9123456789', assignedAgent: 'agent.tech@sharp.com', comments: [], rating: null }
];

export default function TicketQueueScreen({ navigation }) {
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [tab, setTab] = useState('Open');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    loadCachedTickets();
  }, []);

  const loadCachedTickets = async () => {
    try {
      const cached = await AsyncStorage.getItem('sharp_tickets');
      if (cached) setTickets(JSON.parse(cached));
    } catch (e) {
      console.error(e);
    }
  };

  const saveTicketsToCache = async (updated) => {
    setTickets(updated);
    await AsyncStorage.setItem('sharp_tickets', JSON.stringify(updated));
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const filtered = tickets.filter(t => {
    const matchesTab = t.status === tab;
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
    if (user?.role === 'customer') {
      return matchesTab && matchesSearch && t.customerName === user.name;
    }
    return matchesTab && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.headerTitle}>SHARP Queue</Text>
          <Text style={styles.subUser}>Role: {user?.role.toUpperCase()} ({user?.name || user?.email})</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <TextInput 
        style={styles.search} 
        placeholder="Search tickets by title or category..." 
        placeholderTextColor="#888"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.tabs}>
        {['Open', 'In Progress', 'Closed'].map(s => (
          <TouchableOpacity key={s} style={[styles.tab, tab === s && styles.activeTab]} onPress={() => setTab(s)}>
            <Text style={[styles.tabText, tab === s && styles.activeTabText]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList 
        data={filtered}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadCachedTickets(); setRefreshing(false); }} />}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigation.navigate('TicketDetail', { ticket: item, tickets, saveTicketsToCache })}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={[styles.pri, item.priority === 'High' ? styles.high : styles.med]}>{item.priority}</Text>
            </View>
            <Text style={styles.cat}>Category: {item.category} | By: {item.customerName}</Text>
            {item.assignedAgent && <Text style={styles.agentTag}>Assigned Agent: {item.assignedAgent}</Text>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No tickets found in {tab}</Text>}
      />

      {user?.role === 'customer' && (
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateTicket', { tickets, saveTicketsToCache })}>
          <Text style={styles.addBtnText}>+ New Ticket</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#FAF8F5' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  subUser: { fontSize: 11, color: '#666', marginTop: 2 },
  logoutBtn: { backgroundColor: '#FFE5E5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  logoutText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 12 },
  search: { backgroundColor: '#FFF', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#DDD' },
  tabs: { flexDirection: 'row', marginBottom: 15, backgroundColor: '#EBE5DC', borderRadius: 8, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  activeTab: { backgroundColor: '#FFF' },
  tabText: { color: '#666', fontSize: 12, fontWeight: '600' },
  activeTabText: { color: '#FF3B30', fontWeight: 'bold' },
  card: { backgroundColor: '#FFF', padding: 14, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#EFECE6' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  pri: { fontSize: 11, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  high: { backgroundColor: '#FFE5E5', color: '#D32F2F' },
  med: { backgroundColor: '#FFF4E5', color: '#EF6C00' },
  cat: { fontSize: 12, color: '#777', marginTop: 4 },
  agentTag: { fontSize: 11, color: '#1565C0', marginTop: 4, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  addBtn: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#FF3B30', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30 },
  addBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 }
});