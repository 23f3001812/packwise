import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii, Shadows } from '../../constants/theme';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';

export default function StorageScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const sampleContainers = [
    {
      id: '1',
      name: 'Blue Suitcase',
      itemCount: 12,
      icon: 'bag-suitcase',
      iconColor: '#2563EB',
      bgColor: '#EFF6FF',
    },
    {
      id: '2',
      name: 'Laptop Bag',
      itemCount: 4,
      icon: 'bag-personal',
      iconColor: '#1E293B',
      bgColor: '#F1F5F9',
    },
    {
      id: '3',
      name: 'First-Aid Kit',
      itemCount: 6,
      icon: 'medical-bag',
      iconColor: '#DC2626',
      bgColor: '#FEF2F2',
    },
    {
      id: '4',
      name: 'Storage Box',
      itemCount: 3,
      icon: 'package-variant-closed',
      iconColor: '#D97706',
      bgColor: '#FFFBEB',
    },
  ];

  const filteredContainers = sampleContainers.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Storage Manager</Text>
          <Text style={styles.headerSubtitle}>Your Bags & Containers</Text>
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search containers..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Container Items List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {filteredContainers.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.containerCard, Shadows.card]}
              activeOpacity={0.7}
              onPress={() =>
                Alert.alert(
                  item.name,
                  `Contains ${item.itemCount} items. Detailed container management will be active in Milestone 3.`
                )
              }
            >
              <View style={[styles.iconWrapper, { backgroundColor: item.bgColor }]}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={26}
                  color={item.iconColor}
                />
              </View>

              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCount}>{item.itemCount} items</Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Bottom Add Action */}
        <View style={styles.bottomSection}>
          <PrimaryButton
            title="Add Container +"
            onPress={() =>
              Alert.alert(
                'Add Container',
                'Custom container addition & RFID/tag tracking will be integrated in Milestone 3.'
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
    marginBottom: 18,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 18,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  listContent: {
    gap: 12,
    paddingBottom: 20,
  },
  containerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  itemCount: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  bottomSection: {
    paddingVertical: 14,
  },
});

