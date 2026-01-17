import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Note, createEmptyNote, getNotes, saveNote } from './storage/notes';

const NOTE_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
];

/**
 * Pantalla para crear o editar una nota
 */
export default function EditNoteScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    loadNote();
  }, [id]);

  const loadNote = async () => {
    if (id) {
      // Modo edición: cargar nota existente
      const notes = await getNotes();
      const foundNote = notes.find(n => n.id === id);
      if (foundNote) {
        setNote(foundNote);
        setTitle(foundNote.title);
        setContent(foundNote.content);
      }
    } else {
      // Modo creación: crear nota vacía
      const newNote = createEmptyNote();
      setNote(newNote);
      setTitle('');
      setContent('');
    }
  };

  const handleSave = async () => {
    if (!note) return;

    const updatedNote: Note = {
      ...note,
      title: title.trim(),
      content: content.trim(),
      updatedAt: Date.now(),
    };

    await saveNote(updatedNote);
    router.back();
  };

  const handleTogglePin = async () => {
    if (!note) return;
    const updatedNote: Note = {
      ...note,
      pinned: !note.pinned,
    };
    setNote(updatedNote);
    await saveNote(updatedNote);
  };

  const handleColorChange = async (color: string) => {
    if (!note) return;
    const updatedNote: Note = {
      ...note,
      color,
    };
    setNote(updatedNote);
    await saveNote(updatedNote);
  };

  if (!note) return null;

  const dynamicStyles = getDynamicStyles(colors);

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      <StatusBar barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'} />
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>
            {id ? 'Editar nota' : 'Nueva nota'}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.iconButton, dynamicStyles.iconButton]}
              onPress={handleTogglePin}
              activeOpacity={0.7}
            >
              <Ionicons
                name={note.pinned ? 'pin' : 'pin-outline'}
                size={22}
                color={note.pinned ? colors.warning : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Selector de color */}
          <View style={styles.colorSection}>
            <Text style={[styles.colorLabel, dynamicStyles.colorLabel]}>Color</Text>
            <View style={styles.colorOptions}>
              {NOTE_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    note.color === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => handleColorChange(color)}
                  activeOpacity={0.8}
                >
                  {note.color === color && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Título */}
          <TextInput
            style={[styles.titleInput, dynamicStyles.titleInput]}
            value={title}
            onChangeText={setTitle}
            placeholder="Título de la nota"
            placeholderTextColor={colors.textTertiary}
          />

          {/* Contenido */}
          <TextInput
            style={[styles.contentInput, dynamicStyles.contentInput]}
            value={content}
            onChangeText={setContent}
            placeholder="Escribe tu nota aquí..."
            placeholderTextColor={colors.textTertiary}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        {/* Botón Guardar fijo en la parte inferior */}
        <View style={[styles.footer, dynamicStyles.footerBorder]}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Guardar</Text>
            <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getDynamicStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  headerTitle: {
    color: colors.text,
  },
  iconButton: {
    backgroundColor: colors.surface,
  },
  colorLabel: {
    color: colors.textSecondary,
  },
  titleInput: {
    borderColor: colors.border,
    backgroundColor: colors.card,
    color: colors.text,
  },
  contentInput: {
    borderColor: colors.border,
    backgroundColor: colors.card,
    color: colors.text,
  },
  footerBorder: {
    borderTopColor: colors.border,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    paddingBottom: 16,
    minHeight: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerActions: {
    width: 40,
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 100,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    borderTopWidth: 1,
  },
  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  colorSection: {
    marginBottom: 24,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  colorOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#fff',
    transform: [{ scale: 1.1 }],
  },
  titleInput: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  contentInput: {
    minHeight: 300,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
  },
});
