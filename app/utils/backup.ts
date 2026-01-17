import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export type BackupData = {
  routines: any[];
  petType: string | null;
  petName: string | null;
  userName: string | null;
  activeRoutineId: string | null;
  calendarEvents: any[];
  achievements: any[];
  routineHistory: any[];
  timestamp: number;
  version: string;
};

export const createBackup = async (): Promise<string> => {
  try {
    const routines = await AsyncStorage.getItem('routines');
    const petType = await AsyncStorage.getItem('petType');
    const petName = await AsyncStorage.getItem('petName');
    const userName = await AsyncStorage.getItem('userName');
    const activeRoutineId = await AsyncStorage.getItem('activeRoutineId');
    const calendarEvents = await AsyncStorage.getItem('calendarEvents');
    const achievements = await AsyncStorage.getItem('achievements');
    const routineHistory = await AsyncStorage.getItem('routineHistory');

    const backupData: BackupData = {
      routines: routines ? JSON.parse(routines) : [],
      petType,
      petName,
      userName,
      activeRoutineId,
      calendarEvents: calendarEvents ? JSON.parse(calendarEvents) : [],
      achievements: achievements ? JSON.parse(achievements) : [],
      routineHistory: routineHistory ? JSON.parse(routineHistory) : [],
      timestamp: Date.now(),
      version: '1.0.0',
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const fileName = `rutina_backup_${Date.now()}.json`;
    
    if (Platform.OS === 'web') {
      // Para web, descargar el archivo
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      return fileName;
    }

    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, jsonString);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    }

    return fileUri;
  } catch (error) {
    throw new Error('Error al crear el backup: ' + (error as Error).message);
  }
};

export const restoreBackup = async (backupData: BackupData): Promise<void> => {
  try {
    if (backupData.routines) {
      await AsyncStorage.setItem('routines', JSON.stringify(backupData.routines));
    }
    if (backupData.petType) {
      await AsyncStorage.setItem('petType', backupData.petType);
    }
    if (backupData.petName) {
      await AsyncStorage.setItem('petName', backupData.petName);
    }
    if (backupData.userName) {
      await AsyncStorage.setItem('userName', backupData.userName);
    }
    if (backupData.activeRoutineId) {
      await AsyncStorage.setItem('activeRoutineId', backupData.activeRoutineId);
    }
    if (backupData.calendarEvents) {
      await AsyncStorage.setItem('calendarEvents', JSON.stringify(backupData.calendarEvents));
    }
    if (backupData.achievements) {
      await AsyncStorage.setItem('achievements', JSON.stringify(backupData.achievements));
    }
    if (backupData.routineHistory) {
      await AsyncStorage.setItem('routineHistory', JSON.stringify(backupData.routineHistory));
    }
  } catch (error) {
    throw new Error('Error al restaurar el backup: ' + (error as Error).message);
  }
};

// Export default para evitar que Expo Router lo trate como ruta
export default function BackupUtils() {
  return null;
}
