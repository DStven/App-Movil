import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { ROUTINE_TEMPLATES, createRoutineFromTemplate } from './storage/routineTemplates';

type ExpandedTemplate = {
  id: string;
  expanded: boolean;
};

export default function RoutineTemplatesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [expandedTemplates, setExpandedTemplates] = useState<ExpandedTemplate[]>(
    ROUTINE_TEMPLATES.map(t => ({ id: t.id, expanded: false }))
  );
  const [customizingTemplate, setCustomizingTemplate] = useState<string | null>(null);
  const [customTasks, setCustomTasks] = useState<Record<string, Array<{ title: string; points: number }>>>({});

  const toggleTemplateExpand = useCallback((templateId: string) => {
    setExpandedTemplates(prev =>
      prev.map(t =>
        t.id === templateId ? { ...t, expanded: !t.expanded } : t
      )
    );
  }, []);

  const handleUseTemplate = async (templateId: string) => {
    try {
      setLoading(templateId);
      await createRoutineFromTemplate(templateId);
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

  const handleCustomizeTemplate = (templateId: string) => {
    const template = ROUTINE_TEMPLATES.find(t => t.id === templateId);
    if (template && !customTasks[templateId]) {
      setCustomTasks(prev => ({
        ...prev,
        [templateId]: template.tasks,
      }));
    }
    setCustomizingTemplate(templateId);
  };

  const handleSaveCustomTemplate = (templateId: string) => {
    // Aquí podría agregar lógica para guardar plantilla personalizada
    // Por ahora, usamos la plantilla original
    setCustomizingTemplate(null);
    handleUseTemplate(templateId);
  };

  const dynamicStyles = getDynamicStyles(colors);
  const isCustomizing = customizingTemplate !== null;

  if (isCustomizing) {
    return (
      <CustomizeTemplateScreen
        templateId={customizingTemplate!}
        colors={colors}
        dynamicStyles={dynamicStyles}
        onBack={() => setCustomizingTemplate(null)}
        onSave={handleSaveCustomTemplate}
      />
    );
  }

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Header mejorado */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.title, dynamicStyles.title]}>Plantillas</Text>
          <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
            Crea rutinas en segundos
          </Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.intro}>
          <View style={[styles.introIcon, { backgroundColor: colors.primary + '15' }]}>
            <Text style={styles.introEmoji}>✨</Text>
          </View>
          <Text style={[styles.introText, dynamicStyles.introText]}>
            Elige una plantilla para comenzar rápidamente. Puedes personalizarla después.
          </Text>
        </View>

        <View style={styles.templatesContainer}>
          {ROUTINE_TEMPLATES.map((template) => {
            const isExpanded = expandedTemplates.find(t => t.id === template.id)?.expanded;
            const taskCount = template.tasks.length;
            const totalPoints = template.tasks.reduce((sum, task) => sum + task.points, 0);

            return (
              <View key={template.id} style={[styles.templateCard, dynamicStyles.templateCard]}>
                {/* Card Header - Siempre visible */}
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => toggleTemplateExpand(template.id)}
                  activeOpacity={0.6}
                >
                  <View style={styles.headerLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={styles.templateIcon}>{template.icon}</Text>
                    </View>
                    <View style={styles.headerInfo}>
                      <Text style={[styles.templateName, dynamicStyles.templateName]}>
                        {template.name}
                      </Text>
                      <Text style={[styles.templateDescription, dynamicStyles.templateDescription]}>
                        {template.description}
                      </Text>
                      <View style={styles.statsRow}>
                        <View style={styles.stat}>
                          <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                          <Text style={[styles.statText, { color: colors.primary }]}>
                            {taskCount} tareas
                          </Text>
                        </View>
                        <View style={styles.stat}>
                          <Ionicons name="star" size={14} color={colors.accent} />
                          <Text style={[styles.statText, { color: colors.accent }]}>
                            {totalPoints} XP
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                {/* Expanded Content */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    
                    <View style={styles.tasksContainer}>
                      <Text style={[styles.tasksTitle, dynamicStyles.tasksTitle]}>
                        Tareas incluidas:
                      </Text>
                      {template.tasks.map((task, index) => (
                        <View key={index} style={styles.taskItem}>
                          <View style={[styles.taskNumber, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={[styles.taskNumberText, { color: colors.primary }]}>
                              {index + 1}
                            </Text>
                          </View>
                          <View style={styles.taskContent}>
                            <Text style={[styles.taskText, dynamicStyles.taskText]}>
                              {task.title}
                            </Text>
                          </View>
                          <View style={[styles.pointsBadge, { backgroundColor: colors.accent + '20' }]}>
                            <Text style={[styles.pointsText, { color: colors.accent }]}>
                              +{task.points}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsContainer}>
                      <TouchableOpacity
                        style={[styles.customizeButton, dynamicStyles.customizeButton]}
                        onPress={() => handleCustomizeTemplate(template.id)}
                      >
                        <Ionicons name="pencil" size={18} color={colors.primary} />
                        <Text style={[styles.customizeButtonText, { color: colors.primary }]}>
                          Personalizar
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.useButton, { backgroundColor: colors.primary }]}
                        onPress={() => handleUseTemplate(template.id)}
                        disabled={loading === template.id}
                      >
                        <Ionicons
                          name={loading === template.id ? 'hourglass' : 'play'}
                          size={18}
                          color="#fff"
                        />
                        <Text style={styles.useButtonText}>
                          {loading === template.id ? 'Creando...' : 'Usar plantilla'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, dynamicStyles.footerText]}>
            💡 Tip: Puedes crear rutinas personalizadas desde la pantalla anterior
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Pantalla de personalización
type CustomizeTemplateScreenProps = {
  templateId: string;
  colors: any;
  dynamicStyles: any;
  onBack: () => void;
  onSave: (templateId: string) => void;
};

function CustomizeTemplateScreen({
  templateId,
  colors,
  dynamicStyles,
  onBack,
  onSave,
}: CustomizeTemplateScreenProps) {
  const template = ROUTINE_TEMPLATES.find(t => t.id === templateId);
  const [tasks, setTasks] = useState(template?.tasks || []);
  const [routineName, setRoutineName] = useState(template?.name || '');

  if (!template) return null;

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.title, dynamicStyles.title]}>Personalizar</Text>
          <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
            {template.name}
          </Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.inputContainer, dynamicStyles.inputContainer]}>
          <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Nombre de la rutina</Text>
          <TextInput
            style={[styles.input, dynamicStyles.input, { borderColor: colors.border }]}
            placeholder="Nombre de la rutina"
            placeholderTextColor={colors.textTertiary}
            value={routineName}
            onChangeText={setRoutineName}
          />
        </View>

        <View style={styles.tasksSection}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Tareas</Text>
          {tasks.map((task, index) => (
            <View key={index} style={[styles.editTaskItem, dynamicStyles.editTaskItem]}>
              <View style={styles.taskEditContent}>
                <TextInput
                  style={[styles.taskInput, dynamicStyles.taskInput, { borderColor: colors.border }]}
                  placeholder="Nombre de la tarea"
                  placeholderTextColor={colors.textTertiary}
                  value={task.title}
                  onChangeText={(text) => {
                    const newTasks = [...tasks];
                    newTasks[index].title = text;
                    setTasks(newTasks);
                  }}
                />
                <TextInput
                  style={[styles.pointsInput, dynamicStyles.pointsInput, { borderColor: colors.border }]}
                  placeholder="XP"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  value={task.points.toString()}
                  onChangeText={(text) => {
                    const newTasks = [...tasks];
                    newTasks[index].points = parseInt(text) || 0;
                    setTasks(newTasks);
                  }}
                />
              </View>
              <TouchableOpacity
                onPress={() => {
                  setTasks(tasks.filter((_, i) => i !== index));
                }}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.addTaskButton, { borderColor: colors.primary }]}
            onPress={() => {
              setTasks([...tasks, { title: '', points: 10 }]);
            }}
          >
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={[styles.addTaskButtonText, { color: colors.primary }]}>
              Agregar tarea
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.customizeFooter, dynamicStyles.customizeFooter]}>
        <TouchableOpacity
          style={[styles.cancelButton, dynamicStyles.cancelButton]}
          onPress={onBack}
        >
          <Text style={[styles.cancelButtonText, { color: colors.primary }]}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={() => onSave(templateId)}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Crear rutina</Text>
        </TouchableOpacity>
      </View>
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
  subtitle: {
    color: colors.textSecondary,
  },
  introText: {
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
  tasksTitle: {
    color: colors.text,
  },
  taskText: {
    color: colors.text,
  },
  customizeButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  customizeButtonText: {
    color: colors.primary,
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  inputLabel: {
    color: colors.text,
  },
  input: {
    color: colors.text,
    borderColor: colors.border,
  },
  sectionTitle: {
    color: colors.text,
  },
  editTaskItem: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  taskInput: {
    color: colors.text,
    borderColor: colors.border,
  },
  pointsInput: {
    color: colors.text,
    borderColor: colors.border,
  },
  customizeFooter: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  cancelButton: {
    borderColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.primary,
  },
  footerText: {
    color: colors.textTertiary,
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
    paddingTop: 48,
    paddingBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
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
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  introIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  introEmoji: {
    fontSize: 24,
  },
  introText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  templatesContainer: {
    gap: 16,
    marginBottom: 24,
  },
  templateCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateIcon: {
    fontSize: 32,
  },
  headerInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 13,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expandedContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  divider: {
    height: 1,
    marginBottom: 20,
  },
  tasksContainer: {
    marginBottom: 20,
  },
  tasksTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  taskNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 14,
  },
  pointsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  customizeButton: {
    flex: 1,
    borderRadius: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
  },
  customizeButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
  useButton: {
    flex: 1.2,
    borderRadius: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  useButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  footer: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 18,
  },
  // Customize screen styles
  inputContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  tasksSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  editTaskItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  taskEditContent: {
    flex: 1,
    gap: 8,
  },
  taskInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  pointsInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    maxWidth: 80,
  },
  addTaskButton: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addTaskButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
  customizeFooter: {
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1.2,
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
