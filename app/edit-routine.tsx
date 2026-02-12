import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Extrapolate,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

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
  createdAt?: number;
  lastCompletedDate?: number;
};

export default function EditRoutineScreen() {
  const { colors } = useTheme();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [routineTitle, setRoutineTitle] = useState('');
  const [newTask, setNewTask] = useState('');
  const [isNewAndUnchanged, setIsNewAndUnchanged] = useState(true);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  useEffect(() => {
    loadRoutine();
  }, [id]);

  const loadRoutine = async () => {
    const stored = await AsyncStorage.getItem('routines');
    let routines: Routine[] = stored ? JSON.parse(stored) : [];
    let routineToEdit: Routine | undefined;

    if (id) {
      routineToEdit = routines.find(r => r.id === id);
      setIsNewAndUnchanged(false);
    } else {
      const now = Date.now();
      const newRoutine: Routine = {
        id: now.toString(),
        title: '',
        tasks: [],
        createdAt: now,
      };
      routineToEdit = newRoutine;
      setIsNewAndUnchanged(true);
    }

    if (routineToEdit) {
      setRoutine(routineToEdit);
      setRoutineTitle(routineToEdit.title);
    }
  };

  const saveRoutine = async (updated: Routine) => {
    const stored = await AsyncStorage.getItem('routines');
    let routines: Routine[] = stored ? JSON.parse(stored) : [];

    if (!id && !routines.find(r => r.id === updated.id)) {
      routines.push(updated);
    } else {
      routines = routines.map((r: Routine) =>
        r.id === updated.id ? updated : r
      );
    }

    const sortedRoutines = routines.sort((a, b) => {
      const dateA = a.createdAt || parseInt(a.id) || 0;
      const dateB = b.createdAt || parseInt(b.id) || 0;
      return dateA - dateB;
    });

    await AsyncStorage.setItem('routines', JSON.stringify(sortedRoutines));
    setRoutine(updated);
  };

  const addTask = () => {
    if (!newTask.trim() || !routine) return;
    setIsNewAndUnchanged(false);
    
    const updated: Routine = {
      ...routine,
      tasks: [
        ...routine.tasks,
        {
          id: Date.now().toString(),
          title: newTask,
          points: 10,
          done: false,
        },
      ],
    };

    setRoutine(updated);
    setNewTask('');
  };

  const deleteTask = (id: string) => {
    if (!routine) return;

    Alert.alert('Eliminar tarea', '¿Seguro que deseas eliminarla?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          const updated: Routine = {
            ...routine,
            tasks: routine.tasks.filter((t) => t.id !== id),
          };
          setRoutine(updated);
        },
      },
    ]);
  };

  const reorderTasks = (fromIndex: number, toIndex: number) => {
    if (!routine || fromIndex === toIndex) return;

    const newTasks = [...routine.tasks];
    const [movedTask] = newTasks.splice(fromIndex, 1);
    newTasks.splice(toIndex, 0, movedTask);

    const updated: Routine = {
      ...routine,
      tasks: newTasks,
    };
    setRoutine(updated);
    setDraggedTask(null);
  };

  const handleSaveAndExit = async () => {
    if (!routine) return;

    const titleTrimmed = routineTitle.trim();

    if (!titleTrimmed) {
      Alert.alert(
        'Rutina sin nombre',
        'Debes darle un nombre a la rutina para guardarla',
        [{ text: 'Entendido', style: 'default' }]
      );
      return;
    }

    const updatedRoutine = {
      ...routine,
      title: titleTrimmed,
    };
    
    await saveRoutine(updatedRoutine);
    
    if (!id) {
      const activeRoutineId = await AsyncStorage.getItem('activeRoutineId');
      if (!activeRoutineId) {
        await AsyncStorage.setItem('activeRoutineId', updatedRoutine.id);
      }
    }
    
    router.back();
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleRoutineTitleChange = (text: string) => {
    setRoutineTitle(text);
    if (text.trim()) {
      setIsNewAndUnchanged(false);
    }
  };

  if (!routine) return null;

  const dynamicStyles = getDynamicStyles(colors);

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      <View style={styles.content}>
        {/* Header con botón atrás */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, dynamicStyles.title]}>Editar rutina</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Nombre rutina */}
        <TextInput
          style={[styles.input, dynamicStyles.input]}
          value={routineTitle}
          onChangeText={handleRoutineTitleChange}
          placeholder="Nombre de la rutina"
          placeholderTextColor={colors.textTertiary}
        />

        {/* Recurrencia eliminada */}

        {/* Nueva tarea */}
        <View style={styles.addTask}>
          <TextInput
            style={[styles.addInput, dynamicStyles.addInput]}
            value={newTask}
            onChangeText={setNewTask}
            placeholder="Nueva tarea"
            placeholderTextColor={colors.textTertiary}
          />
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={addTask}>
            <Text style={styles.addText}>＋</Text>
          </TouchableOpacity>
        </View>

        {/* Lista tareas con drag & drop */}
        <View style={styles.tasksList}>
          {routine.tasks.length === 0 ? (
            <View style={styles.emptyTasks}>
              <Ionicons name="list-outline" size={40} color={colors.textTertiary} />
              <Text style={[styles.emptyTasksText, { color: colors.textSecondary }]}>
                No hay tareas aún
              </Text>
              <Text style={[styles.emptyTasksSubtext, { color: colors.textTertiary }]}>
                Agrega una tarea para comenzar
              </Text>
            </View>
          ) : (
            routine.tasks.map((item, index) => (
              <TaskRow
                key={item.id}
                task={item}
                index={index}
                totalTasks={routine.tasks.length}
                isDragged={draggedTask === item.id}
                onDelete={() => deleteTask(item.id)}
                onReorder={(fromIndex, toIndex) => reorderTasks(fromIndex, toIndex)}
                colors={colors}
                dynamicStyles={dynamicStyles}
              />
            ))
          )}
        </View>

        {/* Botón guardar */}
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSaveAndExit}>
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Componente para cada tarea con drag & drop
function TaskRow({
  task,
  index,
  totalTasks,
  isDragged,
  onDelete,
  onReorder,
  colors,
  dynamicStyles,
}: {
  task: Task;
  index: number;
  totalTasks: number;
  isDragged: boolean;
  onDelete: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  colors: any;
  dynamicStyles: any;
}) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = event.translationY;
      scale.value = 1.05;
    })
    .onEnd((event) => {
      const itemHeight = 56;
      const moveDistance = event.translationY;
      const targetIndex = Math.round(moveDistance / itemHeight);
      const newIndex = Math.max(0, Math.min(totalTasks - 1, index + targetIndex));

      if (newIndex !== index) {
        runOnJS(onReorder)(index, newIndex);
      }

      translateY.value = withSpring(0);
      scale.value = withSpring(1);
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: interpolate(scale.value, [1, 1.05], [1, 0.8], Extrapolate.CLAMP),
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.taskRowContainer, animatedStyle]}>
        <View style={[styles.taskRow, dynamicStyles.taskRow, isDragged && styles.taskRowDragging]}>
          <View style={styles.dragHandle}>
            <Ionicons name="reorder-three" size={20} color={colors.textSecondary} />
          </View>
          <View style={styles.taskContent}>
            <Text style={[styles.taskNumber, dynamicStyles.taskNumber]}>{index + 1}.</Text>
            <Text style={[styles.taskText, dynamicStyles.taskText]}>{task.title}</Text>
            <Text style={[styles.taskPoints, dynamicStyles.taskPoints]}>{task.points} XP</Text>
          </View>
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const getDynamicStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
  },
  input: {
    borderColor: colors.border,
    backgroundColor: colors.card,
    color: colors.text,
  },
  taskRow: {
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  addInput: {
    borderColor: colors.border,
    backgroundColor: colors.card,
    color: colors.text,
  },
  taskText: {
    color: colors.text,
  },
  taskNumber: {
    color: colors.textSecondary,
  },
  taskPoints: {
    color: colors.textSecondary,
  },
  recurringSection: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  recurringLabel: {
    color: colors.text,
  },
  recurringOption: {
    borderColor: colors.border,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  addTask: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  addInput: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  addBtn: {
    marginLeft: 10,
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addText: {
    color: '#fff',
    fontSize: 22,
  },
  tasksList: {
    flex: 1,
    marginBottom: 16,
  },
  taskRowContainer: {
    marginBottom: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  taskRowDragging: {
    opacity: 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  dragHandle: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskNumber: {
    fontSize: 14,
    fontWeight: '600',
    width: 24,
  },
  taskText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  taskPoints: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    marginLeft: 8,
    padding: 4,
  },
  saveButton: {
    marginBottom: 16,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recurringSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  recurringHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recurringLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  recurringOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  recurringOption: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recurringOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyTasks: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTasksText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyTasksSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
});
