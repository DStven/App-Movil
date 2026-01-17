import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { createBackup, restoreBackup } from './utils/backup';

export default function BackupScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateBackup = async () => {
    try {
      setIsLoading(true);
      await createBackup();
      Alert.alert('Éxito', 'Backup creado exitosamente');
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setIsLoading(true);
      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      const backupData = JSON.parse(fileContent);

      Alert.alert(
        'Restaurar Backup',
        '¿Estás seguro? Esto reemplazará todos tus datos actuales.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Restaurar',
            style: 'destructive',
            onPress: async () => {
              try {
                await restoreBackup(backupData);
                Alert.alert('Éxito', 'Backup restaurado exitosamente. Reinicia la app.');
              } catch (error) {
                Alert.alert('Error', (error as Error).message);
              } finally {
                setIsLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo restaurar el backup');
      setIsLoading(false);
    }
  };

  const dynamicStyles = getDynamicStyles(colors);

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, dynamicStyles.title]}>Backup y Restauración</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Información */}
        <View style={[styles.infoCard, dynamicStyles.infoCard]}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text style={[styles.infoText, dynamicStyles.infoText]}>
            Crea un backup de todos tus datos (rutinas, eventos, logros, etc.) para poder restaurarlos más tarde.
          </Text>
        </View>

        {/* Crear Backup */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleCreateBackup}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Ionicons name="download-outline" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Crear Backup</Text>
        </TouchableOpacity>

        {/* Restaurar Backup */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.secondary }]}
          onPress={handleRestoreBackup}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Restaurar Backup</Text>
        </TouchableOpacity>

        {/* Exportar datos */}
        <View style={[styles.section, dynamicStyles.section]}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Exportar Datos</Text>
          <Text style={[styles.sectionDescription, dynamicStyles.sectionDescription]}>
            Exporta tus datos en formato JSON para uso externo o análisis.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const getDynamicStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  infoText: {
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  sectionTitle: {
    color: colors.text,
  },
  sectionDescription: {
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
    paddingTop: 24,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
