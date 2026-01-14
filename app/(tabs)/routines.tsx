import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Routine = {
  id: string;
  title: string;
  tasks?: any[];
  completed?: boolean;
};

export default function RoutinesScreen() {
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

  // Calcular progreso de una rutina
  const getRoutineProgress = (routine: Routine) => {
    if (!routine.tasks || routine.tasks.length === 0) return 0;
    const completed = routine.tasks.filter((t: any) => t.done).length;
    return Math.round((completed / routine.tasks.length) * 100);
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

  return (
    <View style={styles.container}>
      {/* Header con título centrado y decoración */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.titleDecoration} />
          <Text style={styles.title}>Rutinas</Text>
          <View style={styles.titleDecoration} />
        </View>
      </View>

      {/* Lista de rutinas */}
      {routines.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="list-outline" size={64} color="#e5e5e5" />
          <Text style={styles.emptyText}>No tienes rutinas aún</Text>
          <Text style={styles.emptySubtext}>
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
                  routine.completed && styles.cardCompleted,
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <Text
                      style={[
                        styles.cardTitle,
                        routine.completed && styles.cardTitleCompleted,
                      ]}
                    >
                      {routine.title}
                    </Text>
                    {!routine.completed && taskCount > 0 && (
                      <View style={styles.progressInfo}>
                        <View style={styles.progressBarMini}>
                          <View
                            style={[
                              styles.progressBarFill,
                              { width: `${progress}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressText}>{progress}%</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.actions}>
                    {!routine.completed && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEdit(routine.id)}
                      >
                        <Ionicons name="pencil" size={18} color="#fb923c" />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDelete(routine.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#fb923c" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {/* Botón agregar rutina */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddRoutine}
        activeOpacity={0.8}
      >
        <View style={styles.addButtonContent}>
          <Ionicons name="add-circle" size={24} color="#fb923c" />
          <Text style={styles.addText}>Nueva rutina</Text>
        </View>
      </TouchableOpacity>
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
    marginBottom: 32,
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleDecoration: {
    width: 30,
    height: 2,
    backgroundColor: '#fb923c',
    borderRadius: 2,
    opacity: 0.3,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  card: {
    borderWidth: 1.5,
    borderColor: '#fb923c',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    backgroundColor: '#fff',
    shadowColor: '#fb923c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  progressBarMini: {
    flex: 1,
    height: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 2,
    overflow: 'hidden',
    maxWidth: 100,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fb923c',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#fb923c',
    fontWeight: '600',
    minWidth: 32,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff7ed',
  },
  addButton: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: '#fb923c',
    borderRadius: 16,
    height: 56,
    backgroundColor: '#fff7ed',
    shadowColor: '#fb923c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  addButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    height: '100%',
  },
  addText: {
    color: '#fb923c',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  cardCompleted: {
    opacity: 0.5,
    borderColor: '#d1d5db',
  },
  cardTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
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
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
