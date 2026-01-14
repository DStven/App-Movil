import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getCurrentStreak, getBestStreak } from '../../storage/streak';
import { getXP, getLevel, getProgress } from '../../storage/userProgress';

export default function Profile() {
  const [petName, setPetName] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [petType, setPetType] = useState<string>('chick');
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [totalXP, setTotalXP] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [xpForNextLevel, setXpForNextLevel] = useState<number>(100);

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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Avatar y Nivel */}
      <View style={styles.avatarSection}>
        <Text style={styles.petAvatar}>{getPetEmoji()}</Text>
        <Text style={styles.levelText}>Nivel {level}</Text>
      </View>

      {/* Información del perfil */}
      <View style={styles.profileCard}>
        <View style={styles.profileRow}>
          <Ionicons name="star" size={20} color="#ffd700" />
          <Text style={styles.profileText}>
            Nombre del pollo: {petName || 'Sin nombre'}
          </Text>
        </View>

        <View style={styles.profileRow}>
          <Ionicons name="person" size={20} color="#4fc3f7" />
          <Text style={styles.profileText}>
            Tu nombre: {userName || 'Sin nombre'}
          </Text>
        </View>

        <View style={styles.profileRow}>
          <Ionicons name="flash" size={20} color="#ffd700" />
          <Text style={styles.profileText}>
            XP para siguiente evolución: {xpForNextLevel}
          </Text>
        </View>
      </View>

      {/* Grid de estadísticas */}
      <View style={styles.statsGrid}>
        {/* Racha actual */}
        <View style={styles.statCard}>
          <Ionicons name="flame" size={32} color="#fb923c" />
          <Text style={styles.statNumber}>{currentStreak}</Text>
          <Text style={styles.statLabel}>Racha actual</Text>
        </View>

        {/* XP totales */}
        <View style={styles.statCard}>
          <Ionicons name="flash" size={32} color="#ffd700" />
          <Text style={styles.statNumber}>{totalXP}</Text>
          <Text style={styles.statLabel}>XP totales</Text>
        </View>

        {/* Mejor racha */}
        <View style={styles.statCard}>
          <Ionicons name="trophy" size={32} color="#fb923c" />
          <Text style={styles.statNumber}>{bestStreak}</Text>
          <Text style={styles.statLabel}>Mejor racha</Text>
        </View>

        {/* Calendario */}
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={32} color="#fb923c" />
          <Text style={styles.statLabel}>Calendario</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  settingsButton: {
    padding: 4,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  petAvatar: {
    fontSize: 100,
    marginBottom: 8,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  profileCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#fb923c',
    backgroundColor: '#fff',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  profileText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  statCard: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#fb923c',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});
