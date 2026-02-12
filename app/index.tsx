import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [petName, setPetName] = useState('');
  const [userName, setUserName] = useState('');

  const userInputRef = useRef<TextInput>(null);

  // Animaciones inputs
  const petAnim = useRef(new Animated.Value(1)).current;
  const userAnim = useRef(new Animated.Value(1)).current;

  // Animación botón
  const buttonAnim = useRef(new Animated.Value(1)).current;

  const focusInput = (anim: Animated.Value) => {
    Animated.spring(anim, {
      toValue: 1.02,
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

  const handleContinue = async () => {
    if (!isFormValid) return;

    // Guardar datos iniciales
    await AsyncStorage.setItem('petName', petName);
    await AsyncStorage.setItem('userName', userName);
    await AsyncStorage.setItem('hasOnboarded', 'true');

    // Ir a elegir mascota
    router.replace('/choose-pet');
  };

  const dynamicStyles = getDynamicStyles(colors);

  return (
    <SafeAreaView style={[styles.root, dynamicStyles.root]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            {/* Logo/Icono moderno */}
            <View style={[styles.logoContainer, dynamicStyles.logoContainer]}>
              <Image
                source={require('../assets/images/icons/icon.png')}
                style={styles.appIcon}
                resizeMode="cover"
              />
            </View>

            {/* Títulos modernos */}
            <Text style={[styles.title, dynamicStyles.title]}>¡Bienvenido!</Text>
            <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
              Comencemos configurando tu perfil
            </Text>

            {/* Input Mascota */}
            <View style={styles.inputSection}>
              <Text style={[styles.label, dynamicStyles.label]}>Nombre de tu mascota</Text>
              <Animated.View style={{ transform: [{ scale: petAnim }] }}>
                <View style={[styles.inputWrapper, dynamicStyles.inputWrapper]}>
                  <Ionicons name="paw" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, dynamicStyles.input]}
                    placeholder="Ej: Rocky"
                    placeholderTextColor={colors.textTertiary}
                    value={petName}
                    onChangeText={setPetName}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onFocus={() => focusInput(petAnim)}
                    onBlur={() => blurInput(petAnim)}
                    onSubmitEditing={() => userInputRef.current?.focus()}
                  />
                  {isPetValid && (
                    <View style={[styles.checkIcon, { backgroundColor: colors.success + '20' }]}>
                      <Ionicons name="checkmark" size={16} color={colors.success} />
                    </View>
                  )}
                </View>
              </Animated.View>
            </View>

            {/* Input Usuario */}
            <View style={styles.inputSection}>
              <Text style={[styles.label, dynamicStyles.label]}>Tu nombre</Text>
              <Animated.View style={{ transform: [{ scale: userAnim }] }}>
                <View style={[styles.inputWrapper, dynamicStyles.inputWrapper]}>
                  <Ionicons name="person" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    ref={userInputRef}
                    style={[styles.input, dynamicStyles.input]}
                    placeholder="Ej: Steven"
                    placeholderTextColor={colors.textTertiary}
                    value={userName}
                    onChangeText={setUserName}
                    returnKeyType="done"
                    onFocus={() => focusInput(userAnim)}
                    onBlur={() => blurInput(userAnim)}
                    onSubmitEditing={Keyboard.dismiss}
                  />
                  {isUserValid && (
                    <View style={[styles.checkIcon, { backgroundColor: colors.success + '20' }]}>
                      <Ionicons name="checkmark" size={16} color={colors.success} />
                    </View>
                  )}
                </View>
              </Animated.View>
            </View>

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
                  { backgroundColor: colors.primary },
                  !isFormValid && styles.mainButtonDisabled,
                  { transform: [{ scale: buttonAnim }] },
                ]}
              >
                <Text style={styles.mainButtonText}>Continuar</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getDynamicStyles = (colors: any) => StyleSheet.create({
  root: {
    backgroundColor: colors.background,
  },
  logoContainer: {
    backgroundColor: colors.surface,
  },
  title: {
    color: colors.text,
  },
  subtitle: {
    color: colors.textSecondary,
  },
  label: {
    color: colors.textSecondary,
  },
  inputWrapper: {
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    color: colors.text,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    alignSelf: 'center',
    marginBottom: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  appIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '400',
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    position: 'relative',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButton: {
    marginTop: 40,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButtonDisabled: {
    opacity: 0.5,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
