import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { initializeDefaultData } from './storage/initAppData';

type PetOption = {
  id: string;
  name: string;
  image: any;
};

const PETS: PetOption[] = [
  { id: 'dog', name: 'Perro', image: require('../assets/images/pets/dog.png') },
  { id: 'cat', name: 'Gato', image: require('../assets/images/pets/cat.png') },
  { id: 'chick', name: 'Pollito', image: require('../assets/images/pets/pullet.png') },
];

export default function ChoosePetScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [animations] = useState(
    PETS.reduce((acc, pet) => {
      acc[pet.id] = new Animated.Value(1);
      return acc;
    }, {} as Record<string, Animated.Value>)
  );

  const handlePetSelect = (petId: string) => {
    setSelectedPet(petId);
    
    // Animación al seleccionar
    Object.keys(animations).forEach((id) => {
      Animated.spring(animations[id], {
        toValue: id === petId ? 1.15 : 1,
        friction: 7,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleFinishOnboarding = async () => {
    if (!selectedPet) return;

    // Guardar mascota
    await AsyncStorage.setItem('petType', selectedPet);

    // Crear rutina por defecto
    await initializeDefaultData();

    // Ir al Home (Tabs)
    router.replace('/(tabs)/home');
  };

  const dynamicStyles = getDynamicStyles(colors);

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, dynamicStyles.title]}>Elige tu mascota</Text>
        <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
          Selecciona la mascota que te acompañará en tu viaje
        </Text>
      </View>

      {/* Opciones de mascotas */}
      <FlatList
        data={PETS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.petsContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: pet }) => {
          const isSelected = selectedPet === pet.id;
          return (
            <TouchableOpacity
              style={[
                styles.petCard,
                dynamicStyles.petCard,
                isSelected && [styles.petCardSelected, { borderColor: colors.primary }],
              ]}
              onPress={() => handlePetSelect(pet.id)}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.petCircle,
                  { backgroundColor: isSelected ? colors.primary + '15' : colors.surface },
                  { transform: [{ scale: animations[pet.id] }] },
                ]}
              >
                <Image
                  source={pet.image}
                  style={styles.petImage}
                  resizeMode="contain"
                />
              </Animated.View>
              <Text style={[styles.petName, dynamicStyles.petName]}>{pet.name}</Text>
              {isSelected && (
                <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Botón continuar */}
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.primary },
          !selectedPet && styles.buttonDisabled,
        ]}
        disabled={!selectedPet}
        onPress={handleFinishOnboarding}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Empezar</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
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
  subtitle: {
    color: colors.textSecondary,
  },
  petCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  petName: {
    color: colors.text,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '400',
  },
  petsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  petsContent: {
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  petCard: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 32,
    alignItems: 'center',
    position: 'relative',
  },
  petCardSelected: {
    borderWidth: 2.5,
  },
  petCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  petImage: {
    width: 80,
    height: 80,
  },
  petName: {
    fontSize: 18,
    fontWeight: '600',
  },
  checkBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
