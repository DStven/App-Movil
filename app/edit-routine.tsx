import AsyncStorage from '@react-native-async-storage/async-storage';
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
};

export default function EditRoutineScreen() {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    loadRoutine();
  }, []);

  const loadRoutine = async () => {
    const stored = await AsyncStorage.getItem('routine');
    if (stored) setRoutine(JSON.parse(stored));
  };

  const saveRoutine = async (updated: Routine) => {
    setRoutine(updated);
    await AsyncStorage.setItem('routine', JSON.stringify(updated));
  };

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

  const deleteTask = (id: string) => {
    if (!routine) return;

    Alert.alert('Eliminar tarea', '¿Seguro que deseas eliminarla?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          const updated = {
            ...routine,
            tasks: routine.tasks.filter((t) => t.id !== id),
          };
          saveRoutine(updated);
        },
      },
    ]);
  };

  if (!routine) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar rutina</Text>

      {/* Nombre rutina */}
      <TextInput
        style={styles.input}
        value={routine.title}
        onChangeText={(text) =>
          saveRoutine({ ...routine, title: text })
        }
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

      {/* Lista */}
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
    </View>
  );
}

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
});
