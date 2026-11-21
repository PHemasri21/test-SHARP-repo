import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { MockBackend } from '../api/mockBackend';

export default function PaymentScreen({ route, navigation }) {
  const { ticketId, amount } = route.params;
  const [method, setMethod] = useState('UPI');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const { user } = useContext(AuthContext);

  const handlePay = async () => {
    try {
      if (method === 'UPI' && !upiId) {
        Alert.alert('Error', 'Please enter UPI ID');
        return;
      }
      if (method === 'Card' && (!cardNumber || !expiry || !cvv)) {
        Alert.alert('Error', 'Please fill in all card details');
        return;
      }

      await MockBackend.processPayment(ticketId, { amount, method });
      Alert.alert('Payment Successful', `Paid ₹${amount} successfully via ${method}.`, [
        { text: 'OK', onPress: () => navigation.popToTop() }
      ]);
    } catch (e) {
      Alert.alert('Payment Failed', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Secure Checkout</Text>
      <Text style={styles.sub}>Amount Due: ₹{amount}</Text>

      <Text style={styles.label}>Select Payment Method</Text>
      <View style={styles.row}>
        {['UPI', 'Card', 'Net Banking'].map(m => (
          <TouchableOpacity key={m} style={[styles.pill, method === m && styles.activePill]} onPress={() => setMethod(m)}>
            <Text style={[styles.pillTxt, method === m && styles.activePillTxt]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {method === 'UPI' && (
        <View style={{marginTop: 15}}>
          <Text style={styles.label}>UPI ID / VPA</Text>
          <TextInput style={styles.input} placeholder="username@okhdfcbank" placeholderTextColor="#888" value={upiId} onChangeText={setUpiId} />
        </View>
      )}

      {method === 'Card' && (
        <View style={{marginTop: 15}}>
          <Text style={styles.label}>Card Number</Text>
          <TextInput style={styles.input} placeholder="4000 1234 5678 9010" placeholderTextColor="#888" keyboardType="numeric" value={cardNumber} onChangeText={setCardNumber} />
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex:1}]} placeholder="MM/YY" placeholderTextColor="#888" value={expiry} onChangeText={setExpiry} />
            <TextInput style={[styles.input, {flex:1}]} placeholder="CVV" placeholderTextColor="#888" secureTextEntry keyboardType="numeric" value={cvv} onChangeText={setCvv} />
          </View>
        </View>
      )}

      {method === 'Net Banking' && (
        <View style={{marginTop: 15}}>
          <Text style={styles.label}>Select Bank</Text>
          <Text style={{color:'#666', fontStyle:'italic'}}>Simulating secure bank gateway redirect...</Text>
        </View>
      )}

      <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
        <Text style={styles.payTxt}>Pay ₹{amount} Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FAF8F5', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#222', textAlign: 'center' },
  sub: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32', textAlign: 'center', marginBottom: 25 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#444', marginBottom: 6 },
  input: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  pill: { flex: 1, padding: 10, backgroundColor: '#EBE5DC', borderRadius: 6, alignItems: 'center' },
  activePill: { backgroundColor: '#FF3B30' },
  pillTxt: { fontSize: 12, fontWeight: 'bold', color: '#555' },
  activePillTxt: { color: '#FFF' },
  payBtn: { backgroundColor: '#2E7D32', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 25 },
  payTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});