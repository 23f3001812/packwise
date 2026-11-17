import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii, Shadows } from '../../constants/theme';
import { CustomInput } from '../forms/CustomInput';
import { PrimaryButton } from '../buttons/PrimaryButton';
import { SecondaryButton } from '../buttons/SecondaryButton';

export const InviteMemberModal = ({
  visible,
  onClose,
  onInvite,
  loading = false
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [error, setError] = useState('');

  const validate = () => {
    if (!email.trim()) {
      setError('Email address is required.');
      return false;
    }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email.trim().toLowerCase())) {
      setError('Please enter a valid email address.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSend = async () => {
    if (!validate()) return;
    try {
      await onInvite(email.trim().toLowerCase(), role);
      setEmail('');
      setRole('editor');
      setError('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to send invitation.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerIconCircle}>
              <Ionicons name="person-add-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Invite Collaborator</Text>
              <Text style={styles.subtitle}>Collaborate on this packing checklist</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Email Input */}
          <CustomInput
            label="User Email Address *"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError('');
            }}
            placeholder="colleague@example.com"
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            error={error}
          />

          {/* Role Selection */}
          <View style={styles.roleSection}>
            <Text style={styles.roleSectionLabel}>Assign Permission Role</Text>

            {/* Editor Role Option */}
            <TouchableOpacity
              onPress={() => setRole('editor')}
              style={[styles.roleOption, role === 'editor' && styles.roleOptionSelected]}
              activeOpacity={0.7}
            >
              <View style={[styles.radioCircle, role === 'editor' && styles.radioCircleActive]}>
                {role === 'editor' && <View style={styles.radioDot} />}
              </View>
              <View style={styles.roleTextContainer}>
                <View style={styles.roleTitleRow}>
                  <Text style={styles.roleName}>Editor</Text>
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>Full Packing Access</Text>
                  </View>
                </View>
                <Text style={styles.roleDesc}>
                  Can add, edit, and mark packing items as packed/unpacked.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Viewer Role Option */}
            <TouchableOpacity
              onPress={() => setRole('viewer')}
              style={[styles.roleOption, role === 'viewer' && styles.roleOptionSelected]}
              activeOpacity={0.7}
            >
              <View style={[styles.radioCircle, role === 'viewer' && styles.radioCircleActive]}>
                {role === 'viewer' && <View style={styles.radioDot} />}
              </View>
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleName}>Viewer</Text>
                <Text style={styles.roleDesc}>
                  Read-only view of items and overall packing progress.
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Buttons */}
          <View style={styles.actionsRow}>
            <SecondaryButton
              title="Cancel"
              onPress={onClose}
              style={styles.cancelBtn}
            />
            <PrimaryButton
              title="Send Invite"
              onPress={handleSend}
              loading={loading}
              disabled={loading}
              style={styles.sendBtn}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    padding: 24,
    width: '100%',
    maxWidth: 440,
    ...Shadows.lg
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  headerIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  headerText: {
    flex: 1
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2
  },
  closeBtn: {
    padding: 6
  },
  roleSection: {
    marginVertical: 14
  },
  roleSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 10
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  roleOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F0F9FF'
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 12
  },
  radioCircleActive: {
    borderColor: Colors.primary
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: Colors.primary
  },
  roleTextContainer: {
    flex: 1
  },
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3
  },
  roleName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  recommendedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: Radii.full
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#166534',
    textTransform: 'uppercase'
  },
  roleDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10
  },
  cancelBtn: {
    flex: 1
  },
  sendBtn: {
    flex: 1.4
  }
});

export default InviteMemberModal;

