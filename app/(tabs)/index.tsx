import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';


import { useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

export default function OnboardingScreen() {
  // 🧭 Router
  const router = useRouter();

  const [petName, setPetName] = useState('');
  const [userName, setUserName] = useState('');

  const userInputRef = useRef<TextInput>(null);

  // 🎞 Animaciones inputs
  const petAnim = useRef(new Animated.Value(1)).current;
  const userAnim = useRef(new Animated.Value(1)).current;

  // 🎞 Animación botón
  const buttonAnim = useRef(new Animated.Value(1)).current;

  const focusInput = (anim: Animated.Value) => {
    Animated.spring(anim, {
      toValue: 1.05,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const blurInput = (anim: Animated.Value) => {
    Animated.spring(anim, {
      toValue: 1,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const pressInButton = () => {
    Animated.spring(buttonAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const pressOutButton = () => {
    Animated.spring(buttonAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const isPetValid = petName.trim().length > 0;
  const isUserValid = userName.trim().length > 0;
  const isFormValid = isPetValid && isUserValid;

  const handleContinue = () => {
    if (!isFormValid) return;
    router.replace('/choose-pet');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>

        {/* Logo */}
        <View style={styles.logo} />

        {/* Títulos */}
        <Text style={styles.title}>¡Empecemos!</Text>
        <Text style={styles.subtitle}>
          Ponle nombre a tu mascota y dinos cómo te llamas
        </Text>

        {/* Mascota */}
        <Text style={styles.label}>Nombre de tu mascota</Text>
        <Animated.View style={{ transform: [{ scale: petAnim }] }}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ej: Rocky"
              placeholderTextColor="#999"
              value={petName}
              onChangeText={setPetName}
              returnKeyType="next"
              blurOnSubmit={false}
              onFocus={() => focusInput(petAnim)}
              onBlur={() => blurInput(petAnim)}
              onSubmitEditing={() => userInputRef.current?.focus()}
            />
            <TouchableOpacity
              style={[
                styles.inputButton,
                !isPetValid && styles.buttonDisabled,
              ]}
              disabled={!isPetValid}
              onPress={() => userInputRef.current?.focus()}
            >
              <Ionicons name="arrow-forward" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Usuario */}
        <Text style={styles.label}>Tu nombre</Text>
        <Animated.View style={{ transform: [{ scale: userAnim }] }}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={userInputRef}
              style={styles.input}
              placeholder="Ej: Steven"
              placeholderTextColor="#999"
              value={userName}
              onChangeText={setUserName}
              returnKeyType="done"
              onFocus={() => focusInput(userAnim)}
              onBlur={() => blurInput(userAnim)}
              onSubmitEditing={Keyboard.dismiss}
            />
            <TouchableOpacity
              style={[
                styles.inputButton,
                !isUserValid && styles.buttonDisabled,
              ]}
              disabled={!isUserValid}
              onPress={Keyboard.dismiss}
            >
              <Ionicons name="checkmark" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Botón continuar */}
        <TouchableWithoutFeedback
          disabled={!isFormValid}
          onPressIn={pressInButton}
          onPressOut={pressOutButton}
          onPress={handleContinue}
        >
          <Animated.View
            style={[
              styles.mainButton,
              !isFormValid && styles.mainButtonDisabled,
              { transform: [{ scale: buttonAnim }] },
            ]}
          >
            <Text style={styles.mainButtonText}>Continuar</Text>
          </Animated.View>
        </TouchableWithoutFeedback>

      </View>
    </KeyboardAvoidingView>
  );
}

/* ======================
   ESTILOS
   ====================== */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  logo: {
    width: 140,
    height: 140,
    backgroundColor: '#e0e0e0',
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 24,
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
  label: {
    fontSize: 13,
    color: '#999',
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 52,
    borderWidth: 1.5,
    borderColor: '#ff3b3b',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingRight: 60,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  inputButton: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ff3b3b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  mainButton: {
    marginTop: 10,
    backgroundColor: '#ff3b3b',
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButtonDisabled: {
    opacity: 0.4,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
