import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '../../constants/colors';

function getInitials(name = '') {
  if (!name) return 'PW';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ['#1E3A8A', '#0D9488', '#7C3AED', '#C2410C', '#0369A1'];

export const CollaboratorAvatarGroup = ({ members = [], maxVisible = 3, size = 28 }) => {
  const visible = members.slice(0, maxVisible);
  const extraCount = members.length - maxVisible;

  return (
    <View style={styles.container}>
      {visible.map((member, index) => {
        const bg = AVATAR_COLORS[index % AVATAR_COLORS.length];
        const initials = getInitials(member.displayName || member.name || member.email);

        return (
          <View
            key={member.userId || member.id || index}
            style={[
              styles.avatar,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: bg,
                marginLeft: index === 0 ? 0 : -8,
                zIndex: maxVisible - index,
              },
            ]}
          >
            <Text style={[styles.initialsText, { fontSize: size * 0.4 }]}>{initials}</Text>
          </View>
        );
      })}

      {extraCount > 0 && (
        <View
          style={[
            styles.avatar,
            styles.extraAvatar,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -8,
              zIndex: 0,
            },
          ]}
        >
          <Text style={[styles.extraText, { fontSize: size * 0.36 }]}>+{extraCount}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  initialsText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  extraAvatar: {
    backgroundColor: '#E5E7EB',
  },
  extraText: {
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});

export default CollaboratorAvatarGroup;

