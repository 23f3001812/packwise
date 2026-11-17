import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii, Shadows } from '../../constants/theme';

function getInitials(name = '') {
  if (!name) return 'PW';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export const CollaboratorCard = ({
  member,
  isCurrentUser = false,
  canManage = false,
  onChangeRole = null,
  onRemove = null,
  style = {}
}) => {
  const isOwner = member.role === 'owner';
  const isEditor = member.role === 'editor';
  const isViewer = member.role === 'viewer';

  const handleRoleToggle = () => {
    if (!onChangeRole || isOwner) return;
    const nextRole = isEditor ? 'viewer' : 'editor';
    Alert.alert(
      'Change Role',
      `Change ${member.displayName || 'this collaborator'}'s role to ${nextRole.toUpperCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Change', onPress: () => onChangeRole(member.userId, nextRole) }
      ]
    );
  };

  const handleRemove = () => {
    if (!onRemove || isOwner) return;
    Alert.alert(
      'Remove Collaborator',
      `Are you sure you want to remove ${member.displayName || member.email} from this list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onRemove(member.userId) }
      ]
    );
  };

  return (
    <View style={[styles.card, style]}>
      {/* Avatar Circle */}
      <View
        style={[
          styles.avatar,
          isOwner ? styles.avatarOwner : isEditor ? styles.avatarEditor : styles.avatarViewer
        ]}
      >
        <Text style={styles.initialsText}>
          {getInitials(member.displayName || member.email)}
        </Text>
      </View>

      {/* Info Column */}
      <View style={styles.infoCol}>
        <View style={styles.nameRow}>
          <Text style={styles.nameText} numberOfLines={1}>
            {member.displayName || member.email?.split('@')[0]}
            {isCurrentUser ? ' (You)' : ''}
          </Text>
        </View>
        {member.email ? (
          <Text style={styles.emailText} numberOfLines={1}>
            {member.email}
          </Text>
        ) : null}
      </View>

      {/* Role Badge & Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={canManage && !isOwner ? 0.7 : 1}
          onPress={canManage && !isOwner ? handleRoleToggle : undefined}
          style={[
            styles.roleBadge,
            isOwner ? styles.roleOwner : isEditor ? styles.roleEditor : styles.roleViewer
          ]}
        >
          <Text
            style={[
              styles.roleText,
              isOwner ? styles.roleTextOwner : isEditor ? styles.roleTextEditor : styles.roleTextViewer
            ]}
          >
            {isOwner ? 'Owner' : isEditor ? 'Editor' : 'Viewer'}
          </Text>
          {canManage && !isOwner && (
            <Ionicons name="swap-vertical" size={11} color={Colors.primary} style={{ marginLeft: 3 }} />
          )}
        </TouchableOpacity>

        {canManage && !isOwner && !isCurrentUser && (
          <TouchableOpacity
            onPress={handleRemove}
            style={styles.removeBtn}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="person-remove-outline" size={16} color={Colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Shadows.sm
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  avatarOwner: {
    backgroundColor: '#1E3A8A'
  },
  avatarEditor: {
    backgroundColor: '#0284C7'
  },
  avatarViewer: {
    backgroundColor: '#6B7280'
  },
  initialsText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  infoCol: {
    flex: 1,
    marginRight: 8
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  nameText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  emailText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radii.full
  },
  roleOwner: {
    backgroundColor: '#EFF6FF'
  },
  roleEditor: {
    backgroundColor: '#F0F9FF'
  },
  roleViewer: {
    backgroundColor: '#F3F4F6'
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  roleTextOwner: {
    color: '#1E40AF'
  },
  roleTextEditor: {
    color: '#0369A1'
  },
  roleTextViewer: {
    color: '#4B5563'
  },
  removeBtn: {
    padding: 6
  }
});

export default CollaboratorCard;

