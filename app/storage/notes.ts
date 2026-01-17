import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTES_KEY = 'notes';

/**
 * Tipo de una nota individual
 */
export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  color?: string;
  pinned?: boolean;
};

/**
 * Obtener todas las notas guardadas
 */
export const getNotes = async (): Promise<Note[]> => {
  try {
    const stored = await AsyncStorage.getItem(NOTES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch {
    return [];
  }
};

/**
 * Guardar una nota nueva o actualizar una existente
 */
export const saveNote = async (note: Note): Promise<void> => {
  const notes = await getNotes();
  const existingIndex = notes.findIndex(n => n.id === note.id);

  if (existingIndex > -1) {
    // Actualizar nota existente
    notes[existingIndex] = {
      ...note,
      updatedAt: Date.now(),
    };
  } else {
    // Agregar nueva nota
    const newNote: Note = {
      ...note,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    notes.push(newNote);
  }

  // Ordenar: primero las fijadas, luego por fecha de actualización (más recientes primero)
  notes.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt - a.updatedAt;
  });

  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
};

/**
 * Eliminar una nota
 */
export const deleteNote = async (noteId: string): Promise<void> => {
  const notes = await getNotes();
  const filtered = notes.filter(n => n.id !== noteId);
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(filtered));
};

/**
 * Crear una nueva nota vacía
 */
export const createEmptyNote = (): Note => {
  return {
    id: Date.now().toString(),
    title: '',
    content: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    color: '#6366f1',
    pinned: false,
  };
};

// Export default para evitar que Expo Router lo trate como ruta
export default function NotesStorage() {
  return null;
}
