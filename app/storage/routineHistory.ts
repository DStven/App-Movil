import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'routineHistory';

export type RoutineHistoryEntry = {
  routineId: string;
  routineTitle: string;
  completedAt: number;
  tasksCompleted: number;
  totalTasks: number;
  xpEarned: number;
};

export const addRoutineHistory = async (entry: RoutineHistoryEntry) => {
  const history = await getRoutineHistory();
  history.push(entry);
  // Mantener solo los últimos 1000 registros
  const limitedHistory = history.slice(-1000);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(limitedHistory));
};

export const getRoutineHistory = async (): Promise<RoutineHistoryEntry[]> => {
  try {
    const stored = await AsyncStorage.getItem(HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch {
    return [];
  }
};

export const getHistoryByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<RoutineHistoryEntry[]> => {
  const history = await getRoutineHistory();
  return history.filter(
    entry => entry.completedAt >= startDate.getTime() && entry.completedAt <= endDate.getTime()
  );
};

export const getWeeklyStats = async () => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const weekHistory = await getHistoryByDateRange(startOfWeek, endOfWeek);
  
  return {
    routinesCompleted: weekHistory.length,
    totalXP: weekHistory.reduce((sum, entry) => sum + entry.xpEarned, 0),
    days: Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dayHistory = weekHistory.filter(
        entry => {
          const entryDate = new Date(entry.completedAt);
          return entryDate.toDateString() === date.toDateString();
        }
      );
      return {
        date: date.toDateString(),
        routinesCompleted: dayHistory.length,
        xpEarned: dayHistory.reduce((sum, entry) => sum + entry.xpEarned, 0),
      };
    }),
  };
};

export const getMonthlyStats = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const monthHistory = await getHistoryByDateRange(startOfMonth, endOfMonth);
  
  return {
    routinesCompleted: monthHistory.length,
    totalXP: monthHistory.reduce((sum, entry) => sum + entry.xpEarned, 0),
    averagePerDay: monthHistory.length / now.getDate(),
  };
};

// Export default para evitar que Expo Router lo trate como ruta
export default function RoutineHistoryStorage() {
  return null;
}
