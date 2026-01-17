import AsyncStorage from '@react-native-async-storage/async-storage';

const XP_KEY = 'USER_XP';

export async function getXP(): Promise<number> {
  const value = await AsyncStorage.getItem(XP_KEY);
  return value ? Number(value) : 0;
}

export async function addXP(amount: number) {
  const currentXP = await getXP();
  const newXP = currentXP + amount;
  await AsyncStorage.setItem(XP_KEY, newXP.toString());
  return newXP;
}

export function getLevel(xp: number) {
  return Math.floor(xp / 100) + 1;
}

export function getProgress(xp: number) {
  return xp % 100;
}

// Export default para evitar que Expo Router lo trate como ruta
export default function UserProgressStorage() {
  return null;
}