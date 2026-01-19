import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { getMonthlyStats, getWeeklyStats } from './storage/routineHistory';
import { getBestStreak, getCurrentStreak } from './storage/streak';
import { getLevel, getXP } from './storage/userProgress';

export default function StatsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [weeklyStats, setWeeklyStats] = useState<any>(null);
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [level, setLevel] = useState(1);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    const weekly = await getWeeklyStats();
    const monthly = await getMonthlyStats();
    const streak = await getCurrentStreak();
    const best = await getBestStreak();
    const xp = await getXP();
    const userLevel = getLevel(xp);

    setWeeklyStats(weekly);
    setMonthlyStats(monthly);
    setCurrentStreak(streak);
    setBestStreak(best);
    setTotalXP(xp);
    setLevel(userLevel);
  };

  const dynamicStyles = getDynamicStyles(colors);

  const maxRoutines = weeklyStats?.days.reduce((max: number, day: any) => 
    Math.max(max, day.routinesCompleted), 0) || 0;

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, dynamicStyles.title]}>Estadísticas</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Resumen general */}
        <View style={[styles.summaryCard, dynamicStyles.summaryCard]}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Resumen</Text>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryItem, dynamicStyles.summaryItem]}>
              <Ionicons name="flame" size={24} color={colors.warning} />
              <Text style={[styles.summaryValue, dynamicStyles.summaryValue]}>{currentStreak}</Text>
              <Text style={[styles.summaryLabel, dynamicStyles.summaryLabel]}>Racha actual</Text>
            </View>
            <View style={[styles.summaryItem, dynamicStyles.summaryItem]}>
              <Ionicons name="trophy" size={24} color={colors.secondary} />
              <Text style={[styles.summaryValue, dynamicStyles.summaryValue]}>{bestStreak}</Text>
              <Text style={[styles.summaryLabel, dynamicStyles.summaryLabel]}>Mejor racha</Text>
            </View>
            <View style={[styles.summaryItem, dynamicStyles.summaryItem]}>
              <Ionicons name="flash" size={24} color={colors.accent} />
              <Text style={[styles.summaryValue, dynamicStyles.summaryValue]}>{totalXP}</Text>
              <Text style={[styles.summaryLabel, dynamicStyles.summaryLabel]}>XP total</Text>
            </View>
            <View style={[styles.summaryItem, dynamicStyles.summaryItem]}>
              <Ionicons name="star" size={24} color={colors.primary} />
              <Text style={[styles.summaryValue, dynamicStyles.summaryValue]}>Nivel {level}</Text>
              <Text style={[styles.summaryLabel, dynamicStyles.summaryLabel]}>Nivel actual</Text>
            </View>
          </View>
        </View>

        {/* Estadísticas semanales */}
        {weeklyStats && (
          <View style={[styles.statsCard, dynamicStyles.statsCard]}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Esta Semana</Text>
            <View style={styles.weekStats}>
              <View style={styles.weekStatItem}>
                <Text style={[styles.weekStatValue, dynamicStyles.weekStatValue]}>
                  {weeklyStats.routinesCompleted}
                </Text>
                <Text style={[styles.weekStatLabel, dynamicStyles.weekStatLabel]}>
                  Rutinas completadas
                </Text>
              </View>
              <View style={styles.weekStatItem}>
                <Text style={[styles.weekStatValue, dynamicStyles.weekStatValue]}>
                  {weeklyStats.totalXP}
                </Text>
                <Text style={[styles.weekStatLabel, dynamicStyles.weekStatLabel]}>XP ganado</Text>
              </View>
            </View>

            {/* Gráfico de barras simple */}
            <View style={styles.chartContainer}>
              <Text style={[styles.chartTitle, dynamicStyles.chartTitle]}>Actividad diaria</Text>
              <View style={styles.barChart}>
                {weeklyStats.days.map((day: any, index: number) => (
                  <View key={index} style={styles.barColumn}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: maxRoutines > 0 ? `${(day.routinesCompleted / maxRoutines) * 100}%` : '0%',
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                    <Text style={[styles.barLabel, dynamicStyles.barLabel]}>
                      {new Date(day.date).toLocaleDateString('es', { weekday: 'short' })}
                    </Text>
                    <Text style={[styles.barValue, dynamicStyles.barValue]}>
                      {day.routinesCompleted}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Estadísticas mensuales */}
        {monthlyStats && (
          <View style={[styles.statsCard, dynamicStyles.statsCard]}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Este Mes</Text>
            <View style={styles.monthStats}>
              <View style={[styles.monthStatItem, dynamicStyles.monthStatItem]}>
                <Text style={[styles.monthStatValue, dynamicStyles.monthStatValue]}>
                  {monthlyStats.routinesCompleted}
                </Text>
                <Text style={[styles.monthStatLabel, dynamicStyles.monthStatLabel]}>
                  Rutinas completadas
                </Text>
              </View>
              <View style={[styles.monthStatItem, dynamicStyles.monthStatItem]}>
                <Text style={[styles.monthStatValue, dynamicStyles.monthStatValue]}>
                  {monthlyStats.totalXP}
                </Text>
                <Text style={[styles.monthStatLabel, dynamicStyles.monthStatLabel]}>XP ganado</Text>
              </View>
              <View style={[styles.monthStatItem, dynamicStyles.monthStatItem]}>
                <Text style={[styles.monthStatValue, dynamicStyles.monthStatValue]}>
                  {monthlyStats.averagePerDay.toFixed(1)}
                </Text>
                <Text style={[styles.monthStatLabel, dynamicStyles.monthStatLabel]}>
                  Promedio por día
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getDynamicStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  sectionTitle: {
    color: colors.text,
  },
  summaryItem: {
    backgroundColor: colors.surface,
  },
  summaryValue: {
    color: colors.text,
  },
  summaryLabel: {
    color: colors.textSecondary,
  },
  statsCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  weekStatValue: {
    color: colors.text,
  },
  weekStatLabel: {
    color: colors.textSecondary,
  },
  chartTitle: {
    color: colors.text,
  },
  barLabel: {
    color: colors.textSecondary,
  },
  barValue: {
    color: colors.text,
  },
  monthStatItem: {
    backgroundColor: colors.surface,
  },
  monthStatValue: {
    color: colors.text,
  },
  monthStatLabel: {
    color: colors.textSecondary,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryItem: {
    width: '47%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  statsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  weekStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  weekStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  weekStatValue: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 8,
  },
  weekStatLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  chartContainer: {
    marginTop: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '80%',
    minHeight: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  monthStats: {
    flexDirection: 'row',
    gap: 12,
  },
  monthStatItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  monthStatValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  monthStatLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
});
