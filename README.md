# Rutina App 📱

Una aplicación moderna y elegante para gestionar tus rutinas diarias, con sistema de logros, estadísticas y mucho más.

## 📋 Características Principales

### ✅ Gestión de Rutinas
- Crear, editar y eliminar rutinas personalizadas
- Agregar y reordenar tareas dentro de cada rutina
- Sistema de puntos XP por cada tarea completada
- Rutinas recurrentes (diarias o semanales)
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

### 📅 Calendario
- Vista mensual y semanal
- Agregar eventos a fechas específicas
- Visualización clara de días con eventos

### 📝 Notas
- Crear y gestionar notas personalizadas
- Colores personalizables
- Sistema de notas fijadas (pinned)
- Buscar y organizar notas

### 🌓 Tema Oscuro/Claro
- Soporte completo para modo claro y oscuro
- Persistencia de preferencia del usuario
- Diseño consistente en ambos modos

### 💾 Backup y Restauración
- Crear backups de todos tus datos
- Restaurar desde archivos JSON
- Exportar datos para análisis externo


## 📁 Estructura del Proyecto

```
rutina_App/
├── app/                      # Pantallas de la aplicación
│   ├── (tabs)/              # Navegación por pestañas
│   │   ├── home.tsx         # Pantalla principal - Muestra rutina activa
│   │   ├── routines.tsx     # Lista de todas las rutinas
│   │   └── profile.tsx      # Perfil del usuario
│   ├── calendar.tsx         # Calendario y eventos
│   ├── notes.tsx            # Lista de notas
│   ├── edit-note.tsx        # Crear/editar nota
│   ├── edit-routine.tsx     # Crear/editar rutina
│   ├── achievements.tsx     # Pantalla de logros
│   ├── stats.tsx            # Estadísticas detalladas
│   ├── backup.tsx           # Backup y restauración
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
│   └── backup.ts            # Funciones de backup/restore
├── contexts/                # Contextos de React
│   └── ThemeContext.tsx     # Contexto de tema (claro/oscuro)
└── constants/               # Constantes
    └── theme.ts             # Colores y estilos del tema
```

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm start
```

## 📱 Tecnologías Utilizadas

- **React Native** - Framework principal
- **Expo Router** - Navegación entre pantallas
- **AsyncStorage** - Almacenamiento local persistente
- **TypeScript** - Tipado estático

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

