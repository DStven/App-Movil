import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
    const currentIndex = allRoutines.findIndex((r: Routine) => r.id === routine.id);
    return allRoutines.slice(0, currentIndex).some((r: Routine) => !r.completed);
  };

  // Verificar si hay rutina siguiente disponible
  const hasNextRoutine = () => {
    if (!routine) return false;
    const currentIndex = allRoutines.findIndex((r: Routine) => r.id === routine.id);
    return allRoutines.slice(currentIndex + 1).some((r: Routine) => !r.completed);
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
      <View style={[styles.container, dynamicStyles.container]}>
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
      </View>
    );
  }

  // Si no hay rutina activa pero hay rutinas (todas completadas o ninguna disponible)
  if (!routine && allRoutines.length > 0) {
    const hasIncompleteRoutines = allRoutines.some((r: Routine) => !r.completed);
    
    return (
      <View style={[styles.container, dynamicStyles.container]}>
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
      </View>
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
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Header minimalista */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={[styles.streakBadge, dynamicStyles.streakBadge]}>
            <Ionicons name="flame" size={16} color={colors.warning} />
            <Text style={[styles.streakText, dynamicStyles.streakText]}>{currentStreak}</Text>
          </View>
        </View>
        
        <View style={styles.routineHeader}>
          <View style={[styles.avatarCircle, dynamicStyles.avatarCircle]}>
            <Text style={styles.petAvatar}>
              {pet === 'dog' ? '🐶' : pet === 'cat' ? '🐱' : '🐣'}
            </Text>
          </View>
          <Text style={[styles.routineTitle, dynamicStyles.routineTitle]}>{routine.title}</Text>
          <Text style={[styles.dateText, dynamicStyles.dateText]}>{getCurrentDate()}</Text>
        </View>

        {/* Botones de navegación minimalistas */}
        {(hasPreviousRoutine() || hasNextRoutine()) && (
          <View style={styles.navigationButtons}>
            {hasPreviousRoutine() && (
              <TouchableOpacity
                style={[styles.navButton, dynamicStyles.navButton]}
                onPress={moveToPreviousRoutine}
              >
                <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            {hasNextRoutine() && (
              <TouchableOpacity
                style={[styles.navButton, dynamicStyles.navButton]}
                onPress={moveToNextRoutine}
              >
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Barra de progreso minimalista */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, dynamicStyles.progressLabel]}>Progreso</Text>
          <Text style={[styles.progressPercentage, { color: colors.primary }]}>{progressXP}%</Text>
        </View>
        <View style={[styles.xpBar, dynamicStyles.xpBar]}>
          <Animated.View
            style={[styles.xpFill, { width: xpWidth, backgroundColor: colors.primary }]}
          />
        </View>
      </View>

      {/* Área scrollable - Solo las tareas */}
      <ScrollView
        style={styles.tasksScrollView}
        contentContainerStyle={styles.tasksScrollContent}
        showsVerticalScrollIndicator={true}
      >
        {routine.tasks.map(task => (
          <TouchableOpacity
            key={task.id}
            style={[styles.taskCard, dynamicStyles.taskCard]}
            onPress={() => toggleTask(task.id)}
            activeOpacity={0.7}
          >
            <View style={styles.checkboxContainer}>
              {task.done ? (
                <View style={[styles.checkboxChecked, { backgroundColor: colors.primary }]}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              ) : (
                <View style={[styles.checkbox, dynamicStyles.checkbox]} />
              )}
            </View>

            <Text
              style={[
                styles.taskText,
                dynamicStyles.taskText,
                task.done && [styles.taskTextDone, dynamicStyles.taskTextDone],
              ]}
            >
              {task.title}
            </Text>

            <View style={[styles.pointsBadge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.points, { color: colors.primary }]}>
                {task.points} XP
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Botón para siguiente rutina cuando está completada */}
        {routine.completed && (
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: colors.primary }]}
            onPress={moveToNextRoutine}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {allRoutines.some((r: Routine) => !r.completed && r.id !== routine.id)
                ? 'Siguiente rutina'
                : 'Crear nueva rutina'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

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
  avatarCircle: {
    backgroundColor: colors.surface,
  },
  navButton: {
    backgroundColor: colors.surface,
  },
  navButtonText: {
    color: colors.textSecondary,
  },
  routineTitle: {
    color: colors.text,
  },
  dateText: {
    color: colors.textSecondary,
  },
  progressLabel: {
    color: colors.textSecondary,
  },
  xpBar: {
    backgroundColor: colors.borderLight,
  },
  taskCard: {
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  checkbox: {
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  taskText: {
    color: colors.text,
  },
  taskTextDone: {
    color: colors.textTertiary,
  },
  emptyTitle: {
    color: colors.text,
  },
  emptyText: {
    color: colors.textSecondary,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 24,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
  },
  routineHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  petAvatar: {
    fontSize: 48,
  },
  routineTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '400',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: '600',
  },
  xpBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 3,
  },
  tasksScrollView: {
    flex: 1,
  },
  tasksScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  checkboxContainer: {
    marginRight: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
  },
  checkboxChecked: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
  },
  pointsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  points: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  createButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
