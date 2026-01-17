import { Ionicons } from '@expo/vector-icons';
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
import { ROUTINE_TEMPLATES, createRoutineFromTemplate } from './storage/routineTemplates';

export default function RoutineTemplatesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUseTemplate = async (templateId: string) => {
    try {
      setLoading(templateId);
      const routine = await createRoutineFromTemplate(templateId);
      Alert.alert('Éxito', 'Rutina creada desde plantilla', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setLoading(null);
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
        <Text style={[styles.title, dynamicStyles.title]}>Plantillas</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.description, dynamicStyles.description]}>
          Elige una plantilla para crear una rutina rápidamente
        </Text>

        {ROUTINE_TEMPLATES.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={[styles.templateCard, dynamicStyles.templateCard]}
            onPress={() => handleUseTemplate(template.id)}
            disabled={loading === template.id}
            activeOpacity={0.7}
          >
            <View style={styles.templateHeader}>
              <Text style={styles.templateIcon}>{template.icon}</Text>
              <View style={styles.templateInfo}>
                <Text style={[styles.templateName, dynamicStyles.templateName]}>
                  {template.name}
                </Text>
                <Text style={[styles.templateDescription, dynamicStyles.templateDescription]}>
                  {template.description}
                </Text>
              </View>
            </View>

            <View style={styles.templateTasks}>
              {template.tasks.map((task, index) => (
                <View key={index} style={styles.taskItem}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.taskText, dynamicStyles.taskText]}>{task.title}</Text>
                  <Text style={[styles.taskPoints, dynamicStyles.taskPoints]}>{task.points} XP</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.useButton, { backgroundColor: colors.primary }]}
              onPress={() => handleUseTemplate(template.id)}
              disabled={loading === template.id}
            >
              <Text style={styles.useButtonText}>
                {loading === template.id ? 'Creando...' : 'Usar plantilla'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
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
  description: {
    color: colors.textSecondary,
  },
  templateCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  templateName: {
    color: colors.text,
  },
  templateDescription: {
    color: colors.textSecondary,
  },
  taskText: {
    color: colors.text,
  },
  taskPoints: {
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
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  templateCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  templateIcon: {
    fontSize: 40,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
  },
  templateTasks: {
    marginBottom: 16,
    gap: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskText: {
    flex: 1,
    fontSize: 14,
  },
  taskPoints: {
    fontSize: 12,
    fontWeight: '600',
  },
  useButton: {
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  useButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
