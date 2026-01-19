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
import { Achievement, getAchievements } from './storage/achievements';

export default function AchievementsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadAchievements();
    }, [])
  );

  const loadAchievements = async () => {
    const allAchievements = await getAchievements();
    setAchievements(allAchievements);
  };

  const dynamicStyles = getDynamicStyles(colors);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, dynamicStyles.title]}>Logros</Text>
        <View style={styles.backButton} />
      </View>

      {/* Progreso */}
      <View style={styles.progressSection}>
        <Text style={[styles.progressText, dynamicStyles.progressText]}>
          {unlockedCount} de {totalCount} logros desbloqueados
        </Text>
        <View style={[styles.progressBar, dynamicStyles.progressBar]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(unlockedCount / totalCount) * 100}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* Lista de logros */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {achievements.map((achievement) => (
          <View
            key={achievement.id}
            style={[
              styles.achievementCard,
              dynamicStyles.achievementCard,
              !achievement.unlocked && styles.achievementLocked,
            ]}
          >
            <View style={[styles.achievementIcon, dynamicStyles.achievementIcon]}>
              <Text style={styles.emoji}>{achievement.icon}</Text>
              {!achievement.unlocked && (
                <View style={[styles.lockOverlay, { backgroundColor: colors.overlay }]}>
                  <Ionicons name="lock-closed" size={24} color={colors.textSecondary} />
                </View>
              )}
            </View>
            <View style={styles.achievementContent}>
              <Text style={[styles.achievementTitle, dynamicStyles.achievementTitle]}>
                {achievement.title}
              </Text>
              <Text style={[styles.achievementDescription, dynamicStyles.achievementDescription]}>
                {achievement.description}
              </Text>
              {achievement.unlocked && achievement.unlockedAt && (
                <Text style={[styles.unlockedDate, dynamicStyles.unlockedDate]}>
                  Desbloqueado: {new Date(achievement.unlockedAt).toLocaleDateString()}
                </Text>
              )}
            </View>
            {achievement.unlocked && (
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            )}
          </View>
        ))}
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
  progressText: {
    color: colors.textSecondary,
  },
  progressBar: {
    backgroundColor: colors.borderLight,
  },
  achievementCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  achievementIcon: {
    backgroundColor: colors.surface,
  },
  achievementTitle: {
    color: colors.text,
  },
  achievementDescription: {
    color: colors.textSecondary,
  },
  unlockedDate: {
    color: colors.textTertiary,
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
  progressSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 12,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  emoji: {
    fontSize: 32,
  },
  lockOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  unlockedDate: {
    fontSize: 12,
    marginTop: 4,
  },
  viewModeButton: {
    // Estilos para el botón de vista (ajusta según tus necesidades)
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    
  },
});
