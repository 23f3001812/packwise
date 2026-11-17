import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii } from '../../constants/theme';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';

export default function OnboardingScreen() {
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: 'Smarter Packing\nfor a Worry-Free Trip',
      subtitle: 'AI-powered checklists, weather suggestions and more.',
      icon: 'bag-suitcase',
    },
    {
      title: 'Weather-Aware\nRecommendations',
      subtitle: 'Automatically pack essentials based on real-time destination weather.',
      icon: 'weather-partly-cloudy',
    },
    {
      title: 'Smart Storage &\nLuggage Tracking',
      subtitle: 'Organize containers, bags, and items so you never misplace anything.',
      icon: 'cube-outline',
    },
    {
      title: 'Real-Time Group\nCollaboration',
      subtitle: 'Coordinate checklists with friends and family seamlessly.',
      icon: 'account-group-outline',
    },
  ];

  const currentSlide = slides[activeSlide];

  const handleNext = () => {
    if (activeSlide < slides.length - 1) {
      setActiveSlide(activeSlide + 1);
    } else {
      router.push('/(auth)/register');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Space / Skip */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Central Visual Graphic */}
        <View style={styles.illustrationSection}>
          <View style={styles.illustrationCircle}>
            <View style={styles.orbitingPlane}>
              <Ionicons name="airplane" size={26} color={Colors.primary} />
            </View>
            <View style={styles.orbitingPin}>
              <Ionicons name="location" size={22} color="#F59E0B" />
            </View>
            <MaterialCommunityIcons
              name={currentSlide.icon}
              size={108}
              color="#3B82F6"
            />
          </View>
        </View>

        {/* Text Information */}
        <View style={styles.textSection}>
          <Text style={styles.title}>{currentSlide.title}</Text>
          <Text style={styles.subtitle}>{currentSlide.subtitle}</Text>

          {/* Dots Indicator */}
          <View style={styles.dotsContainer}>
            {slides.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setActiveSlide(index)}
                style={[
                  styles.dot,
                  activeSlide === index ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Bottom Action Buttons */}
        <View style={styles.actionsSection}>
          <PrimaryButton
            title={activeSlide === slides.length - 1 ? 'Get Started' : 'Get Started →'}
            onPress={handleNext}
            style={styles.getStartedButton}
          />

          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            style={styles.signInButton}
            activeOpacity={0.7}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  illustrationSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  illustrationCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#F0F4FA',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  orbitingPlane: {
    position: 'absolute',
    top: 20,
    right: 18,
    transform: [{ rotate: '35deg' }],
  },
  orbitingPin: {
    position: 'absolute',
    bottom: 30,
    left: 20,
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 26,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#D1D5DB',
  },
  actionsSection: {
    width: '100%',
    paddingTop: 10,
  },
  getStartedButton: {
    marginBottom: 12,
  },
  signInButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  signInText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});

