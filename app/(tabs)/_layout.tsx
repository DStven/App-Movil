import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopWidth: 0,
          backgroundColor: '#ffffff',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={26}
              color={focused ? '#ff3b3b' : '#999'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="routines"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'list' : 'list-outline'}
              size={26}
              color={focused ? '#ff3b3b' : '#999'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={26}
              color={focused ? '#ff3b3b' : '#999'}
            />
          ),
        }}
      />
    </Tabs>
  );
}
