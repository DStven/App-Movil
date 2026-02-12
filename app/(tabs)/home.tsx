import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { checkAchievements } from '../storage/achievements';
import { addRoutineHistory } from '../storage/routineHistory';
import { checkAndResetStreakIfNeeded, getCurrentStreak, updateStreak } from '../storage/streak';
import { addXP, getLevel, getXP } from '../storage/userProgress';

type Task = {
  id: string;
  title: string;
  points: number;
  done: boolean;
};

type Routine = {
  id: string;
  title: string;
  tasks: Task[];
  completed?: boolean;
  createdAt?: number;
  isRecurring?: boolean;
  recurringType?: 'daily' | 'weekly' | null;
  lastCompletedDate?: number;
};

export default function HomeScreen() {
  const { colors } = useTheme();
  const [pet, setPet] = useState<string | null>(null);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [allRoutines, setAllRoutines] = useState<Routine[]>([]);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const router = useRouter();

  const animatedXP = useRef(new Animated.Value(0)).current;

  const loadData = async () => {
    const storedPet = await AsyncStorage.getItem('petType');
    const storedRoutines = await AsyncStorage.getItem('routines');
    const activeRoutineId = await AsyncStorage.getItem('activeRoutineId');

    if (storedPet) setPet(storedPet);

    // Cargar streak
    const streak = await getCurrentStreak();
    setCurrentStreak(streak);

    if (storedRoutines) {
      const routines: Routine[] = JSON.parse(storedRoutines);
      // Ordenar rutinas por fecha de creación (más antiguas primero)
      const sortedRoutines = routines.sort((a, b) => {
        const dateA = a.createdAt || parseInt(a.id) || 0;
        const dateB = b.createdAt || parseInt(b.id) || 0;
        return dateA - dateB;
      });
      setAllRoutines(sortedRoutines);

      // Buscar rutina activa o la primera no completada
      let activeRoutine: Routine | undefined;

      if (activeRoutineId) {
        activeRoutine = sortedRoutines.find((r: Routine) => r.id === activeRoutineId);
      }

      // Si no hay rutina activa o está completada, buscar la primera no completada
      if (!activeRoutine || activeRoutine.completed) {
        activeRoutine = sortedRoutines.find((r: Routine) => !r.completed);
      }

      // Si aún no hay rutina pero hay rutinas disponibles, usar la primera
      if (!activeRoutine && sortedRoutines.length > 0) {
        activeRoutine = sortedRoutines[0];
        // Establecer como activa si no había ninguna activa
        if (!activeRoutineId) {
          await AsyncStorage.setItem('activeRoutineId', activeRoutine.id);
        }
      }

      if (activeRoutine) {
        setRoutine(activeRoutine);
        // Actualizar activeRoutineId si cambió
        if (activeRoutine.id !== activeRoutineId) {
          await AsyncStorage.setItem('activeRoutineId', activeRoutine.id);
        }
      } else {
        // Si no hay rutinas disponibles, limpiar la rutina activa
        setRoutine(null);
        if (activeRoutineId) {
          await AsyncStorage.removeItem('activeRoutineId');
        }
      }
    } else {
      // Si no hay rutinas almacenadas, asegurar que no haya rutina activa
      setRoutine(null);
      await AsyncStorage.removeItem('activeRoutineId');
    }
  };

  // Recargar datos cuando se vuelve a la pantalla
  useFocusEffect(
    useCallback(() => {
      loadData();
      // Verificar y resetear racha si es necesario
      checkAndResetStreakIfNeeded();
    }, [])
  );

  const toggleTask = async (taskId: string) => {
    if (!routine) return;

    const task = routine.tasks.find(t => t.id === taskId);
    const wasDone = task?.done || false;

    const updatedRoutine: Routine = {
      ...routine,
      tasks: routine.tasks.map(task =>
        task.id === taskId
          ? { ...task, done: !task.done }
          : task
      ),
    };

    // Verificar si todas las tareas están completadas
    const allTasksDone = updatedRoutine.tasks.every(task => task.done);
    updatedRoutine.completed = allTasksDone;

    setRoutine(updatedRoutine);

    const stored = await AsyncStorage.getItem('routines');
    if (!stored) return;

    const routines: Routine[] = JSON.parse(stored).map(
      (r: Routine) => (r.id === updatedRoutine.id ? updatedRoutine : r)
    );

    await AsyncStorage.setItem(
      'routines',
      JSON.stringify(routines)
    );
    setAllRoutines(routines);

    // Si se completó una tarea, agregar XP
    if (!wasDone && task) {
      await addXP(task.points);
    }

    // Si todas las rutinas están completadas, actualizar racha y registrar historial
    if (allTasksDone) {
      const allRoutinesCompleted = routines.every((r: Routine) => r.completed);
      if (allRoutinesCompleted) {
        await updateStreak();

        // Registrar en historial
        const totalXP = updatedRoutine.tasks.reduce((sum, t) => sum + (t.done ? t.points : 0), 0);
        await addRoutineHistory({
          routineId: updatedRoutine.id,
          routineTitle: updatedRoutine.title,
          completedAt: Date.now(),
          tasksCompleted: updatedRoutine.tasks.filter(t => t.done).length,
          totalTasks: updatedRoutine.tasks.length,
          xpEarned: totalXP,
        });

        // Verificar logros
        const currentStreak = await getCurrentStreak();
        const totalXPValue = await getXP();
        const level = getLevel(totalXPValue);
        const { getRoutineHistory } = await import('../storage/routineHistory');
        const routineHistory = await getRoutineHistory();
        const completedCount = routineHistory.length;

        // Desbloquear logro de primera rutina si es la primera
        if (completedCount === 1) {
          const { unlockAchievement } = await import('../storage/achievements');
          await unlockAchievement('first_routine');
        }

        const unlockedAchievements = await checkAchievements(
          currentStreak,
          totalXPValue,
          level,
          completedCount
        );

        // Si hay logros desbloqueados, mostrar notificación
        if (unlockedAchievements.length > 0) {
          // Mostrar modal de logros (se implementará después)
          console.log('Logros desbloqueados:', unlockedAchievements);
        }

        // Si es una rutina recurrente, verificar si debe resetearse
        if (updatedRoutine.isRecurring) {
          const now = new Date();
          const lastCompleted = updatedRoutine.lastCompletedDate
            ? new Date(updatedRoutine.lastCompletedDate)
            : null;

          let shouldReset = false;

          if (updatedRoutine.recurringType === 'daily') {
            // Resetear si pasó un día
            if (!lastCompleted || now.toDateString() !== lastCompleted.toDateString()) {
              shouldReset = true;
            }
          } else if (updatedRoutine.recurringType === 'weekly') {
            // Resetear si pasó una semana
            if (!lastCompleted) {
              shouldReset = true;
            } else {
              const daysDiff = Math.floor((now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24));
              if (daysDiff >= 7) {
                shouldReset = true;
              }
            }
          }

          if (shouldReset) {
            const resetRoutine: Routine = {
              ...updatedRoutine,
              completed: false,
              tasks: updatedRoutine.tasks.map(t => ({ ...t, done: false })),
              lastCompletedDate: Date.now(),
            };
            const updatedRoutinesWithReset = routines.map((r: Routine) =>
              r.id === resetRoutine.id ? resetRoutine : r
            );
            await AsyncStorage.setItem('routines', JSON.stringify(updatedRoutinesWithReset));
            setRoutine(resetRoutine);
            setAllRoutines(updatedRoutinesWithReset);
          } else {
            // Actualizar lastCompletedDate
            const updatedRoutineWithDate: Routine = {
              ...updatedRoutine,
              lastCompletedDate: Date.now(),
            };
            const updatedRoutinesWithDate = routines.map((r: Routine) =>
              r.id === updatedRoutineWithDate.id ? updatedRoutineWithDate : r
            );
            await AsyncStorage.setItem('routines', JSON.stringify(updatedRoutinesWithDate));
            setRoutine(updatedRoutineWithDate);
            setAllRoutines(updatedRoutinesWithDate);
          }
        }
      }
    }
  };

  const moveToNextRoutine = async () => {
    if (!routine) return;

    // Buscar la siguiente rutina no completada (después de la actual)
    const currentIndex = allRoutines.findIndex((r: Routine) => r.id === routine.id);
    const nextRoutine = allRoutines.slice(currentIndex + 1).find(
      (r: Routine) => !r.completed
    );

    if (nextRoutine) {
      // Hay más rutinas, cambiar a la siguiente
      await AsyncStorage.setItem('activeRoutineId', nextRoutine.id);
      setRoutine(nextRoutine);
      setAllRoutines(allRoutines);
    } else {
      // No hay más rutinas, ir a crear una nueva
      router.push('/(tabs)/routines');
    }
  };

  const moveToPreviousRoutine = async () => {
    if (!routine) return;

    // Buscar la rutina anterior no completada (antes de la actual)
    const currentIndex = allRoutines.findIndex((r: Routine) => r.id === routine.id);
    const previousRoutines = allRoutines.slice(0, currentIndex).reverse();
    const previousRoutine = previousRoutines.find(
      (r: Routine) => !r.completed
    );

    if (previousRoutine) {
      // Hay rutinas anteriores, cambiar a la anterior
      await AsyncStorage.setItem('activeRoutineId', previousRoutine.id);
      setRoutine(previousRoutine);
      setAllRoutines(allRoutines);
    }
  };

  // Verificar si hay rutina anterior disponible
  const hasPreviousRoutine = () => {
    if (!routine) return false;
    const currentIndex = allRoutines.findIndex(r => r.id === routine.id);
    return currentIndex > 0;
  };

  // Verificar si hay rutina siguiente disponible
  const hasNextRoutine = () => {
    if (!routine) return false;
    const currentIndex = allRoutines.findIndex(r => r.id === routine.id);
    return currentIndex < allRoutines.length - 1;
  };

  // Cambiar a una rutina específica
  const switchToRoutine = async (routineId: string) => {
    const selectedRoutine = allRoutines.find(r => r.id === routineId);
    if (selectedRoutine) {
      setRoutine(selectedRoutine);
      await AsyncStorage.setItem('activeRoutineId', routineId);
    }
  };

  // Calcular progreso XP (antes de los returns para cumplir reglas de hooks)
  const completedTasks = routine?.tasks.filter(t => t.done).length || 0;
  const totalTasks = routine?.tasks.length || 1;
  const progressXP = Math.round((completedTasks / totalTasks) * 100);

  // useEffect debe estar antes de los returns condicionales
  useEffect(() => {
    if (routine) {
      Animated.timing(animatedXP, {
        toValue: progressXP,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    }
  }, [progressXP, routine]);

  const xpWidth = animatedXP.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const dynamicStyles = getDynamicStyles(colors);

  // Si no hay rutinas, mostrar mensaje para crear una
  if (!routine && allRoutines.length === 0) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
        <StatusBar barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'} />
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, dynamicStyles.emptyTitle]}>No tienes rutinas</Text>
          <Text style={[styles.emptyText, dynamicStyles.emptyText]}>
            Crea tu primera rutina para comenzar
          </Text>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/routines')}
          >
            <Text style={styles.createButtonText}>Crear rutina</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Si no hay rutina activa pero hay rutinas (todas completadas o ninguna disponible)
  if (!routine && allRoutines.length > 0) {
    const hasIncompleteRoutines = allRoutines.some((r: Routine) => !r.completed);

    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
        <StatusBar barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'} />
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, dynamicStyles.emptyTitle]}>
            {hasIncompleteRoutines
              ? 'No hay rutina activa'
              : '¡Todas las rutinas completadas!'}
          </Text>
          <Text style={[styles.emptyText, dynamicStyles.emptyText]}>
            {hasIncompleteRoutines
              ? 'Selecciona una rutina para comenzar'
              : 'Crea una nueva rutina para continuar'}
          </Text>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/routines')}
          >
            <Text style={styles.createButtonText}>
              {hasIncompleteRoutines ? 'Ver rutinas' : 'Crear rutina'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!routine) return null;

  // Obtener fecha actual en formato DD/MM/YY
  const getCurrentDate = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      <StatusBar barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'} />

      {/* Header - Streak y navegación */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={[styles.streakBadge, dynamicStyles.streakBadge]}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>🔥</Text>
            <Text style={[styles.streakText, dynamicStyles.streakText]}>{currentStreak} días</Text>
          </View>
        </View>
      </View>

      <View style={styles.petSection}>
        <View style={[styles.petContainer, dynamicStyles.petContainer]}>
          {pet ? (
            <Image
              source={
                pet === 'dog'
                  ? require('../../assets/images/pets/dog.png')
                  : pet === 'cat'
                  ? require('../../assets/images/pets/cat.png')
                  : require('../../assets/images/pets/pullet.png')
              }
              style={styles.petImage}
              resizeMode="contain"
            />
          ) : (
            <Image
              source={require('../../assets/images/pets/pullet.png')}
              style={styles.petImage}
              resizeMode="contain"
            />
          )}
        </View>
      </View>

      {/* Selector de rutinas horizontal - Mejorado */}
      {allRoutines.length > 1 && (
        <View style={styles.routineSelector}>
          <Text style={[styles.selectorLabel, dynamicStyles.selectorLabel]}>Mis Rutinas</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.routinesScroll}
          >
            {allRoutines.map((r, idx) => (
              <TouchableOpacity
                key={r.id}
                style={[
                  styles.routineTab,
                  dynamicStyles.routineTab,
                  r.id === routine?.id && [styles.routineTabActive, { backgroundColor: colors.primary }]
                ]}
                onPress={() => switchToRoutine(r.id)}
                activeOpacity={0.7}
              >
                <View style={styles.routineTabContent}>
                  <Text
                    style={[
                      styles.routineTabText,
                      dynamicStyles.routineTabText,
                      r.id === routine?.id && { color: '#fff', fontWeight: '700' }
                    ]}
                  >
                    {r.title.length > 15 ? r.title.substring(0, 15) + '...' : r.title}
                  </Text>
                  <View style={styles.routineTabBadge}>
                    <Text style={[styles.routineTabBadgeText, dynamicStyles.routineTabBadgeText, { color: r.id === routine?.id ? '#fff' : colors.primary }]}>
                      {r.tasks.filter(t => t.done).length}/{r.tasks.length}
                    </Text>
                  </View>
                </View>
                {r.completed && (
                  <View style={[styles.checkBadge, { backgroundColor: colors.success }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Barra de progreso mejorada */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <View>
            <Text style={[styles.progressLabel, dynamicStyles.progressLabel]}>Progreso</Text>
            <Text style={[styles.routineTitle, dynamicStyles.routineTitle]}>{routine.title}</Text>
          </View>
          <View style={styles.progressStats}>
            <Text style={[styles.progressPercentage, { color: colors.primary }]}>{progressXP}%</Text>
            <Text style={dynamicStyles.progressSubtext}>Completado</Text>
          </View>
        </View>

        <View style={[styles.xpBar, dynamicStyles.xpBar]}>
          <Animated.View
            style={[styles.xpFill, { width: xpWidth, backgroundColor: colors.primary }]}
          />
        </View>

        {/* Tareas completadas - Mejorado */}
        <View style={styles.tasksProgressContainer}>
          <View style={styles.tasksProgressItem}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={[styles.tasksProgress, dynamicStyles.tasksProgress]}>
              {routine.tasks.filter(t => t.done).length} completadas
            </Text>
          </View>
          <View style={styles.tasksProgressItem}>
            <Ionicons name="radio-button-off" size={14} color={colors.warning} />
            <Text style={[styles.tasksProgress, dynamicStyles.tasksProgress]}>
              {routine.tasks.filter(t => !t.done).length} pendientes
            </Text>
          </View>
        </View>
      </View>

      {/* Área scrollable - Solo las tareas */}
      <ScrollView
        style={styles.tasksScrollView}
        contentContainerStyle={styles.tasksScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {routine.tasks.length === 0 ? (
          <View style={styles.emptyTasks}>
            <Ionicons name="list-outline" size={40} color={colors.textTertiary} />
            <Text style={[styles.emptyTasksText, { color: colors.textSecondary }]}>
              No hay tareas en esta rutina
            </Text>
          </View>
        ) : (
          routine.tasks.map((task, index) => (
            <TouchableOpacity
              key={task.id}
              style={[
                styles.taskCard,
                dynamicStyles.taskCard,
                task.done
                  ? [styles.taskCardCompleted, { backgroundColor: colors.success + '10', borderLeftColor: colors.success }]
                  : { borderLeftColor: colors.primary }
              ]}
              onPress={() => toggleTask(task.id)}
              activeOpacity={0.6}
            >
              <View style={styles.checkboxContainer}>
                {task.done ? (
                  <View style={[styles.checkboxChecked, { backgroundColor: colors.success }]}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                ) : (
                  <View style={[styles.checkbox, dynamicStyles.checkbox]} />
                )}
              </View>

              <View style={styles.taskInfo}>
                <Text
                  style={[
                    styles.taskText,
                    dynamicStyles.taskText,
                    task.done && [styles.taskTextDone, dynamicStyles.taskTextDone],
                  ]}
                >
                  {task.title}
                </Text>
                <View style={styles.taskMeta}>
                  <Text style={[styles.taskIndex, dynamicStyles.taskIndex]}>Tarea {index + 1}</Text>
                </View>
              </View>

              <View style={[styles.pointsBadge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.points, { color: colors.primary }]}>
                  {task.points} XP
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Botón para siguiente rutina cuando está completada */}
        {routine.completed && routine.tasks.length > 0 && (
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: colors.success }]}
            onPress={moveToNextRoutine}
            activeOpacity={0.8}
          >
            <Ionicons name="star" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.nextButtonText}>
              ¡Rutina completada!
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
  },
  petSection: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  petContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 4,
  },
  petEmoji: {
    fontSize: 56,
  },
  petStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  routineSelector: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 12,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  routinesScroll: {
    gap: 8,
    paddingRight: 24,
  },
  routineTab: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routineTabActive: {
    borderWidth: 0,
  },
  routineTabContent: {
    flex: 1,
  },
  routineTabText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  routineTabBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  routineTabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  progressSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: '700',
  },
  progressStats: {
    alignItems: 'flex-end',
  },

  xpBar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpFill: {
    height: '100%',
    borderRadius: 6,
  },
  tasksProgressContainer: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 8,
  },
  tasksProgressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tasksProgress: {
    fontSize: 12,
    fontWeight: '500',
  },
  tasksScrollView: {
    flex: 1,
  },
  tasksScrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    paddingBottom: 32,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    minHeight: 56,
    borderLeftWidth: 4,
  },
  taskCardCompleted: {
    opacity: 0.7,
  },
  checkboxContainer: {
    marginRight: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  checkboxChecked: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskText: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskIndex: {
    fontSize: 11,
    fontWeight: '500',
  },
  pointsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  points: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyTasks: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTasksText: {
    fontSize: 14,
    marginTop: 12,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    marginVertical: 16,
    minHeight: 56,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  petImage: {
    width: 80,
    height: 80,
  },
});

const getDynamicStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  streakBadge: {
    backgroundColor: colors.surface,
  },
  streakText: {
    color: colors.text,
  },
  petContainer: {
    backgroundColor: colors.surface,
  },
  selectorLabel: {
    color: colors.text,
  },
  routineTab: {
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  routineTabText: {
    color: colors.text,
  },
  routineTabBadgeText: {
    color: colors.textSecondary,
  },
  progressLabel: {
    color: colors.textSecondary,
  },
  progressSubtext: {
    color: colors.textSecondary,
  },
  routineTitle: {
    color: colors.text,
  },
  xpBar: {
    backgroundColor: colors.surface,
  },
  tasksProgress: {
    color: colors.textSecondary,
  },
  taskCard: {
    backgroundColor: colors.card,
  },
  taskText: {
    color: colors.text,
  },
  taskTextDone: {
    color: colors.textSecondary,
  },
  taskIndex: {
    color: colors.textSecondary,
  },
  checkbox: {
    borderColor: colors.border,
  },
  emptyTitle: {
    color: colors.text,
  },
  emptyText: {
    color: colors.textSecondary,
  },
  emptyTasksText: {
    color: colors.textSecondary,
  },
});
