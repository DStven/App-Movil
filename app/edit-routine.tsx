import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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
};

export default function EditRoutineScreen() {
  const { colors } = useTheme();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [routineTitle, setRoutineTitle] = useState('');
  const [newTask, setNewTask] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<'daily' | 'weekly' | null>(null);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  useEffect(() => {
    loadRoutine();
  }, [id]);

  /* =========================
     CARGAR RUTINA
  ========================= */
  const loadRoutine = async () => {
    const stored = await AsyncStorage.getItem('routines');
    let routines: Routine[] = stored ? JSON.parse(stored) : [];
    let routineToEdit: Routine | undefined;

    if (id) {
      // Buscar rutina por ID
      routineToEdit = routines.find(r => r.id === id);
      if (routineToEdit) {
        setIsRecurring(routineToEdit.isRecurring || false);
        setRecurringType(routineToEdit.recurringType || null);
      }
    } else {
      // Si no hay ID, es una nueva rutina
      const now = Date.now();
      const newRoutine: Routine = {
        id: now.toString(),
        title: 'Nueva rutina',
        tasks: [],
        createdAt: now, // Guardar fecha de creación
      };
      routineToEdit = newRoutine;
      // Guardar la nueva rutina al final del array (orden de creación)
      routines.push(newRoutine);
      await AsyncStorage.setItem('routines', JSON.stringify(routines));
      // NO establecer como rutina activa automáticamente
      // Solo establecerla como activa si no hay ninguna activa
      const activeRoutineId = await AsyncStorage.getItem('activeRoutineId');
      if (!activeRoutineId) {
        await AsyncStorage.setItem('activeRoutineId', newRoutine.id);
      }
    }

    if (routineToEdit) {
      setRoutine(routineToEdit);
      setRoutineTitle(routineToEdit.title);
    }
  };

  /* =========================
     GUARDAR RUTINA
  ========================= */
  const saveRoutine = async (updated: Routine) => {
    const stored = await AsyncStorage.getItem('routines');
    if (!stored) return;

    const routinesParsed: Routine[] = JSON.parse(stored);

    // Mantener createdAt si ya existe, o usar el ID como referencia
    const existingRoutine = routinesParsed.find((r: Routine) => r.id === updated.id);
    const routineToSave: Routine = {
      ...updated,
      createdAt: existingRoutine?.createdAt || parseInt(updated.id) || Date.now(),
    };

    const updatedRoutines = routinesParsed.map((r: Routine) =>
      r.id === updated.id ? routineToSave : r
    );

    // Ordenar por fecha de creación (más antiguas primero)
    const sortedRoutines = updatedRoutines.sort((a, b) => {
      const dateA = a.createdAt || parseInt(a.id) || 0;
      const dateB = b.createdAt || parseInt(b.id) || 0;
      return dateA - dateB;
    });

    await AsyncStorage.setItem('routines', JSON.stringify(sortedRoutines));
    setRoutine(routineToSave);
  };

  /* =========================
     AGREGAR TAREA
  ========================= */
  const addTask = () => {
    if (!newTask.trim() || !routine) return;

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

    saveRoutine(updated);
    setNewTask('');
  };

  /* =========================
     ELIMINAR TAREA
  ========================= */
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
          saveRoutine(updated);
        },
      },
    ]);
  };

  /* =========================
     REORDENAR TAREAS
  ========================= */
  const moveTask = (taskId: string, direction: 'up' | 'down') => {
    if (!routine) return;

    const taskIndex = routine.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    if (direction === 'up' && taskIndex === 0) return;
    if (direction === 'down' && taskIndex === routine.tasks.length - 1) return;

    const newTasks = [...routine.tasks];
    const targetIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;
    [newTasks[taskIndex], newTasks[targetIndex]] = [newTasks[targetIndex], newTasks[taskIndex]];

    const updated: Routine = {
      ...routine,
      tasks: newTasks,
    };
    saveRoutine(updated);
  };

  /* =========================
     GUARDAR Y VOLVER
  ========================= */
  const handleSaveAndExit = async () => {
    if (!routine) return;

    // Actualizar el título y opciones de recurrencia antes de guardar
    const updatedRoutine = {
      ...routine,
      title: routineTitle,
      isRecurring,
      recurringType: isRecurring ? recurringType : null,
    };
    await saveRoutine(updatedRoutine);
    
    // NO cambiar la rutina activa automáticamente
    // Solo establecerla como activa si no hay ninguna activa
    if (!id) {
      const activeRoutineId = await AsyncStorage.getItem('activeRoutineId');
      if (!activeRoutineId) {
        await AsyncStorage.setItem('activeRoutineId', updatedRoutine.id);
      }
    }
    
    router.back();
  };

  if (!routine) return null;

  const dynamicStyles = getDynamicStyles(colors);

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Text style={[styles.title, dynamicStyles.title]}>Editar rutina</Text>

      {/* Nombre rutina */}
      <TextInput
        style={[styles.input, dynamicStyles.input]}
        value={routineTitle}
        onChangeText={setRoutineTitle}
        placeholder="Nombre de la rutina"
        placeholderTextColor={colors.textTertiary}
      />

      {/* Opciones de recurrencia */}
      <View style={[styles.recurringSection, dynamicStyles.recurringSection]}>
        <View style={styles.recurringHeader}>
          <Ionicons name="repeat" size={20} color={colors.primary} />
          <Text style={[styles.recurringLabel, dynamicStyles.recurringLabel]}>Rutina recurrente</Text>
        </View>
        <TouchableOpacity
          style={[styles.toggleButton, isRecurring && { backgroundColor: colors.primary }]}
          onPress={() => {
            setIsRecurring(!isRecurring);
            if (isRecurring) setRecurringType(null);
          }}
        >
          <Text style={[styles.toggleText, { color: isRecurring ? '#fff' : colors.text }]}>
            {isRecurring ? 'Activada' : 'Desactivada'}
          </Text>
        </TouchableOpacity>
        {isRecurring && (
          <View style={styles.recurringOptions}>
            <TouchableOpacity
              style={[
                styles.recurringOption,
                recurringType === 'daily' && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
              ]}
              onPress={() => setRecurringType('daily')}
            >
              <Text style={[styles.recurringOptionText, { color: recurringType === 'daily' ? colors.primary : colors.text }]}>
                Diaria
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.recurringOption,
                recurringType === 'weekly' && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
              ]}
              onPress={() => setRecurringType('weekly')}
            >
              <Text style={[styles.recurringOptionText, { color: recurringType === 'weekly' ? colors.primary : colors.text }]}>
                Semanal
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

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

      {/* Lista tareas */}
      <FlatList
        data={routine.tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={[styles.taskRow, dynamicStyles.taskRow]}>
            <View style={styles.taskContent}>
              <Text style={[styles.taskNumber, dynamicStyles.taskNumber]}>{index + 1}.</Text>
              <Text style={[styles.taskText, dynamicStyles.taskText]}>{item.title}</Text>
              <Text style={[styles.taskPoints, dynamicStyles.taskPoints]}>{item.points} XP</Text>
            </View>
            <View style={styles.taskActions}>
              <TouchableOpacity
                style={[styles.moveButton, dynamicStyles.moveButton]}
                onPress={() => moveTask(item.id, 'up')}
                disabled={index === 0}
              >
                <Ionicons
                  name="chevron-up"
                  size={18}
                  color={index === 0 ? colors.textTertiary : colors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.moveButton, dynamicStyles.moveButton]}
                onPress={() => moveTask(item.id, 'down')}
                disabled={index === routine.tasks.length - 1}
              >
                <Ionicons
                  name="chevron-down"
                  size={18}
                  color={index === routine.tasks.length - 1 ? colors.textTertiary : colors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteTask(item.id)}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Botón guardar */}
      <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSaveAndExit}>
        <Text style={styles.saveButtonText}>Guardar</Text>
      </TouchableOpacity>
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
  moveButton: {
    backgroundColor: colors.surface,
  },
  recurringSection: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  recurringLabel: {
    color: colors.text,
  },
});

/* =========================
   ESTILOS
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
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
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moveButton: {
    padding: 4,
  },
  saveButton: {
    marginTop: 20,
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
    backgroundColor: '#f5f5f5',
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
    borderColor: '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recurringOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
