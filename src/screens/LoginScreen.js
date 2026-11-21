import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen() {
  const [role, setRole] = useState('customer'); // 'customer' or 'agent'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [agentId, setAgentId] = useState('');
  const [password, setPassword] = useState('');
  const { loginOrRegister } = useContext(AuthContext);

  const handleSubmit = async () => {
    try {
      if (!name.trim() || !email.trim() || !password.trim()) {
        Alert.alert('Validation Error', 'Please fill in Name, Email, and Password.');
        return;
      }

      await loginOrRegister({ 
        role, 
        name: name.trim(), 
        email: email.trim(), 
        phone: phone.trim(), 
        agentId: agentId.trim(), 
        password 
      });
    } catch (e) {
      Alert.alert('Login Failed', e?.message || 'An unknown error occurred.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SHARP CRM</Text>
      
      {/* Role Toggle Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, role === 'customer' && styles.activeTab]} 
          onPress={() => setRole('customer')}
        >
          <Text style={[styles.tabText, role === 'customer' && styles.activeTabText]}>Customer</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, role === 'agent' && styles.activeTab]} 
          onPress={() => setRole('agent')}
        >
          <Text style={[styles.tabText, role === 'agent' && styles.activeTabText]}>Agent</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Full Name</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Enter your name" 
        placeholderTextColor="#888"
        value={name} 
        onChangeText={setName} 
      />

      {role === 'agent' && (
        <>
          <Text style={styles.label}>Agent ID</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. AGT001" 
            placeholderTextColor="#888"
            value={agentId} 
            onChangeText={setAgentId} 
          />
        </>
      )}

      <Text style={styles.label}>Email Address {role === 'agent' ? '(@sharp.com)' : ''}</Text>
      <TextInput 
        style={styles.input} 
        placeholder={role === 'agent' ? 'agentname@sharp.com' : 'name@example.com'} 
        placeholderTextColor="#888"
        autoCapitalize="none"
        value={email} 
        onChangeText={setEmail} 
      />

      {role === 'customer' && (
        <>
          <Text style={styles.label}>Phone Number (10 digits)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="9876543210" 
            placeholderTextColor="#888"
            keyboardType="phone-pad" 
            value={phone} 
            onChangeText={setPhone} 
          />
        </>
      )}

      <Text style={styles.label}>Password</Text>
      <TextInput 
        style={styles.input} 
        placeholder="••••••••" 
        placeholderTextColor="#888"
        secureTextEntry 
        value={password} 
        onChangeText={setPassword} 
      />

      <TouchableOpacity style={styles.btn} onPress={handleSubmit}>
        <Text style={styles.btnText}>Sign In / Register as {role.toUpperCase()}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#FAF8F5' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1565C0', textAlign: 'center', marginBottom: 20 },
  tabContainer: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#DDD', borderRadius: 8, overflow: 'hidden' },
  tab: { flex: 1, padding: 12, alignItems: 'center' },
  activeTab: { backgroundColor: '#1565C0' },
  tabText: { fontWeight: 'bold', color: '#555' },
  activeTabText: { color: '#FFF' },
  label: { fontSize: 12, fontWeight: 'bold', color: '#444', marginBottom: 4 },
  input: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', marginBottom: 12, color: '#000' },
  btn: { backgroundColor: '#FF3B30', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});