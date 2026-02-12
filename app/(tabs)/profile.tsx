import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { getBestStreak, getCurrentStreak } from '../storage/streak';
import { getLevel, getProgress, getXP } from '../storage/userProgress';

export default function Profile() {
  const { colors, colorScheme, toggleTheme } = useTheme();
  const router = useRouter();
  const [petName, setPetName] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [petType, setPetType] = useState<string>('chick');
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [totalXP, setTotalXP] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [xpForNextLevel, setXpForNextLevel] = useState<number>(100);
  const [xpProgress, setXpProgress] = useState<number>(0);

  const loadProfileData = async () => {
    const storedPetName = await AsyncStorage.getItem('petName');
    const storedUserName = await AsyncStorage.getItem('userName');
    const storedPetType = await AsyncStorage.getItem('petType');

    if (storedPetName) setPetName(storedPetName);
    if (storedUserName) setUserName(storedUserName);
    if (storedPetType) setPetType(storedPetType);

    // Cargar estadísticas
    const xp = await getXP();
    const userLevel = getLevel(xp);
    const progress = getProgress(xp);
    const xpNeeded = 100 - progress;

    setTotalXP(xp);
    setLevel(userLevel);
    setXpForNextLevel(xpNeeded);
    setXpProgress(progress);

    const streak = await getCurrentStreak();
    const best = await getBestStreak();
    setCurrentStreak(streak);
    setBestStreak(best);
  };

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [])
  );

  const getPetEmoji = () => {
    switch (petType) {
      case 'dog':
        return '🐶';
      case 'cat':
        return '🐱';
      case 'chick':
      default:
        return '🐣';
    }
  };

  const dynamicStyles = getDynamicStyles(colors);

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      <StatusBar barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'} />
      {/* Header estático */}
      <View style={[styles.staticHeader, dynamicStyles.staticHeader]}>
        <Text style={[styles.title, dynamicStyles.title]}>Perfil</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconButton, dynamicStyles.iconButton]}
            onPress={toggleTheme}
          >
            <Ionicons
              name={colorScheme === 'dark' ? 'sunny' : 'moon'}
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, dynamicStyles.iconButton]}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Avatar y nivel estático */}
      <View style={[styles.staticAvatarSection, dynamicStyles.staticAvatarSection]}>
        <View style={[styles.avatarCircle, dynamicStyles.avatarCircle]}>
          <Image
            source={
              petType === 'dog'
                ? require('../../assets/images/pets/dog.png')
                : petType === 'cat'
                  ? require('../../assets/images/pets/cat.png')
                  : require('../../assets/images/pets/pullet.png')
            }
            style={styles.petImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.levelBadge}>
          <Text style={[styles.levelLabel, dynamicStyles.levelLabel]}>Nivel</Text>
          <Text style={[styles.levelNumber, { color: colors.primary }]}>{level}</Text>
        </View>
      </View>

      {/* Barra de progreso XP estática */}
      <View style={[styles.staticProgressSection, dynamicStyles.staticProgressSection]}>
        <View style={styles.xpHeader}>
          <Text style={[styles.xpLabel, dynamicStyles.xpLabel]}>Progreso de XP</Text>
          <Text style={[styles.xpValue, { color: colors.primary }]}>{xpProgress}%</Text>
        </View>
        <View style={[styles.xpBarContainer, dynamicStyles.xpBarContainer]}>
          <View
            style={[
              styles.xpBarFill,
              {
                width: `${xpProgress}%`,
                backgroundColor: colors.primary,
              }
            ]}
          />
        </View>
        <Text style={[styles.xpNext, dynamicStyles.xpNext]}>
          {xpForNextLevel} XP para el siguiente nivel
        </Text>
      </View>

      {/* Área scrollable - Información del usuario y estadísticas */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Información del usuario - nuevo diseño */}
        <View style={styles.infoSection}>
          <View style={[styles.infoCard, dynamicStyles.infoCard]}>
            <View style={styles.infoHeader}>
              <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
              <Text style={[styles.infoCardTitle, dynamicStyles.infoCardTitle]}>Información</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>Tu nombre</Text>
                <Text style={[styles.infoValue, dynamicStyles.infoValue]}>
                  {userName || 'Sin nombre'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>Nombre de la mascota</Text>
                <Text style={[styles.infoValue, dynamicStyles.infoValue]}>
                  {petName || 'Sin nombre'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Estadísticas - diseño grid moderno */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Estadísticas</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, dynamicStyles.statCard]}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.warning + '15' }]}>
                <Ionicons name="flame" size={24} color={colors.warning} />
              </View>
              <Text style={[styles.statNumber, dynamicStyles.statNumber]}>{currentStreak}</Text>
              <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Racha actual</Text>
            </View>

            <View style={[styles.statCard, dynamicStyles.statCard]}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.secondary + '15' }]}>
                <Ionicons name="trophy" size={24} color={colors.secondary} />
              </View>
              <Text style={[styles.statNumber, dynamicStyles.statNumber]}>{bestStreak}</Text>
              <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Mejor racha</Text>
            </View>

            <View style={[styles.statCard, dynamicStyles.statCard]}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.accent + '15' }]}>
                <Ionicons name="flash" size={24} color={colors.accent} />
              </View>
              <Text style={[styles.statNumber, dynamicStyles.statNumber]}>{totalXP}</Text>
              <Text style={[styles.statLabel, dynamicStyles.statLabel]}>XP total</Text>
            </View>

            {/* <TouchableOpacity
              style={[styles.statCard, dynamicStyles.statCard]}
              onPress={() => router.push('/calendar')}
              activeOpacity={0.7}
            >
              <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="calendar-outline" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Calendario</Text>
            </TouchableOpacity> */}

            <TouchableOpacity
              style={[styles.statCard, dynamicStyles.statCard]}
              onPress={() => router.push('/stats')}
              activeOpacity={0.7}
            >
              <View style={[styles.statIconContainer, { backgroundColor: colors.accent + '15' }]}>
                <Ionicons name="stats-chart-outline" size={24} color={colors.accent} />
              </View>
              <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Estadísticas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, dynamicStyles.statCard]}
              onPress={() => router.push('/achievements')}
              activeOpacity={0.7}
            >
              <View style={[styles.statIconContainer, { backgroundColor: colors.secondary + '15' }]}>
                <Ionicons name="trophy-outline" size={24} color={colors.secondary} />
              </View>
              <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Logros</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, dynamicStyles.statCard]}
              onPress={() => router.push('/notes')}
              activeOpacity={0.7}
            >
              <View style={[styles.statIconContainer, { backgroundColor: colors.accent + '15' }]}>
                <Ionicons name="document-text-outline" size={24} color={colors.accent} />
              </View>
              <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Notas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Backup y Restauración */}
        <View style={styles.backupSection}>
          <TouchableOpacity
            style={[styles.backupButton, dynamicStyles.backupButton]}
            onPress={() => router.push('/backup')}
            activeOpacity={0.7}
          >
            <Ionicons name="cloud-download-outline" size={20} color={colors.primary} />
            <Text style={[styles.backupButtonText, { color: colors.primary }]}>
              Backup y Restauración
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getDynamicStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  staticHeader: {
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.text,
  },
  iconButton: {
    backgroundColor: colors.surface,
  },
  staticAvatarSection: {
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
  },
  avatarCircle: {
    backgroundColor: colors.surface,
  },
  levelLabel: {
    color: colors.textSecondary,
  },
  staticProgressSection: {
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
  },
  xpLabel: {
    color: colors.textSecondary,
  },
  xpBarContainer: {
    backgroundColor: colors.borderLight,
  },
  xpNext: {
    color: colors.textTertiary,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  infoCardTitle: {
    color: colors.text,
  },
  infoLabel: {
    color: colors.textSecondary,
  },
  infoValue: {
    color: colors.text,
  },
  sectionTitle: {
    color: colors.text,
  },
  statCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  statNumber: {
    color: colors.text,
  },
  statLabel: {
    color: colors.textSecondary,
  },
  backupButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  backupButtonText: {
    color: colors.text,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  staticHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staticAvatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  petAvatar: {
    fontSize: 56,
  },
  petImage: {
    width: 80,
    height: 80,
  },

  levelBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  staticProgressSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  xpLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  xpValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  xpBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  xpNext: {
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  infoSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    marginBottom: 24,
  },
  infoCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  infoRow: {
    marginBottom: 16,
  },
  infoItem: {
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsSection: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '30%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  backupSection: {
    paddingHorizontal: 24,
    marginTop: 8,
  },
  backupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  backupButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
});
