import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Note, deleteNote, getNotes } from './storage/notes';

/**
 * Pantalla de notas con búsqueda y filtrado
 */
export default function NotesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'title'>('recent');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Recargar notas cuando se vuelve a la pantalla
  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [])
  );

  const loadNotes = async () => {
    const allNotes = await getNotes();
    setNotes(allNotes);
  };

  const handleDelete = async (noteId: string) => {
    await deleteNote(noteId);
    await loadNotes();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // Filtrar y buscar notas
  const filteredNotes = notes
    .filter((note) => {
      // Filtro por color
      if (selectedColor && note.color !== selectedColor) {
        return false;
      }

      // Búsqueda por título y contenido
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          (note.title && note.title.toLowerCase().includes(query)) ||
          (note.content && note.content.toLowerCase().includes(query))
        );
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return b.updatedAt - a.updatedAt;
      } else if (sortBy === 'oldest') {
        return a.updatedAt - b.updatedAt;
      } else if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });

  // Colores disponibles para filtrar
  const colorOptions = [
    { name: 'Todos', value: null, icon: 'layers-outline' },
    { name: 'Indigo', value: '#6366f1', icon: 'square-sharp' },
    { name: 'Púrpura', value: '#8b5cf6', icon: 'square-sharp' },
    { name: 'Cian', value: '#06b6d4', icon: 'square-sharp' },
    { name: 'Verde', value: '#10b981', icon: 'square-sharp' },
    { name: 'Ámbar', value: '#f59e0b', icon: 'square-sharp' },
    { name: 'Rojo', value: '#ef4444', icon: 'square-sharp' },
  ];

  const dynamicStyles = getDynamicStyles(colors);

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      <StatusBar barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, dynamicStyles.title]}>Notas</Text>
        <TouchableOpacity
          onPress={() => router.push('/edit-note')}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda */}
      <View style={[styles.searchSection, { borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, dynamicStyles.searchInput]}
            placeholder="Buscar notas..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Botones de ordenamiento y filtrado */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowSortMenu(!showSortMenu)}
          >
            <Ionicons name="swap-vertical" size={18} color={colors.primary} />
            <Text style={[styles.sortButtonText, { color: colors.primary }]}>Ordenar</Text>
          </TouchableOpacity>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorFilters}
          >
            {colorOptions.map((option) => (
              <TouchableOpacity
                key={option.value || 'all'}
                style={[
                  styles.colorFilter,
                  option.value 
                    ? { backgroundColor: option.value, borderColor: option.value }
                    : [{ backgroundColor: colors.surface, borderColor: colors.border }],
                  selectedColor === option.value && [
                    styles.colorFilterActive,
                    { borderColor: colors.text, borderWidth: 2.5 }
                  ],
                ]}
                onPress={() => setSelectedColor(option.value)}
                activeOpacity={0.7}
              >
                {option.value === null ? (
                  <Ionicons name={option.icon} size={16} color={colors.textSecondary} />
                ) : selectedColor === option.value ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Menú de ordenamiento */}
        {showSortMenu && (
          <View style={[styles.sortMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { label: 'Más recientes', value: 'recent' },
              { label: 'Más antiguos', value: 'oldest' },
              { label: 'Título A-Z', value: 'title' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortOption,
                  sortBy === option.value && [styles.sortOptionActive, { backgroundColor: colors.primary + '20' }],
                ]}
                onPress={() => {
                  setSortBy(option.value as any);
                  setShowSortMenu(false);
                }}
              >
                {sortBy === option.value && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                )}
                <Text style={[
                  styles.sortOptionText,
                  dynamicStyles.sortOptionText,
                  sortBy === option.value && { color: colors.primary, fontWeight: '600' },
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Información de búsqueda */}
      {(searchQuery.length > 0 || selectedColor) && (
        <View style={[styles.filterInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.filterInfoText, dynamicStyles.filterInfoText]}>
            {filteredNotes.length} {filteredNotes.length === 1 ? 'resultado' : 'resultados'}
          </Text>
          {(searchQuery.length > 0 || selectedColor) && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSelectedColor(null);
              }}
              style={[styles.clearFiltersButton, { borderColor: colors.border }]}
            >
              <Text style={[styles.clearFiltersText, { color: colors.primary }]}>Limpiar filtros</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Lista de notas */}
      {filteredNotes.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons 
            name={searchQuery.length > 0 ? 'search-outline' : 'document-text-outline'} 
            size={64} 
            color={colors.border} 
          />
          <Text style={[styles.emptyText, dynamicStyles.emptyText]}>
            {searchQuery.length > 0 ? 'No hay resultados' : 'No tienes notas aún'}
          </Text>
          <Text style={[styles.emptySubtext, dynamicStyles.emptySubtext]}>
            {searchQuery.length > 0 
              ? 'Intenta con otras palabras clave'
              : 'Crea tu primera nota para comenzar'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notesList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.noteCard,
                dynamicStyles.noteCard,
                item.pinned && styles.noteCardPinned,
                { borderLeftColor: item.color || colors.primary },
              ]}
              onPress={() => router.push(`/edit-note?id=${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.noteHeader}>
                {item.pinned && (
                  <Ionicons name="pin" size={16} color={colors.textSecondary} />
                )}
                <Text style={[styles.noteTitle, dynamicStyles.noteTitle]} numberOfLines={1}>
                  {item.title || 'Sin título'}
                </Text>
              </View>
              <Text style={[styles.noteContent, dynamicStyles.noteContent]} numberOfLines={3}>
                {item.content || 'Sin contenido'}
              </Text>
              <View style={styles.noteFooter}>
                <Text style={[styles.noteDate, dynamicStyles.noteDate]}>
                  {formatDate(item.updatedAt)}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const getDynamicStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
  },
  searchInput: {
    color: colors.text,
  },
  emptyText: {
    color: colors.textSecondary,
  },
  emptySubtext: {
    color: colors.textTertiary,
  },
  noteCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  noteTitle: {
    color: colors.text,
  },
  noteContent: {
    color: colors.textSecondary,
  },
  noteDate: {
    color: colors.textTertiary,
  },
  sortOptionText: {
    color: colors.text,
  },
  filterInfoText: {
    color: colors.text,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    minHeight: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Búsqueda
  searchSection: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
    height: 44,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  
  // Controles (ordenar y filtros)
  controlsRow: {
    gap: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 6,
    marginBottom: 8,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  
  // Menú de ordenamiento
  sortMenu: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  sortOptionActive: {
    borderRadius: 0,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Filtros de color
  colorFilters: {
    gap: 8,
    paddingBottom: 8,
  },
  colorFilter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  colorFilterActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Información de filtrado
  filterInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filterInfoText: {
    fontSize: 13,
    fontWeight: '500',
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Lista de notas
  notesList: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  noteCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderLeftWidth: 4,
    padding: 20,
    marginBottom: 16,
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  noteCardPinned: {
    borderLeftWidth: 6,
    shadowOpacity: 0.1,
    elevation: 3,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noteTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  noteContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  noteDate: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
  },
  
  // Estado vacío
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
