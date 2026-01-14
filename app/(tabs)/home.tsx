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
import { checkAndResetStreakIfNeeded, updateStreak } from '../../storage/streak';
import { addXP } from '../../storage/userProgress';

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
};

export default function HomeScreen() {
  const [pet, setPet] = useState<string | null>(null);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [allRoutines, setAllRoutines] = useState<Routine[]>([]);
  const router = useRouter();

  const animatedXP = useRef(new Animated.Value(0)).current;

  const loadData = async () => {
    const storedPet = await AsyncStorage.getItem('petType');
    const storedRoutines = await AsyncStorage.getItem('routines');
    const activeRoutineId = await AsyncStorage.getItem('activeRoutineId');

    if (storedPet) setPet(storedPet);

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

    // Si todas las rutinas están completadas, actualizar racha
    if (allTasksDone) {
      const allRoutinesCompleted = routines.every((r: Routine) => r.completed);
      if (allRoutinesCompleted) {
        await updateStreak();
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

  // Si no hay rutinas, mostrar mensaje para crear una
  if (!routine && allRoutines.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No tienes rutinas</Text>
          <Text style={styles.emptyText}>
            Crea tu primera rutina para comenzar
          </Text>
          <TouchableOpacity
            style={styles.createButton}
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
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>
            {hasIncompleteRoutines 
              ? 'No hay rutina activa' 
              : '¡Todas las rutinas completadas!'}
          </Text>
          <Text style={styles.emptyText}>
            {hasIncompleteRoutines
              ? 'Selecciona una rutina para comenzar'
              : 'Crea una nueva rutina para continuar'}
          </Text>
          <TouchableOpacity
            style={styles.createButton}
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

  // Si no hay rutinas en absoluto, mostrar mensaje de crear
  if (!routine && allRoutines.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No tienes rutinas</Text>
          <Text style={styles.emptyText}>
            Crea tu primera rutina para comenzar
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/(tabs)/routines')}
          >
            <Text style={styles.createButtonText}>Crear rutina</Text>
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
    <View style={styles.container}>
      {/* Header estático - Iconos superiores */}
      <View style={styles.topIcons}>
        <View style={styles.iconBadge}>
          <Ionicons name="flame" size={18} color="#ff6b35" />
          <Text style={styles.iconBadgeText}>1</Text>
        </View>
        <View style={styles.iconBadge}>
          <Ionicons name="trophy" size={18} color="#ffd700" />
          <Text style={styles.iconBadgeText}>2</Text>
        </View>
      </View>

      {/* Header estático - Avatar y título centrado */}
      <View style={styles.header}>
        <Text style={styles.petAvatar}>
          {pet === 'dog' ? '🐶' : pet === 'cat' ? '🐱' : '🐣'}
        </Text>
        <Text style={styles.routineTitle}>{routine.title}</Text>
        <Text style={styles.dateText}>{getCurrentDate()}</Text>
        
        {/* Botones de navegación entre rutinas */}
        {(hasPreviousRoutine() || hasNextRoutine()) && (
          <View style={styles.navigationButtons}>
            {hasPreviousRoutine() && (
              <TouchableOpacity
                style={styles.navButton}
                onPress={moveToPreviousRoutine}
              >
                <Ionicons name="chevron-back" size={20} color="#666" />
                <Text style={styles.navButtonText}>Anterior</Text>
              </TouchableOpacity>
            )}
            
            {hasNextRoutine() && (
              <TouchableOpacity
                style={styles.navButton}
                onPress={moveToNextRoutine}
              >
                <Text style={styles.navButtonText}>Siguiente</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Header estático - Barra de progreso */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Rutina completada</Text>
          <Text style={styles.progressPercentage}>{progressXP}%</Text>
        </View>
        <View style={styles.xpBar}>
          <Animated.View
            style={[styles.xpFill, { width: xpWidth }]}
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
            style={styles.taskCard}
            onPress={() => toggleTask(task.id)}
          >
            <View style={styles.checkboxContainer}>
              {task.done ? (
                <View style={styles.checkboxChecked}>
                  <Ionicons name="checkmark" size={16} color="#22c55e" />
                </View>
              ) : (
                <View style={styles.checkbox} />
              )}
            </View>

            <Text
              style={[
                styles.taskText,
                task.done && styles.taskTextDone,
              ]}
            >
              {task.title}
            </Text>

            <Text style={styles.points}>
              {task.points}xp
            </Text>
          </TouchableOpacity>
        ))}

        {/* Botón para siguiente rutina cuando está completada */}
        {routine.completed && (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={moveToNextRoutine}
          >
            <Text style={styles.nextButtonText}>
              {allRoutines.some((r: Routine) => !r.completed && r.id !== routine.id)
                ? 'Siguiente rutina'
                : 'Crear nueva rutina'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topIcons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 12,
  },
  iconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  iconBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  petAvatar: {
    fontSize: 80,
    marginBottom: 12,
  },
  routineTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  dateText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '400',
  },
  progressSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  xpBar: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#22c55e',
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
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  points: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
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
    backgroundColor: '#ff3b3b',
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
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
