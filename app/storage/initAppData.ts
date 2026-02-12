import AsyncStorage from '@react-native-async-storage/async-storage';

export type Task = {
  id: string;
  title: string;
  points: number;
  done: boolean;
};

export type Routine = {
  id: string;
  title: string;
  tasks: Task[];
  completed?: boolean;
  createdAt?: number;
  lastCompletedDate?: number;
};

export const DEFAULT_ROUTINE: Routine = {
  id: 'default',
  title: 'Mega rutina',
  tasks: [
    { id: 'wake', title: 'Levantarse de la cama', points: 10, done: false },
    { id: 'wash', title: 'Lavarse la cara', points: 10, done: false },
    { id: 'breakfast', title: 'Desayunar', points: 10, done: false },
    { id: 'dress', title: 'Vestirse', points: 10, done: false },
    { id: 'work', title: 'Trabajar', points: 10, done: false },
  ],
  createdAt: Date.now(),
};

export async function initializeDefaultData() {
  const routines = await AsyncStorage.getItem('routines');

  if (!routines) {
    await AsyncStorage.setItem(
      'routines',
      JSON.stringify([DEFAULT_ROUTINE])
    );
    await AsyncStorage.setItem('activeRoutineId', DEFAULT_ROUTINE.id);
  }
}

// Export default para evitar el warning de expo-router
export default function InitAppData() {
  return null;
}
