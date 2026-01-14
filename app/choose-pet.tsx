import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { initializeDefaultData } from './storage/initAppData';

export default function ChoosePetScreen() {
  const router = useRouter();
  const [selectedPet, setSelectedPet] = useState<string | null>(null);

  const handleFinishOnboarding = async () => {
    if (!selectedPet) return;

    // Guardar mascota
    await AsyncStorage.setItem('petType', selectedPet);

    // Crear rutina por defecto
    await initializeDefaultData();

    // Ir al Home (Tabs)
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Elige tu mascota</Text>

      <View style={styles.pets}>
        <TouchableOpacity onPress={() => setSelectedPet('dog')}>
          <Text style={[
            styles.pet,
            selectedPet === 'dog' && styles.selected,
          ]}>
            🐶
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setSelectedPet('cat')}>
          <Text style={[
            styles.pet,
            selectedPet === 'cat' && styles.selected,
          ]}>
            🐱
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setSelectedPet('chick')}>
          <Text style={[
            styles.pet,
            selectedPet === 'chick' && styles.selected,
          ]}>
            🐣
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          !selectedPet && { opacity: 0.5 },
        ]}
        disabled={!selectedPet}
        onPress={handleFinishOnboarding}
      >
        <Text style={styles.buttonText}>
          Empezar
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  pets: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 40,
  },
  pet: {
    fontSize: 48,
  },
  selected: {
    transform: [{ scale: 1.2 }],
  },
  button: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
