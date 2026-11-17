import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii, Shadows } from '../../constants/theme';

export const InvitationCard = ({
  invitation,
  onAccept,
  onReject,
  style = {}
}) => {
  const [acting, setActing] = useState(false);

  const handleAccept = async () => {
    setActing(true);
    try {
      await onAccept(invitation.invitationId);
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    setActing(true);
    try {
      await onReject(invitation.invitationId);
    } finally {
      setActing(false);
    }
  };

  const isEditor = invitation.role === 'editor';

  return (
    <View style={[styles.card, style]}>
      {/* Header Info */}
      <View style={styles.topRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail-unread-outline" size={20} color={Colors.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.listName} numberOfLines={1}>
            {invitation.listName || 'Shared Trip'}
          </Text>
          {invitation.destination ? (
            <View style={styles.destRow}>
              <Ionicons name="location-outline" size={12} color={Colors.textSecondary} style={{ marginRight: 3 }} />
              <Text style={styles.destinationText}>{invitation.destination}</Text>
            </View>
          ) : null}
        </View>

        {/* Role Pill */}
        <View style={[styles.rolePill, isEditor ? styles.rolePillEditor : styles.rolePillViewer]}>
          <Text style={[styles.roleText, isEditor ? styles.roleTextEditor : styles.roleTextViewer]}>
            {isEditor ? 'Editor' : 'Viewer'}
          </Text>
        </View>
      </View>

      {/* Inviter Details */}
      <View style={styles.inviterBox}>
        <Text style={styles.inviterText}>
          Invited by <Text style={styles.inviterName}>{invitation.inviterName || invitation.inviterEmail}</Text>
        </Text>
        <Text style={styles.permissionsNote}>
          {isEditor
            ? 'Can add, edit, and mark packing items'
            : 'Read-only access to view items & packing progress'}
        </Text>
      </View>

      {/* Accept / Decline Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          onPress={handleReject}
          disabled={acting}
          style={styles.declineBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.declineText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleAccept}
          disabled={acting}
          style={styles.acceptBtn}
          activeOpacity={0.8}
        >
          {acting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.acceptText}>Accept Invitation</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Shadows.sm
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  headerInfo: {
    flex: 1
  },
  listName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  destRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  destinationText: {
    fontSize: 12,
    color: Colors.textSecondary
  },
  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full
  },
  rolePillEditor: {
    backgroundColor: '#EFF6FF'
  },
  rolePillViewer: {
    backgroundColor: '#F3F4F6'
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  roleTextEditor: {
    color: '#1D4ED8'
  },
  roleTextViewer: {
    color: '#4B5563'
  },
  inviterBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: Radii.md,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  inviterText: {
    fontSize: 13,
    color: Colors.textPrimary
  },
  inviterName: {
    fontWeight: '700'
  },
  permissionsNote: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 3
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB'
  },
  declineText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary
  },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary
  },
  acceptText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});

export default InvitationCard;

