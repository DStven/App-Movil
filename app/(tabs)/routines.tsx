import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

type Routine = {
  id: string;
  title: string;
  tasks?: any[];
  completed?: boolean;
};

export default function RoutinesScreen() {
  const { colors } = useTheme();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const router = useRouter();

  // Recargar cuando se vuelve a la pantalla
  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, [])
  );

  const loadRoutines = async () => {
    const stored = await AsyncStorage.getItem('routines');
    if (stored) {
      setRoutines(JSON.parse(stored));
    }
  };

  const handleEdit = (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    // No permitir editar rutinas completadas
    if (routine?.completed) return;
    router.push(`/edit-routine?id=${routineId}`);
  };

  const handleAddRoutine = () => {
    router.push('/edit-routine');
  };

  const handleUseTemplate = () => {
    router.push('/routine-templates');
  };

  // Calcular progreso de una rutina
  const getRoutineProgress = (routine: Routine) => {
    if (!routine.tasks || routine.tasks.length === 0) return 0;
    const completed = routine.tasks.filter((t: any) => t.done).length;
    return Math.round((completed / routine.tasks.length) * 100);
  };

  const handleDuplicate = async (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;

    const duplicatedRoutine: Routine = {
      ...routine,
      id: Date.now().toString(),
      title: `${routine.title} (copia)`,
      completed: false,
      tasks: routine.tasks?.map((task: any) => ({
        ...task,
        done: false,
      })),
    };

    const updatedRoutines = [...routines, duplicatedRoutine];
    await AsyncStorage.setItem('routines', JSON.stringify(updatedRoutines));
    setRoutines(updatedRoutines);
  };

  const handleDelete = async (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    
    Alert.alert(
      'Eliminar rutina',
      `¿Estás seguro de que deseas eliminar "${routine?.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const updatedRoutines = routines.filter(r => r.id !== routineId);
            await AsyncStorage.setItem('routines', JSON.stringify(updatedRoutines));
            
            // Si era la rutina activa, cambiar a otra
            const activeRoutineId = await AsyncStorage.getItem('activeRoutineId');
            if (activeRoutineId === routineId) {
              const nextRoutine = updatedRoutines.find(r => !r.completed);
              if (nextRoutine) {
                await AsyncStorage.setItem('activeRoutineId', nextRoutine.id);
              } else if (updatedRoutines.length > 0) {
                await AsyncStorage.setItem('activeRoutineId', updatedRoutines[0].id);
              } else {
                await AsyncStorage.removeItem('activeRoutineId');
              }
            }
            
            setRoutines(updatedRoutines);
          },
        },
      ]
    );
  };

  const dynamicStyles = getDynamicStyles(colors);

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Header minimalista */}
      <View style={styles.header}>
        <Text style={[styles.title, dynamicStyles.title]}>Rutinas</Text>
      </View>

      {/* Lista de rutinas */}
      {routines.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="list-outline" size={64} color={colors.border} />
          <Text style={[styles.emptyText, dynamicStyles.emptyText]}>No tienes rutinas aún</Text>
          <Text style={[styles.emptySubtext, dynamicStyles.emptySubtext]}>
            Crea tu primera rutina para comenzar
          </Text>
        </View>
      ) : (
        <>
          {routines.map((routine: Routine) => {
            const progress = getRoutineProgress(routine);
            const taskCount = routine.tasks?.length || 0;
            
            return (
              <TouchableOpacity
                key={routine.id}
                style={[
                  styles.card,
                  dynamicStyles.card,
                  routine.completed && [styles.cardCompleted, dynamicStyles.cardCompleted],
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <Text
                      style={[
                        styles.cardTitle,
                        dynamicStyles.cardTitle,
                        routine.completed && [styles.cardTitleCompleted, dynamicStyles.cardTitleCompleted],
                      ]}
                    >
                      {routine.title}
                    </Text>
                    {!routine.completed && taskCount > 0 && (
                      <View style={styles.progressInfo}>
                        <View style={[styles.progressBarMini, dynamicStyles.progressBarMini]}>
                          <View
                            style={[
                              styles.progressBarFill,
                              { width: `${progress}%`, backgroundColor: colors.primary },
                            ]}
                          />
                        </View>
                        <Text style={[styles.progressText, { color: colors.primary }]}>{progress}%</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.actions}>
                    {!routine.completed && (
                      <TouchableOpacity
                        style={[styles.actionButton, dynamicStyles.actionButton]}
                        onPress={() => handleEdit(routine.id)}
                      >
                        <Ionicons name="create-outline" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[styles.actionButton, dynamicStyles.actionButton]}
                      onPress={() => handleDuplicate(routine.id)}
                    >
                      <Ionicons name="copy-outline" size={20} color={colors.accent} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, dynamicStyles.actionButton]}
                      onPress={() => handleDelete(routine.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {/* Botones de acción */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.templateButton, dynamicStyles.templateButton]}
          onPress={handleUseTemplate}
          activeOpacity={0.8}
        >
          <Ionicons name="document-text-outline" size={20} color={colors.primary} />
          <Text style={[styles.templateButtonText, { color: colors.primary }]}>Plantillas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleAddRoutine}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addText}>Nueva rutina</Text>
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
  card: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
    shadowColor: colors.primary,
  },
  cardCompleted: {
    borderColor: colors.border,
  },
  cardTitle: {
    color: colors.text,
  },
  cardTitleCompleted: {
    color: colors.textTertiary,
  },
  progressBarMini: {
    backgroundColor: colors.borderLight,
  },
  actionButton: {
    backgroundColor: colors.surface,
  },
  addButton: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    shadowColor: colors.primary,
  },
  templateButton: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  emptyText: {
    color: colors.textSecondary,
  },
  emptySubtext: {
    color: colors.textTertiary,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 28,
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  progressBarMini: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    maxWidth: 120,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 36,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  templateButton: {
    flex: 1,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
  },
  templateButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  addButton: {
    flex: 2,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  addText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cardCompleted: {
    opacity: 0.5,
  },
  cardTitleCompleted: {
    textDecorationLine: 'line-through',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
