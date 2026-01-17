import AsyncStorage from '@react-native-async-storage/async-storage';

const ACHIEVEMENTS_KEY = 'achievements';

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
};

export const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_routine',
    title: 'Primer Paso',
    description: 'Completa tu primera rutina',
    icon: '🎯',
    unlocked: false,
  },
  {
    id: 'streak_7',
    title: 'Semana Perfecta',
    description: 'Mantén una racha de 7 días',
    icon: '🔥',
    unlocked: false,
  },
  {
    id: 'streak_30',
    title: 'Mes de Éxito',
    description: 'Mantén una racha de 30 días',
    icon: '⭐',
    unlocked: false,
  },
  {
    id: 'xp_1000',
    title: 'Experto',
    description: 'Alcanza 1000 XP',
    icon: '💎',
    unlocked: false,
  },
  {
    id: 'xp_5000',
    title: 'Maestro',
    description: 'Alcanza 5000 XP',
    icon: '👑',
    unlocked: false,
  },
  {
    id: 'level_10',
    title: 'Nivel Alto',
    description: 'Alcanza el nivel 10',
    icon: '🚀',
    unlocked: false,
  },
  {
    id: 'routines_10',
    title: 'Productivo',
    description: 'Completa 10 rutinas',
    icon: '📚',
    unlocked: false,
  },
  {
    id: 'routines_50',
    title: 'Súper Productivo',
    description: 'Completa 50 rutinas',
    icon: '🏆',
    unlocked: false,
  },
];

export const getAchievements = async (): Promise<Achievement[]> => {
  try {
    const stored = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return ALL_ACHIEVEMENTS.map(a => ({ ...a }));
  } catch {
    return ALL_ACHIEVEMENTS.map(a => ({ ...a }));
  }
};

export const saveAchievements = async (achievements: Achievement[]) => {
  await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
};

export const unlockAchievement = async (achievementId: string): Promise<Achievement | null> => {
  const achievements = await getAchievements();
  const achievement = achievements.find(a => a.id === achievementId);
  
  if (achievement && !achievement.unlocked) {
    achievement.unlocked = true;
    achievement.unlockedAt = Date.now();
    await saveAchievements(achievements);
    return achievement;
  }
  
  return null;
};

export const checkAchievements = async (
  currentStreak: number,
  totalXP: number,
  level: number,
  completedRoutines: number
) => {
  const achievements = await getAchievements();
  const unlocked: Achievement[] = [];

  // Verificar logros de racha
  if (currentStreak >= 7) {
    const achievement = await unlockAchievement('streak_7');
    if (achievement) unlocked.push(achievement);
  }
  if (currentStreak >= 30) {
    const achievement = await unlockAchievement('streak_30');
    if (achievement) unlocked.push(achievement);
  }

  // Verificar logros de XP
  if (totalXP >= 1000) {
    const achievement = await unlockAchievement('xp_1000');
    if (achievement) unlocked.push(achievement);
  }
  if (totalXP >= 5000) {
    const achievement = await unlockAchievement('xp_5000');
    if (achievement) unlocked.push(achievement);
  }

  // Verificar logros de nivel
  if (level >= 10) {
    const achievement = await unlockAchievement('level_10');
    if (achievement) unlocked.push(achievement);
  }

  // Verificar logros de rutinas completadas
  if (completedRoutines >= 10) {
    const achievement = await unlockAchievement('routines_10');
    if (achievement) unlocked.push(achievement);
  }
  if (completedRoutines >= 50) {
    const achievement = await unlockAchievement('routines_50');
    if (achievement) unlocked.push(achievement);
  }

  return unlocked;
};

// Export default para evitar que Expo Router lo trate como ruta
export default function AchievementsStorage() {
  return null;
}
