import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function OfflineCacheBar({
  isOffline,
  recordCount,
  lastUpdatedAt,
  onToggleOfflineDemo,
  onSeedDemo,
}) {
  const formattedTime = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Not cached yet';

  return (
    <View style={[styles.banner, isOffline ? styles.offlineBanner : styles.onlineBanner]}>
      <View style={styles.infoCol}>
        <Text style={styles.statusText}>
          {isOffline ? '📴 Offline View Active (Local Cache)' : '💾 Local Cache Ready'}
        </Text>
        <Text style={styles.metaText}>
          {recordCount} ticket(s) cached • Updated: {formattedTime}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        {recordCount === 0 && (
          <TouchableOpacity style={styles.seedBtn} onPress={onSeedDemo}>
            <Text style={styles.btnLabel}>+ Demo Data</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.toggleBtn} onPress={onToggleOfflineDemo}>
          <Text style={styles.btnLabel}>{isOffline ? 'Go Online' : 'Demo Offline'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  offlineBanner: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFB74D',
  },
  onlineBanner: {
    backgroundColor: '#E3F2FD',
    borderColor: '#90CAF9',
  },
  infoCol: {
    flex: 1,
    paddingRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A237E',
  },
  metaText: {
    fontSize: 11,
    color: '#455A64',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleBtn: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  seedBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 6,
  },
  btnLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});