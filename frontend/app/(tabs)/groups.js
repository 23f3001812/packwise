import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii, Shadows } from '../../constants/theme';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { useAuth } from '../../context/AuthContext';

export default function GroupsScreen() {
  const { user, userProfile } = useAuth();
  const userName = userProfile?.name || user?.displayName || 'You';

  const members = [
    { id: '1', name: userName, progress: 72, isCurrentUser: true },
    { id: '2', name: 'Riya', progress: 68, isCurrentUser: false },
    { id: '3', name: 'Aditya', progress: 65, isCurrentUser: false },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Trip Group</Text>
          <Text style={styles.headerSubtitle}>4 Members • Shimla Expedition</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Group Checklist Banner Card */}
          <TouchableOpacity
            style={[styles.groupChecklistCard, Shadows.card]}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                'Group Checklist',
                'Real-time collaborative checklist sync will be enabled in Milestone 6.'
              )
            }
          >
            <View style={styles.groupChecklistInfo}>
              <Text style={styles.groupChecklistTitle}>Group Checklist</Text>
              <Text style={styles.groupChecklistSubtitle}>
                Everyone's packing progress synced in real-time
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Members' Progress Section */}
          <View style={styles.membersSection}>
            <Text style={styles.sectionTitle}>Members' Progress</Text>

            <View style={styles.membersList}>
              {members.map((member) => (
                <View key={member.id} style={styles.memberRow}>
                  <View style={styles.avatarCircle}>
                    <Ionicons name="person" size={18} color={Colors.primary} />
                  </View>

                  <View style={styles.memberInfo}>
                    <View style={styles.memberHeader}>
                      <Text style={styles.memberName}>
                        {member.name} {member.isCurrentUser ? '(You)' : ''}
                      </Text>
                      <Text style={styles.memberPercent}>{member.progress}%</Text>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressBarTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${member.progress}%` },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Share Button */}
        <View style={styles.bottomSection}>
          <PrimaryButton
            title="Share Checklist"
            icon={<Ionicons name="share-social-outline" size={18} color={Colors.textInverse} />}
            onPress={() =>
              Alert.alert(
                'Share Checklist',
                'Invite codes and collaborative deep links will be active in Milestone 6.'
              )
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  groupChecklistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 26,
  },
  groupChecklistInfo: {
    flex: 1,
  },
  groupChecklistTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  groupChecklistSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  membersSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  membersList: {
    gap: 18,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  memberPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
  },
  bottomSection: {
    paddingVertical: 14,
  },
});

