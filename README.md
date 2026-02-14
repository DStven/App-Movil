# Rutina App 📱

Una aplicación moderna y elegante para gestionar tus rutinas diarias, con sistema de logros, estadísticas y mucho más.

## 📋 Características Principales

### ✅ Gestión de Rutinas
- Crear, editar y eliminar rutinas personalizadas
- Agregar y reordenar tareas dentro de cada rutina
- Sistema de puntos XP por cada tarea completada
- Duplicar rutinas existentes
- Plantillas predefinidas para crear rutinas rápidamente

### 🏆 Sistema de Logros
- 8 logros desbloqueables
- Verificación automática al completar rutinas
- Pantalla dedicada para ver tu progreso

### 📊 Estadísticas Avanzadas
- Vista semanal con gráficos de actividad
- Estadísticas mensuales
- Seguimiento de rachas (current y best streak)
- Historial de rutinas completadas

### 📝 Notas
- Crear y gestionar notas personalizadas
- Colores personalizables
- Sistema de notas fijadas (pinned)
- Buscar y organizar notas

### 🌓 Tema
- Tema claro por defecto (modo oscuro deshabilitado)
- Diseño consistente en el tema

### 💾 Backup y Restauración
Actualmente deshabilitado en esta versión.


## 📁 Estructura del Proyecto

```
rutina_App/
├── app/                      # Pantallas de la aplicación
│   ├── (tabs)/              # Navegación por pestañas
│   │   ├── home.tsx         # Pantalla principal - Muestra rutina activa
│   │   ├── routines.tsx     # Lista de todas las rutinas
│   │   └── profile.tsx      # Perfil del usuario
│   ├── notes.tsx            # Lista de notas
│   ├── edit-note.tsx        # Crear/editar nota
│   ├── edit-routine.tsx     # Crear/editar rutina
│   ├── achievements.tsx     # Pantalla de logros
│   ├── stats.tsx            # Estadísticas detalladas
│   ├── settings.tsx         # Configuración de la app
│   ├── routine-templates.tsx # Plantillas de rutinas
│   ├── choose-pet.tsx       # Selección de mascota
│   └── index.tsx            # Pantalla de onboarding
├── storage/                 # Gestión de datos locales
│   ├── achievements.ts      # Lógica de logros
│   ├── routineHistory.ts    # Historial de rutinas
│   ├── routineTemplates.ts  # Plantillas predefinidas
│   ├── notes.ts             # Gestión de notas
│   ├── streak.ts            # Sistema de rachas
│   └── userProgress.ts      # Progreso y XP del usuario
├── utils/                   # Utilidades
├── contexts/                # Contextos de React
│   └── ThemeContext.tsx     # Contexto de tema (claro/oscuro)
    ├── utils/                   # Utilidades
        
    ├── contexts/                # Contextos de React
    │   └── ThemeContext.tsx     # Contexto de tema (claro)
└── constants/               # Constantes
    └── theme.ts             # Colores y estilos del tema
```

## � Requisitos Previos

- **Node.js** v18 o superior
- **npm** o **yarn**
- **Expo CLI** (se instala automáticamente con las dependencias)
- Un teléfono con la app **Expo Go** para probar en dispositivo, o un emulador

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo con Expo
npx expo start
```

### Comandos Disponibles

```bash
# Iniciar en modo desarrollo interactivo
npx expo start

# Abrir en iOS (requiere macOS)
npx expo start --ios

# Abrir en Android (requiere Android Studio/emulador)
npx expo start --android

# Abrir en navegador web
npx expo start --web

# Limpiar caché y reiniciar
npx expo start --clear

# Build para producción (iOS y Android)
npx eas build

# Preview de la build en dispositivo
npx eas build --platform android --profile preview
npx eas build --platform ios --profile preview
```

## 📱 Tecnologías Utilizadas

- **Expo** - Plataforma de desarrollo para React Native
- **React Native** - Framework principal para aplicaciones móviles
- **Expo Router** - Navegación entre pantallas con soporte de deep linking
- **AsyncStorage** - Almacenamiento local persistente de datos
- **TypeScript** - Tipado estático para mayor seguridad
- **React Context** - Gestión de estado global (tema)

## 🎨 Características de Diseño

- **Minimalista y moderno**: Diseño limpio y fácil de usar
- **Consistente**: Mismo lenguaje visual en toda la app
- **Accesible**: Colores y contrastes adecuados
- **Responsive**: Se adapta a diferentes tamaños de pantalla

## 📝 Notas de Desarrollo

- Los datos se guardan localmente usando AsyncStorage
- El sistema de rachas se resetea automáticamente si no completas todas las rutinas del día

## 🔧 Próximas Mejoras

- [ ] Sincronización en la nube
- [ ] Modo offline mejorado
- [ ] Más plantillas de rutinas
- [ ] Widgets para pantalla de inicio
- [ ] Exportar estadísticas en PDF

---

