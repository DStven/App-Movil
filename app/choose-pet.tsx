import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const PETS = [
  { id: 'dog', name: 'Perro 🐶' },
  { id: 'cat', name: 'Gato 🐱' },
  { id: 'chick', name: 'Pollito 🐣' },
];

export default function ChoosePetScreen() {
  const router = useRouter();
  const [selectedPet, setSelectedPet] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!selectedPet) return;

    try {
      await AsyncStorage.setItem('petType', selectedPet);
      router.replace('/home'); // o /routine/default luego
    } catch (e) {
      console.error('Error guardando mascota', e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Elige tu mascota</Text>
      <Text style={styles.subtitle}>
        Será tu compañera en las rutinas
      </Text>

      {PETS.map((pet) => {
        const isSelected = selectedPet === pet.id;

        return (
          <TouchableOpacity
            key={pet.id}
            style={[
              styles.petCard,
              isSelected && styles.petCardSelected,
            ]}
            onPress={() => setSelectedPet(pet.id)}
          >
            <Text style={styles.petText}>{pet.name}</Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[
          styles.mainButton,
          !selectedPet && styles.buttonDisabled,
        ]}
        disabled={!selectedPet}
        onPress={handleContinue}
      >
        <Text style={styles.mainButtonText}>Continuar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 6,
  },
  petCard: {
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  petCardSelected: {
    borderColor: '#ff3b3b',
    backgroundColor: '#ffecec',
  },
  petText: {
    fontSize: 18,
    fontWeight: '500',
  },
  mainButton: {
    marginTop: 20,
    backgroundColor: '#ff3b3b',
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
