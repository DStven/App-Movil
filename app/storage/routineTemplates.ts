import AsyncStorage from '@react-native-async-storage/async-storage';
import { Routine } from './initAppData';

export type RoutineTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string;
  tasks: Array<{ title: string; points: number }>;
};

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    id: 'morning',
    name: 'Rutina Matutina',
    description: 'Comienza tu día con energía',
    icon: '🌅',
    tasks: [
      { title: 'Levantarse de la cama', points: 10 },
      { title: 'Beber un vaso de agua', points: 5 },
      { title: 'Hacer ejercicio', points: 20 },
      { title: 'Ducharse', points: 10 },
      { title: 'Desayunar', points: 15 },
    ],
  },
  {
    id: 'evening',
    name: 'Rutina Nocturna',
    description: 'Prepara tu cuerpo para descansar',
    icon: '🌙',
    tasks: [
      { title: 'Cenar', points: 15 },
      { title: 'Lavarse los dientes', points: 10 },
      { title: 'Leer un libro', points: 20 },
      { title: 'Meditar', points: 25 },
      { title: 'Preparar ropa del día siguiente', points: 10 },
    ],
  },
  {
    id: 'workout',
    name: 'Rutina de Ejercicio',
    description: 'Mantén tu cuerpo activo',
    icon: '💪',
    tasks: [
      { title: 'Calentamiento', points: 10 },
      { title: 'Ejercicio principal', points: 30 },
      { title: 'Estiramiento', points: 15 },
      { title: 'Hidratarse', points: 10 },
    ],
  },
  {
    id: 'study',
    name: 'Rutina de Estudio',
    description: 'Mejora tu aprendizaje',
    icon: '📚',
    tasks: [
      { title: 'Organizar material', points: 10 },
      { title: 'Leer capítulo', points: 20 },
      { title: 'Tomar notas', points: 15 },
      { title: 'Repasar', points: 20 },
    ],
  },
  {
    id: 'work',
    name: 'Rutina de Trabajo',
    description: 'Maximiza tu productividad',
    icon: '💼',
    tasks: [
      { title: 'Revisar emails', points: 10 },
      { title: 'Planificar el día', points: 15 },
      { title: 'Tareas importantes', points: 30 },
      { title: 'Reuniones', points: 20 },
    ],
  },
];

export const createRoutineFromTemplate = async (templateId: string): Promise<Routine> => {
  const template = ROUTINE_TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    throw new Error('Plantilla no encontrada');
  }

  const now = Date.now();
  const routine: Routine = {
    id: now.toString(),
    title: template.name,
    tasks: template.tasks.map((task, index) => ({
      id: `${now}-${index}`,
      title: task.title,
      points: task.points,
      done: false,
    })),
    createdAt: now,
    completed: false,
  };

  // Guardar la rutina
  const stored = await AsyncStorage.getItem('routines');
  const routines: Routine[] = stored ? JSON.parse(stored) : [];
  routines.push(routine);
  await AsyncStorage.setItem('routines', JSON.stringify(routines));

  return routine;
};

// Export default para evitar que Expo Router lo trate como ruta
export default function RoutineTemplatesStorage() {
  return null;
}
