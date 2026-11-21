import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { MockBackend } from '../api/mockBackend';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const loadTickets = async () => {
    setRefreshing(true);
    try {
      const data = await MockBackend.getTickets();
      if (user?.role === 'customer') {
        setTickets((data || []).filter(t => t.customerEmail === user.email));
      } else {
        setTickets(data || []);
      }
    } catch (e) {
      setTickets([]);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadTickets);
    loadTickets();
    return unsubscribe;
  }, [navigation]);

  const filteredTickets = tickets.filter(t => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'OPEN') return t.status === 'OPEN';
    if (activeTab === 'IN_PROGRESS') return t.status === 'IN_PROGRESS' || t.status === 'QUOTE_PENDING';
    if (activeTab === 'CLOSED') return t.status === 'CLOSED' || t.status === 'PAID';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Offline Storage Notice Banner */}
      <View style={styles.cacheBanner}>
        <Text style={styles.cacheText}>💾 Local Cache Active (Offline View Supported)</Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.nameText}>{user?.name}</Text>
          {user?.role === 'agent' && <Text style={styles.subText}>Agent ID: {user?.agentId}</Text>}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
            <Text style={{ fontSize: 16 }}>🔔</Text>
          </TouchableOpacity>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Customer Action Button */}
      {user?.role === 'customer' && (
        <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('CreateTicket')}>
          <Text style={styles.createBtnText}>+ Log New Ticket</Text>
        </TouchableOpacity>
      )}

      {/* Tabbed Filter Bar */}
      <View style={styles.tabBar}>
        {['ALL', 'OPEN', 'IN_PROGRESS', 'CLOSED'].map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Ticket List with Pull-to-Refresh */}
      <FlatList 
        data={filteredTickets}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadTickets} />}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.ticketId}>Ticket #{item.id}</Text>
              <Text style={[styles.status, { color: item.status === 'PAID' || item.status === 'CLOSED' ? 'green' : '#1565C0' }]}>
                {item.status}
              </Text>
            </View>

            <Text numberOfLines={2} style={styles.desc}>{item.description}</Text>
            <Text style={styles.meta}>Category: {item.category} | Priority: {item.priority}</Text>

            {item.assignedAgent && (
              <Text style={styles.agentMeta}>Agent: {item.assignedAgent.name} ({item.assignedAgent.agentId})</Text>
            )}

            {item.quoteAmount && (
              <Text style={styles.quoteMeta}>Quote: ₹{item.quoteAmount} INR ({item.status})</Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No cached tickets found in this tab.</Text>}
      />

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5', padding: 15 },
  cacheBanner: { backgroundColor: '#E8F5E9', padding: 6, borderRadius: 6, marginBottom: 8, alignItems: 'center', borderWidth: 1, borderColor: '#C8E6C9' },
  cacheText: { color: '#2E7D32', fontSize: 11, fontWeight: 'bold' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 10, elevation: 2, marginBottom: 10 },
  welcomeText: { fontSize: 12, color: '#666' },
  nameText: { fontSize: 18, fontWeight: 'bold', color: '#1565C0' },
  subText: { fontSize: 11, color: '#666' },
  bellBtn: { marginRight: 10, padding: 6, backgroundColor: '#F0F0F0', borderRadius: 20 },
  roleBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  roleText: { color: '#1565C0', fontWeight: 'bold', fontSize: 12 },
  createBtn: { backgroundColor: '#1565C0', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  createBtnText: { color: '#FFF', fontWeight: 'bold' },
  tabBar: { flexDirection: 'row', marginBottom: 12, backgroundColor: '#E0E0E0', borderRadius: 8, padding: 2 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  activeTab: { backgroundColor: '#1565C0' },
  tabText: { fontSize: 10, fontWeight: 'bold', color: '#555' },
  activeTabText: { color: '#FFF' },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  ticketId: { fontWeight: 'bold', color: '#1565C0' },
  status: { fontWeight: 'bold', fontSize: 12 },
  desc: { fontSize: 13, color: '#333', marginBottom: 6 },
  meta: { fontSize: 11, color: '#666' },
  agentMeta: { fontSize: 11, color: '#2E7D32', fontWeight: 'bold', marginTop: 4 },
  quoteMeta: { fontSize: 11, color: '#EF6C00', fontWeight: 'bold', marginTop: 2 },
  empty: { textAlign: 'center', color: '#666', marginTop: 40 },
  logoutBtn: { backgroundColor: '#455A64', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  logoutText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});