import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ScrollView, PermissionsAndroid, Platform } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { MockBackend } from '../api/mockBackend';
import { AuthContext } from '../context/AuthContext';

export default function CreateTicketScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [category, setCategory] = useState('Hardware Repair');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [photoUris, setPhotoUris] = useState([]); // Array supporting multiple photos

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'SHARP CRM needs access to your camera to attach photos to tickets.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    }
    return true;
  };

  const handleOpenCameraController = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
      return;
    }

    const options = { 
      mediaType: 'photo', 
      quality: 0.7,
      saveToPhotos: true,
      selectionLimit: 1
    };

    launchCamera(options, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Camera Error', response.errorMessage || 'Unable to open camera');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        setPhotoUris(prev => [...prev, response.assets[0].uri]);
      }
    });
  };

  const handleOpenGallery = async () => {
    const options = { 
      mediaType: 'photo', 
      quality: 0.7,
      selectionLimit: 0 // 0 allows selecting multiple images
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Gallery Error', response.errorMessage || 'Unable to open gallery');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        const newUris = response.assets.map(asset => asset.uri);
        setPhotoUris(prev => [...prev, ...newUris]);
      }
    });
  };

  const handleRemovePhoto = (indexToRemove) => {
    setPhotoUris(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmitTicket = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please describe your issue.');
      return;
    }
    try {
      await MockBackend.createTicket({ category, priority, description, photoUris }, user);
      Alert.alert('Success', 'Ticket logged successfully with attachments!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Log New Ticket</Text>

      <Text style={styles.label}>Category</Text>
      <View style={styles.row}>
        {['Hardware Repair', 'Software', 'Network'].map(cat => (
          <TouchableOpacity 
            key={cat} 
            style={[styles.chip, category === cat && styles.activeChip]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.chipText, category === cat && styles.activeChipText]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Priority</Text>
      <View style={styles.row}>
        {['Low', 'Medium', 'High'].map(p => (
          <TouchableOpacity 
            key={p} 
            style={[styles.chip, priority === p && styles.activeChip]}
            onPress={() => setPriority(p)}
          >
            <Text style={[styles.chipText, priority === p && styles.activeChipText]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Issue Description</Text>
      <TextInput 
        style={[styles.input, { height: 80 }]} 
        multiline 
        placeholder="Describe the issue in detail..." 
        placeholderTextColor="#888"
        value={description} 
        onChangeText={setDescription} 
      />

      <View style={{ flexDirection: 'row', marginTop: 15 }}>
        <TouchableOpacity style={[styles.cameraBtn, { flex: 1, marginRight: 6 }]} onPress={handleOpenCameraController}>
          <Text style={styles.cameraBtnText}>📷 Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.cameraBtn, { flex: 1, marginLeft: 6, backgroundColor: '#37474F' }]} onPress={handleOpenGallery}>
          <Text style={styles.cameraBtnText}>🖼️ Pick Multiple</Text>
        </TouchableOpacity>
      </View>

      {/* Multi-Photo Preview Grid with Remove Option */}
      {photoUris.length > 0 && (
        <View style={styles.previewContainer}>
          <Text style={styles.label}>Attached Photos ({photoUris.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {photoUris.map((uri, index) => (
              <View key={index} style={styles.previewWrapper}>
                <Image source={{ uri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemovePhoto(index)}>
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitTicket}>
        <Text style={styles.submitBtnText}>Submit Ticket</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#FAF8F5', flexGrow: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1565C0', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#444', marginBottom: 6, marginTop: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  chip: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#DDD', borderRadius: 8, alignItems: 'center', marginHorizontal: 4, backgroundColor: '#FFF' },
  activeChip: { backgroundColor: '#1565C0', borderColor: '#1565C0' },
  chipText: { color: '#444', fontWeight: 'bold', fontSize: 12 },
  activeChipText: { color: '#FFF' },
  input: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', textAlignVertical: 'top', color: '#000' },
  cameraBtn: { backgroundColor: '#455A64', padding: 12, borderRadius: 8, alignItems: 'center' },
  cameraBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  previewContainer: { marginTop: 15 },
  previewWrapper: { position: 'relative', marginRight: 10 },
  previewImage: { width: 110, height: 110, borderRadius: 8, resizeMode: 'cover' },
  removeBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.7)', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  removeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#FF3B30', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 25 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});