import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HomeScreen() {
  const [petName, setPetName] = useState('');
  const [userName, setUserName] = useState('');

  const userInputRef = useRef<TextInput>(null);

  const isPetValid = petName.trim().length > 0;
  const isUserValid = userName.trim().length > 0;
  const isFormValid = isPetValid && isUserValid;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>

          {/* Logo */}
          <View style={styles.logo} />

          {/* Títulos */}
          <Text style={styles.title}>¡Empecemos!</Text>
          <Text style={styles.subtitle}>
            Ponle nombre a tu mascota y dinos cómo te llamas
          </Text>

          {/* Mascota */}
          <Text style={styles.label}>Nombre de tu mascota</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ej: Rocky"
              placeholderTextColor="#999"
              value={petName}
              onChangeText={setPetName}
              returnKeyType="next"
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

          {/* Usuario */}
          <Text style={styles.label}>Tu nombre</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={userInputRef}
              style={styles.input}
              placeholder="Ej: Steven"
              placeholderTextColor="#999"
              value={userName}
              onChangeText={setUserName}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[
                styles.inputButton,
                !isUserValid && styles.buttonDisabled,
              ]}
              disabled={!isUserValid}
              onPress={() => Keyboard.dismiss()}
            >
              <Ionicons name="checkmark" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Botón continuar */}
          <TouchableOpacity
            style={[
              styles.mainButton,
              !isFormValid && styles.mainButtonDisabled,
            ]}
            disabled={!isFormValid}
          >
            <Text style={styles.mainButtonText}>Continuar</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 24,
    paddingBottom: 40,
    marginTop: 40,
  },
  logo: {
    width: 140,
    height: 140,
    backgroundColor: '#e0e0e0',
    alignSelf: 'center',
    marginBottom: 20,
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
