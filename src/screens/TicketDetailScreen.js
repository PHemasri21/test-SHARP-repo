import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, Modal } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { MockBackend } from '../api/mockBackend';

export default function TicketDetailScreen({ route, navigation }) {
  const { ticketId } = route.params;
  const { user } = useContext(AuthContext);
  const [ticket, setTicket] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [quoteInput, setQuoteInput] = useState('');

  // Payment Modal States
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');

  // CSAT Rating Modal States
  const [csatModalVisible, setCsatModalVisible] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  const loadTicket = async () => {
    const tickets = await MockBackend.getTickets();
    const found = tickets.find(t => t.id === ticketId);
    if (found) {
      setTicket(found);
      if (found.status === 'CLOSED' && !found.rating && user?.role === 'customer') {
        setCsatModalVisible(true);
      }
    }
  };

  useEffect(() => {
    loadTicket();
  }, []);

  const handleStatusChange = async (newStatus) => {
    try {
      await MockBackend.updateTicketStatus(ticketId, newStatus);
      loadTicket();
      Alert.alert('Status Updated', `Ticket status changed to ${newStatus}`);
    } catch (e) {
      Alert.alert('Action Blocked', e.message);
    }
  };

  const handleAccept = async () => {
    await MockBackend.acceptTicket(ticketId, user);
    loadTicket();
    Alert.alert('Push Alert Sent', `FCM notification sent to customer that Agent ${user.agentId} has accepted.`);
  };

  const handleSendQuote = async () => {
    if (!quoteInput || isNaN(quoteInput)) {
      Alert.alert('Error', 'Enter a valid quote amount in INR.');
      return;
    }
    await MockBackend.setQuote(ticketId, quoteInput);
    setQuoteInput('');
    loadTicket();
    Alert.alert('Push Alert Sent', `Customer notified of quote: ₹${quoteInput} INR`);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    await MockBackend.addComment(ticketId, commentText.trim(), user.name);
    setCommentText('');
    loadTicket();
  };

  const submitPayment = async () => {
    if (paymentMethod === 'card') {
      if (cardNumber.length < 16 || !cardExpiry || cardCvv.length < 3) {
        Alert.alert('Invalid Card', 'Please enter valid 16-digit card details, expiry, and CVV.');
        return;
      }
    } else {
      if (!upiId || !upiId.includes('@')) {
        Alert.alert('Invalid UPI', 'Please enter a valid UPI ID.');
        return;
      }
    }

    await MockBackend.makePayment(ticketId);
    setPayModalVisible(false);
    Alert.alert('Payment Successful', 'Payment complete! Agent has been notified to close and resolve ticket.');
    loadTicket();
  };

  const submitCsat = async () => {
    await MockBackend.submitCsatRating(ticketId, ratingScore, feedbackText);
    setCsatModalVisible(false);
    Alert.alert('Thank You!', 'Your CSAT feedback has been submitted successfully.');
    loadTicket();
  };

  if (!ticket) return <View style={styles.container}><Text>Loading...</Text></View>;

  // Normalize photoUris (supports single photoUri from old tickets or photoUris array)
  const attachments = ticket.photoUris && ticket.photoUris.length > 0 
    ? ticket.photoUris 
    : (ticket.photoUri ? [ticket.photoUri] : []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Ticket #{ticket.id}</Text>
        <Text style={[styles.statusBadge, { color: ticket.status === 'CLOSED' ? 'green' : '#1565C0' }]}>
          {ticket.status}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Issue Description</Text>
        <Text style={styles.value}>{ticket.description}</Text>

        <Text style={styles.label}>Category & Priority</Text>
        <Text style={styles.value}>{ticket.category} | {ticket.priority}</Text>

        <Text style={styles.label}>Customer Details</Text>
        <Text style={styles.value}>{ticket.customerName} ({ticket.customerPhone})</Text>

        {/* Display Multiple Attached Photos Clearly */}
        {attachments.length > 0 && (
          <View style={{ marginVertical: 10 }}>
            <Text style={styles.label}>Attached Photos ({attachments.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {attachments.map((uri, idx) => (
                <Image key={idx} source={{ uri }} style={styles.detailImage} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Assigned Agent Display */}
        <Text style={styles.label}>Assigned Agent</Text>
        {ticket.assignedAgent ? (
          <View style={styles.agentBox}>
            <Text style={styles.agentText}>{ticket.assignedAgent.name} (ID: {ticket.assignedAgent.agentId})</Text>
            <Text style={styles.agentSubText}>{ticket.assignedAgent.email}</Text>
          </View>
        ) : (
          <View>
            <Text style={styles.value}>Unassigned</Text>
            {user?.role === 'agent' && (
              <TouchableOpacity style={styles.btnPrimary} onPress={handleAccept}>
                <Text style={styles.btnText}>Accept Ticket (Trigger Alert)</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Agent Status Controls */}
        {user?.role === 'agent' && ticket.assignedAgent && (
          <View style={{ marginTop: 15 }}>
            <Text style={styles.label}>Update Status (Agent Control Only)</Text>
            <View style={styles.row}>
              {['OPEN', 'IN_PROGRESS', 'CLOSED'].map(st => (
                <TouchableOpacity 
                  key={st} 
                  style={[styles.chip, ticket.status === st && styles.activeChip]}
                  onPress={() => handleStatusChange(st)}
                >
                  <Text style={[styles.chipText, ticket.status === st && styles.activeChipText]}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {ticket.paymentStatus !== 'SUCCESS' && (
              <Text style={styles.warningText}>* Closing is locked until payment is completed by customer.</Text>
            )}
          </View>
        )}

        {/* Pricing / Quote & Payment Section */}
        {ticket.quoteAmount && (
          <View style={styles.quoteCard}>
            <Text style={styles.quoteTitle}>Allotted Pricing: ₹{ticket.quoteAmount} INR</Text>
            <Text style={styles.subText}>Payment Status: {ticket.paymentStatus === 'SUCCESS' ? '✓ Paid Successfully' : 'Pending Payment'}</Text>

            {user?.role === 'customer' && ticket.paymentStatus !== 'SUCCESS' && (
              <TouchableOpacity style={styles.payBtn} onPress={() => setPayModalVisible(true)}>
                <Text style={styles.payBtnText}>Proceed to Pay ₹{ticket.quoteAmount}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {user?.role === 'agent' && ticket.assignedAgent && !ticket.quoteAmount && (
          <View style={{ marginTop: 15 }}>
            <Text style={styles.label}>Set Pricing (INR)</Text>
            <View style={styles.row}>
              <TextInput 
                style={[styles.input, { flex: 1, marginRight: 8, marginBottom: 0 }]} 
                placeholder="e.g. 1500" 
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={quoteInput}
                onChangeText={setQuoteInput}
              />
              <TouchableOpacity style={styles.btnSecondary} onPress={handleSendQuote}>
                <Text style={styles.btnText}>Send Quote</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* CSAT Display if Rated */}
        {ticket.rating && (
          <View style={styles.csatDisplay}>
            <Text style={styles.csatTitle}>★ Customer CSAT Rating: {ticket.rating} / 5 Stars</Text>
            {ticket.feedback ? <Text style={styles.subText}>Feedback: "{ticket.feedback}"</Text> : null}
          </View>
        )}
      </View>

      {/* Comments Section */}
      <View style={styles.card}>
        <Text style={styles.label}>Discussion & Comments</Text>
        {ticket.comments && ticket.comments.length > 0 ? (
          ticket.comments.map(c => (
            <View key={c.id} style={styles.commentBox}>
              <Text style={styles.commentSender}>{c.sender} <Text style={styles.commentTime}>({c.time})</Text></Text>
              <Text style={styles.commentText}>{c.text}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.subText}>No comments yet.</Text>
        )}

        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          <TextInput 
            style={[styles.input, { flex: 1, marginRight: 8, marginBottom: 0 }]} 
            placeholder="Type a comment..." 
            placeholderTextColor="#888"
            value={commentText}
            onChangeText={setCommentText}
          />
          <TouchableOpacity style={styles.btnPrimary} onPress={handleAddComment}>
            <Text style={styles.btnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment Checkout Modal */}
      <Modal visible={payModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Payment Method</Text>

            <View style={styles.tabRow}>
              <TouchableOpacity 
                style={[styles.methodTab, paymentMethod === 'card' && styles.activeMethodTab]}
                onPress={() => setPaymentMethod('card')}
              >
                <Text style={[styles.methodText, paymentMethod === 'card' && styles.activeMethodText]}>Credit / Debit Card</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.methodTab, paymentMethod === 'upi' && styles.activeMethodTab]}
                onPress={() => setPaymentMethod('upi')}
              >
                <Text style={[styles.methodText, paymentMethod === 'upi' && styles.activeMethodText]}>UPI ID</Text>
              </TouchableOpacity>
            </View>

            {paymentMethod === 'card' ? (
              <>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput 
                  style={styles.modalInput} 
                  placeholder="4111 2222 3333 4444" 
                  placeholderTextColor="#888"
                  keyboardType="number-pad" 
                  maxLength={16}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.inputLabel}>Expiry (MM/YY)</Text>
                    <TextInput 
                      style={styles.modalInput} 
                      placeholder="MM/YY" 
                      placeholderTextColor="#888"
                      value={cardExpiry}
                      onChangeText={setCardExpiry}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <TextInput 
                      style={styles.modalInput} 
                      placeholder="123" 
                      placeholderTextColor="#888"
                      keyboardType="number-pad" 
                      maxLength={4}
                      secureTextEntry
                      value={cardCvv}
                      onChangeText={setCardCvv}
                    />
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>Enter UPI ID</Text>
                <TextInput 
                  style={styles.modalInput} 
                  placeholder="username@okhdfcbank" 
                  placeholderTextColor="#888"
                  autoCapitalize="none"
                  value={upiId}
                  onChangeText={setUpiId}
                />
              </>
            )}

            <TouchableOpacity style={styles.confirmPayBtn} onPress={submitPayment}>
              <Text style={styles.confirmPayText}>Pay Now</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelPayBtn} onPress={() => setPayModalVisible(false)}>
              <Text style={styles.cancelPayText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CSAT Rating Modal */}
      <Modal visible={csatModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate Your Experience (CSAT)</Text>
            <Text style={styles.subText}>Your ticket has been resolved and closed. Please rate our service:</Text>

            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map(num => (
                <TouchableOpacity key={num} onPress={() => setRatingScore(num)}>
                  <Text style={{ fontSize: 32, color: num <= ratingScore ? '#FFD700' : '#CCC' }}>★</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Additional Feedback (Optional)</Text>
            <TextInput 
              style={[styles.modalInput, { height: 60, textAlignVertical: 'top' }]} 
              multiline
              placeholder="Tell us about your experience..." 
              placeholderTextColor="#888"
              value={feedbackText}
              onChangeText={setFeedbackText}
            />

            <TouchableOpacity style={styles.confirmPayBtn} onPress={submitCsat}>
              <Text style={styles.confirmPayText}>Submit Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5', padding: 15 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1565C0' },
  statusBadge: { fontWeight: 'bold', fontSize: 14 },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#EEE' },
  label: { fontSize: 12, fontWeight: 'bold', color: '#444', marginBottom: 4, marginTop: 10 },
  value: { fontSize: 14, color: '#333', marginBottom: 6 },
  detailImage: { width: 140, height: 140, borderRadius: 8, marginRight: 10, resizeMode: 'cover' },
  agentBox: { backgroundColor: '#F0F4C3', padding: 10, borderRadius: 6, marginTop: 4 },
  agentText: { fontWeight: 'bold', color: '#333' },
  agentSubText: { fontSize: 11, color: '#666' },
  row: { flexDirection: 'row', alignItems: 'center' },
  chip: { flex: 1, padding: 8, borderWidth: 1, borderColor: '#DDD', borderRadius: 6, alignItems: 'center', marginHorizontal: 2, backgroundColor: '#FAFAFA' },
  activeChip: { backgroundColor: '#1565C0', borderColor: '#1565C0' },
  chipText: { fontSize: 11, fontWeight: 'bold', color: '#555' },
  activeChipText: { color: '#FFF' },
  warningText: { fontSize: 10, color: '#D32F2F', fontStyle: 'italic', marginTop: 4 },
  input: { backgroundColor: '#F9F9F9', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#DDD', color: '#000' },
  btnPrimary: { backgroundColor: '#1565C0', padding: 10, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  btnSecondary: { backgroundColor: '#EF6C00', padding: 10, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  quoteCard: { backgroundColor: '#E8F5E9', padding: 12, borderRadius: 6, marginTop: 10 },
  quoteTitle: { fontWeight: 'bold', color: '#2E7D32', marginBottom: 6 },
  payBtn: { backgroundColor: '#D32F2F', padding: 12, borderRadius: 6, alignItems: 'center', marginTop: 6 },
  payBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  subText: { fontSize: 12, color: '#666' },
  csatDisplay: { backgroundColor: '#FFFDE7', padding: 10, borderRadius: 6, marginTop: 10, borderWidth: 1, borderColor: '#FFEE58' },
  csatTitle: { fontWeight: 'bold', color: '#F57F17' },
  commentBox: { backgroundColor: '#F5F5F5', padding: 8, borderRadius: 6, marginBottom: 6 },
  commentSender: { fontSize: 11, fontWeight: 'bold', color: '#1565C0' },
  commentTime: { fontSize: 9, color: '#888' },
  commentText: { fontSize: 13, color: '#333', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1565C0', marginBottom: 15, textAlign: 'center' },
  starRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 15 },
  tabRow: { flexDirection: 'row', marginBottom: 15, backgroundColor: '#EEE', borderRadius: 8, overflow: 'hidden' },
  methodTab: { flex: 1, padding: 10, alignItems: 'center' },
  activeMethodTab: { backgroundColor: '#1565C0' },
  methodText: { fontWeight: 'bold', color: '#555', fontSize: 12 },
  activeMethodText: { color: '#FFF' },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#444', marginBottom: 4 },
  modalInput: { backgroundColor: '#F9F9F9', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#DDD', marginBottom: 12, color: '#000' },
  confirmPayBtn: { backgroundColor: '#2E7D32', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  confirmPayText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  cancelPayBtn: { padding: 10, alignItems: 'center', marginTop: 8 },
  cancelPayText: { color: '#666', fontWeight: 'bold' }
});