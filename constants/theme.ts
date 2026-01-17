export type ColorScheme = 'light' | 'dark';

export const LightColors = {
  primary: '#6366f1', // Indigo moderno
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  secondary: '#8b5cf6', // Púrpura
  accent: '#06b6d4', // Cyan
  success: '#10b981', // Verde esmeralda
  warning: '#f59e0b', // Ámbar
  error: '#ef4444', // Rojo
  background: '#ffffff',
  surface: '#f8fafc',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const DarkColors = {
  primary: '#818cf8', // Indigo más claro para dark
  primaryLight: '#a5b4fc',
  primaryDark: '#6366f1',
  secondary: '#a78bfa', // Púrpura más claro
  accent: '#22d3ee', // Cyan más claro
  success: '#34d399', // Verde más claro
  warning: '#fbbf24', // Ámbar más claro
  error: '#f87171', // Rojo más claro
  background: '#0f172a', // Azul muy oscuro
  surface: '#1e293b', // Azul oscuro
  card: '#1e293b',
  text: '#f1f5f9', // Casi blanco
  textSecondary: '#cbd5e1', // Gris claro
  textTertiary: '#94a3b8', // Gris medio
  border: '#334155', // Gris oscuro
  borderLight: '#475569',
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

export const getThemeColors = (scheme: ColorScheme) => {
  return scheme === 'dark' ? DarkColors : LightColors;
};
