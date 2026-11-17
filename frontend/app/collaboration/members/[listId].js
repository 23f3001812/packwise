import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Radii, Shadows } from '../../../constants/theme';
import { Header } from '../../../components/common/Header';
import { CollaboratorCard } from '../../../components/collaboration/CollaboratorCard';
import { InviteMemberModal } from '../../../components/collaboration/InviteMemberModal';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import {
  fetchListMembers,
  sendInvitation,
  updateMemberRole,
  removeMember,
  cancelInvitation,
  leaveList
} from '../../../services/collaborationService';
import { useAuth } from '../../../context/AuthContext';

export default function ListMembersScreen() {
  const router = useRouter();
  const { listId } = useLocalSearchParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listDetails, setListDetails] = useState(null);
  const [members, setMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviting, setInviting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchListMembers(listId);
      setListDetails({ listId: res.listId, listName: res.listName });
      setMembers(res.members || []);
      setPendingInvitations(res.pendingInvitations || []);
      setIsOwner(Boolean(res.isOwner));
    } catch (err) {
      console.warn('Failed to load members:', err.message);
      Alert.alert('Error', err.message || 'Could not load collaborators.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (listId) loadData();
    }, [listId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetchListMembers(listId);
      setMembers(res.members || []);
      setPendingInvitations(res.pendingInvitations || []);
      setIsOwner(Boolean(res.isOwner));
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendInvite = async (email, role) => {
    setInviting(true);
    try {
      await sendInvitation({ listId, email, role });
      Alert.alert('Invitation Sent', `An invitation has been sent to ${email}.`);
      onRefresh();
    } catch (err) {
      throw err;
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (targetUserId, newRole) => {
    try {
      await updateMemberRole(listId, targetUserId, newRole);
      Alert.alert('Success', 'Member role updated.');
      onRefresh();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update role.');
    }
  };

  const handleRemoveMember = async (targetUserId) => {
    try {
      await removeMember(listId, targetUserId);
      Alert.alert('Removed', 'Collaborator removed from packing list.');
      onRefresh();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to remove collaborator.');
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    Alert.alert(
      'Cancel Invitation',
      'Are you sure you want to cancel this pending invitation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Invite',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelInvitation(invitationId);
              onRefresh();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to cancel invitation.');
            }
          }
        }
      ]
    );
  };

  const handleLeaveList = () => {
    Alert.alert(
      'Leave Shared List',
      'Are you sure you want to leave this shared packing list? You will no longer have access.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveList(listId);
              Alert.alert('Success', 'You have left the list.');
              router.replace('/(tabs)/groups');
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to leave list.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Collaborators" showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Header Summary Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerIconCircle}>
            <Ionicons name="people" size={20} color={Colors.primary} />
          </View>
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerTitle} numberOfLines={1}>
              {listDetails?.listName || 'Packing List'}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {members.length} {members.length === 1 ? 'collaborator' : 'collaborators'} active
            </Text>
          </View>

          {isOwner && (
            <TouchableOpacity
              onPress={() => setInviteModalVisible(true)}
              style={styles.inviteHeaderBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.inviteHeaderBtnText}>Invite</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Active Members Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Active Members ({members.length})</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <View style={styles.membersList}>
            {members.map((member) => (
              <CollaboratorCard
                key={member.userId}
                member={member}
                isCurrentUser={member.userId === user?.uid}
                canManage={isOwner}
                onChangeRole={handleChangeRole}
                onRemove={handleRemoveMember}
              />
            ))}
          </View>
        )}

        {/* Pending Invitations Section (Owner Only) */}
        {isOwner && pendingInvitations.length > 0 && (
          <View style={styles.pendingSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                Pending Invitations ({pendingInvitations.length})
              </Text>
            </View>

            {pendingInvitations.map((inv) => (
              <View key={inv.invitationId} style={styles.pendingCard}>
                <View style={styles.pendingIcon}>
                  <Ionicons name="time-outline" size={16} color="#D97706" />
                </View>
                <View style={styles.pendingInfo}>
                  <Text style={styles.pendingEmail}>{inv.inviteeEmail}</Text>
                  <Text style={styles.pendingRole}>Invited as {inv.role || 'editor'}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleCancelInvitation(inv.invitationId)}
                  style={styles.cancelInviteBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelInviteText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Non-owner Leave Button */}
        {!isOwner && !loading && (
          <View style={styles.leaveSection}>
            <TouchableOpacity
              onPress={handleLeaveList}
              style={styles.leaveBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="exit-outline" size={18} color={Colors.danger} style={{ marginRight: 6 }} />
              <Text style={styles.leaveText}>Leave This Shared List</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Invite Modal */}
      <InviteMemberModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        onInvite={handleSendInvite}
        loading={inviting}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Shadows.sm
  },
  bannerIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  bannerInfo: {
    flex: 1,
    marginRight: 8
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  bannerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2
  },
  inviteHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.full
  },
  inviteHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  sectionHeaderRow: {
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  loadingContainer: {
    paddingVertical: 30,
    alignItems: 'center'
  },
  membersList: {
    marginBottom: 16
  },
  pendingSection: {
    marginTop: 10,
    marginBottom: 16
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7'
  },
  pendingIcon: {
    marginRight: 10
  },
  pendingInfo: {
    flex: 1
  },
  pendingEmail: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  pendingRole: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 2
  },
  cancelInviteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  cancelInviteText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309'
  },
  leaveSection: {
    marginTop: 20,
    alignItems: 'center'
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Radii.full,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2'
  },
  leaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.danger
  }
});

