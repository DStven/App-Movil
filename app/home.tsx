import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
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

const DEFAULT_ROUTINE: Routine = {
  id: 'default',
  title: 'Mi rutina',
  tasks: [
    { id: 'wake', title: 'Levantarse de la cama', points: 10, done: false },
    { id: 'wash', title: 'Lavarse la cara', points: 10, done: false },
    { id: 'breakfast', title: 'Desayunar', points: 10, done: false },
    { id: 'dress', title: 'Vestirse', points: 10, done: false },
    { id: 'work', title: 'Trabajar', points: 10, done: false },
  ],
};

export default function HomeScreen() {
  const [pet, setPet] = useState<string | null>(null);
  const [routine, setRoutine] = useState<Routine>(DEFAULT_ROUTINE);

  // XP animada
  const animatedXP = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const storedPet = await AsyncStorage.getItem('petType');
    const storedRoutine = await AsyncStorage.getItem('routine');

    if (storedPet) setPet(storedPet);
    if (storedRoutine) {
      setRoutine(JSON.parse(storedRoutine));
    } else {
      await AsyncStorage.setItem(
        'routine',
        JSON.stringify(DEFAULT_ROUTINE)
      );
    }
  };

  const toggleTask = async (taskId: string) => {
    const updatedRoutine = {
      ...routine,
      tasks: routine.tasks.map(task =>
        task.id === taskId
          ? { ...task, done: !task.done }
          : task
      ),
    };

    setRoutine(updatedRoutine);
    await AsyncStorage.setItem(
      'routine',
      JSON.stringify(updatedRoutine)
    );
  };

  /* =======================
        CÁLCULO DE XP
     ======================= */
  const completedTasks = routine.tasks.filter(t => t.done).length;

  const progressXP = Math.round(
    (completedTasks / routine.tasks.length) * 100
  );

  /* =======================
        ANIMACIÓN XP
     ======================= */
  useEffect(() => {
    Animated.timing(animatedXP, {
      toValue: progressXP,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [progressXP]);

  const xpWidth = animatedXP.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.petAvatar}>
          {pet === 'dog' ? '🐶' : pet === 'cat' ? '🐱' : '🐣'}
        </Text>

        <View style={{ flex: 1 }}>
          <Text style={styles.routineTitle}>{routine.title}</Text>

          {/* XP BAR */}
          <View style={styles.xpBar}>
            <Animated.View
              style={[
                styles.xpFill,
                { width: xpWidth },
              ]}
            />
          </View>

          <Text style={styles.progressText}>
            {progressXP}% completado
          </Text>
        </View>
      </View>

      {/* Tasks */}
      {routine.tasks.map(task => (
        <TouchableOpacity
          key={task.id}
          style={[
            styles.taskCard,
            task.done && styles.taskDone,
          ]}
          onPress={() => toggleTask(task.id)}
        >
          <Text
            style={[
              styles.taskText,
              task.done && styles.taskTextDone,
            ]}
          >
            {task.title}
          </Text>

          <Text style={styles.points}>
            {task.points} xp
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  petAvatar: {
    fontSize: 54,
    marginRight: 16,
  },
  routineTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  xpBar: {
    height: 10,
    width: '100%',
    backgroundColor: '#eee',
    borderRadius: 8,
    marginTop: 6,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#22c55e',
  },
  progressText: {
    fontSize: 12,
    color: '#22c55e',
    marginTop: 4,
  },
  taskCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  taskDone: {
    backgroundColor: '#ecfdf5',
    borderColor: '#22c55e',
  },
  taskText: {
    fontSize: 15,
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
    color: '#22c55e',
  },
  points: {
    fontSize: 13,
    color: '#999',
  },
});
