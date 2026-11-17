import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii, Shadows } from '../../constants/theme';

/**
 * Returns an appropriate Ionicons name based on OpenWeather condition or icon code.
 */
function getWeatherIcon(condition = '', icon = '') {
  const cond = condition.toLowerCase();
  if (cond.includes('rain') || cond.includes('drizzle')) return 'rainy-outline';
  if (cond.includes('thunder') || cond.includes('storm')) return 'thunderstorm-outline';
  if (cond.includes('snow')) return 'snow-outline';
  if (cond.includes('cloud')) return 'partly-sunny-outline';
  if (cond.includes('clear')) return 'sunny-outline';
  if (cond.includes('wind')) return 'flag-outline';
  return 'cloud-outline';
}

export const WeatherSummaryCard = ({ weather, style = {} }) => {
  if (!weather) return null;

  const isAvailable = Boolean(weather.available);

  if (!isAvailable) {
    return (
      <View style={[styles.card, styles.unavailableCard, style]}>
        <View style={styles.headerRow}>
          <View style={styles.iconBadgeInactive}>
            <Ionicons name="cloud-offline-outline" size={20} color={Colors.textSecondary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.statusTitle}>Weather Forecast Unavailable</Text>
            <Text style={styles.destinationSubtitle}>{weather.destination || 'Destination'}</Text>
          </View>
        </View>

        <Text style={styles.unavailableReason}>
          {weather.reason ||
            'Weather forecast is not yet available for these travel dates. Recommendations are based on your destination, activities and trip details rather than a verified forecast.'}
        </Text>
      </View>
    );
  }

  const { destination, dailyForecast = [], summary, forecastCoverage, isPartialCoverage } = weather;
  const dominantCond = dailyForecast[0]?.condition || 'Clear';
  const dominantIcon = dailyForecast[0]?.icon || '01d';

  // Overall temperatures
  const minTemp = dailyForecast.length ? Math.min(...dailyForecast.map((d) => d.minTemperature)) : null;
  const maxTemp = dailyForecast.length ? Math.max(...dailyForecast.map((d) => d.maxTemperature)) : null;
  const maxRain = dailyForecast.length ? Math.max(...dailyForecast.map((d) => d.rainProbability)) : 0;

  return (
    <View style={[styles.card, style]}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.iconBadgeActive}>
          <Ionicons
            name={getWeatherIcon(dominantCond, dominantIcon)}
            size={22}
            color={Colors.primary}
          />
        </View>
        <View style={styles.headerText}>
          <View style={styles.verifiedRow}>
            <Text style={styles.statusTitleActive}>Live 5-Day Forecast</Text>
            <View style={styles.livePill}>
              <Text style={styles.livePillText}>Verified</Text>
            </View>
          </View>
          <Text style={styles.destinationSubtitle}>{destination}</Text>
        </View>
      </View>

      {/* Main Temperature and Metric Row */}
      <View style={styles.metricsRow}>
        {minTemp !== null && maxTemp !== null && (
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {minTemp}° – {maxTemp}°C
            </Text>
            <Text style={styles.metricLabel}>Expected Range</Text>
          </View>
        )}

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <View style={styles.rainRow}>
            <Ionicons
              name="water-outline"
              size={14}
              color={maxRain >= 40 ? '#2563EB' : Colors.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.metricValue, maxRain >= 40 && styles.rainHigh]}>
              {maxRain}%
            </Text>
          </View>
          <Text style={styles.metricLabel}>Max Rain Chance</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{dominantCond}</Text>
          <Text style={styles.metricLabel}>Dominant Sky</Text>
        </View>
      </View>

      {/* Narrative Summary */}
      {summary ? <Text style={styles.summaryText}>{summary}</Text> : null}

      {/* Coverage Indicator */}
      {forecastCoverage && (
        <View style={styles.coverageFooter}>
          <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} style={{ marginRight: 4 }} />
          <Text style={styles.coverageText}>
            Covering {forecastCoverage.startDate} to {forecastCoverage.endDate}
            {isPartialCoverage ? ' (Partial window)' : ''}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Shadows.sm,
  },
  unavailableCard: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E5E7EB',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBadgeActive: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBadgeInactive: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusTitleActive: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  livePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  livePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
    textTransform: 'uppercase',
  },
  destinationSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  unavailableReason: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: Radii.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rainHigh: {
    color: '#2563EB',
  },
  summaryText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 19,
    marginBottom: 10,
  },
  coverageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  coverageText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});

export default WeatherSummaryCard;

