import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_KEY = 'CURRENT_STREAK';
const BEST_STREAK_KEY = 'BEST_STREAK';
const LAST_COMPLETION_DATE_KEY = 'LAST_COMPLETION_DATE';

// Obtener la fecha de hoy en formato YYYY-MM-DD
function getTodayDate(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

// Obtener la fecha de ayer
function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
}

// Verificar si todas las rutinas del día están completadas
export async function checkAllRoutinesCompleted(): Promise<boolean> {
  const stored = await AsyncStorage.getItem('routines');
  if (!stored) return false;

  const routines = JSON.parse(stored);
  if (routines.length === 0) return false;

  // Verificar que todas las rutinas estén completadas
  return routines.every((r: any) => r.completed === true);
}

// Actualizar la racha cuando se completa una rutina
export async function updateStreak(): Promise<{ current: number; best: number }> {
  const allCompleted = await checkAllRoutinesCompleted();
  
  if (!allCompleted) {
    // Si no todas están completadas, no hacer nada
    return {
      current: await getCurrentStreak(),
      best: await getBestStreak(),
    };
  }

  const today = getTodayDate();
  const lastDate = await AsyncStorage.getItem(LAST_COMPLETION_DATE_KEY);
  const currentStreak = await getCurrentStreak();

  if (lastDate === today) {
    // Ya se actualizó hoy, no hacer nada
    return {
      current: currentStreak,
      best: await getBestStreak(),
    };
  }

  const yesterday = getYesterdayDate();

  if (lastDate === yesterday) {
    // Día consecutivo, incrementar racha
    const newStreak = currentStreak + 1;
    await AsyncStorage.setItem(STREAK_KEY, newStreak.toString());
    await AsyncStorage.setItem(LAST_COMPLETION_DATE_KEY, today);

    // Actualizar mejor racha si es necesario
    const bestStreak = await getBestStreak();
    if (newStreak > bestStreak) {
      await AsyncStorage.setItem(BEST_STREAK_KEY, newStreak.toString());
      return { current: newStreak, best: newStreak };
    }

    return { current: newStreak, best: bestStreak };
  } else if (!lastDate) {
    // Primera vez que completa
    await AsyncStorage.setItem(STREAK_KEY, '1');
    await AsyncStorage.setItem(LAST_COMPLETION_DATE_KEY, today);
    return { current: 1, best: 1 };
  } else {
    // No es consecutivo, resetear racha
    await AsyncStorage.setItem(STREAK_KEY, '1');
    await AsyncStorage.setItem(LAST_COMPLETION_DATE_KEY, today);
    return { current: 1, best: await getBestStreak() };
  }
}

// Verificar y resetear racha si es necesario (al iniciar la app o cambiar de día)
export async function checkAndResetStreakIfNeeded(): Promise<void> {
  const today = getTodayDate();
  const yesterday = getYesterdayDate();
  const lastDate = await AsyncStorage.getItem(LAST_COMPLETION_DATE_KEY);

  if (!lastDate) return;

  // Si la última fecha de completado es ayer o antes (pero no hoy)
  if (lastDate !== today) {
    // Verificar si completó todas las rutinas ayer
    // Si la última fecha es ayer, significa que completó todas ayer
    // Si la última fecha es antes de ayer, significa que no completó todas ayer
    if (lastDate !== yesterday) {
      // No completó todas las rutinas ayer (o antes), resetear racha
      await AsyncStorage.setItem(STREAK_KEY, '0');
    }
    // Si lastDate === yesterday, mantiene la racha porque completó todas ayer
  }
}

export async function getCurrentStreak(): Promise<number> {
  const value = await AsyncStorage.getItem(STREAK_KEY);
  return value ? parseInt(value, 10) : 0;
}

export async function getBestStreak(): Promise<number> {
  const value = await AsyncStorage.getItem(BEST_STREAK_KEY);
  return value ? parseInt(value, 10) : 0;
}

// Export default para evitar que Expo Router lo trate como ruta
export default function StreakStorage() {
  return null;
}
