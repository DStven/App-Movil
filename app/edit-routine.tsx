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
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [routineTitle, setRoutineTitle] = useState('');
  const [newTask, setNewTask] = useState('');
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
     GUARDAR Y VOLVER
  ========================= */
  const handleSaveAndExit = async () => {
    if (!routine) return;

    // Actualizar el título antes de guardar
    const updatedRoutine = { ...routine, title: routineTitle };
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar rutina</Text>

      {/* Nombre rutina */}
      <TextInput
        style={styles.input}
        value={routineTitle}
        onChangeText={setRoutineTitle}
        placeholder="Nombre de la rutina"
      />

      {/* Nueva tarea */}
      <View style={styles.addTask}>
        <TextInput
          style={styles.addInput}
          value={newTask}
          onChangeText={setNewTask}
          placeholder="Nueva tarea"
        />
        <TouchableOpacity style={styles.addBtn} onPress={addTask}>
          <Text style={styles.addText}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Lista tareas */}
      <FlatList
        data={routine.tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskRow}>
            <Text style={styles.taskText}>{item.title}</Text>
            <TouchableOpacity onPress={() => deleteTask(item.id)}>
              <Text style={styles.delete}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Botón guardar */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveAndExit}>
        <Text style={styles.saveButtonText}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
}

/* =========================
   ESTILOS
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderColor: '#ddd',
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
    borderColor: '#ddd',
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  addBtn: {
    marginLeft: 10,
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ff3b3b',
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
    height: 50,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  taskText: {
    fontSize: 15,
  },
  delete: {
    color: '#ff3b3b',
    fontSize: 13,
  },
  saveButton: {
    marginTop: 20,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
