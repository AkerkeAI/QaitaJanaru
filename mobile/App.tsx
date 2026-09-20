import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import ServicesScreen from './src/screens/ServicesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RankingsScreen from './src/screens/RankingsScreen';
import RewardsScreen from './src/screens/RewardsScreen';
import ServicePlaceholderScreen from './src/screens/ServicePlaceholderScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';
import { colors } from './src/theme';

export type AuthStackParamList = { SignIn: undefined; SignUp: undefined; ForgotPassword: undefined };
export type AppStackParamList = {
  Tabs: undefined; Rankings: undefined; Rewards: undefined; Achievements: undefined; Settings: undefined;
  Map: { title: string; description: string }; WasteGuide: { title: string; description: string };
  Challenges: { title: string; description: string }; Activity: { title: string; description: string };
  Quiz: { title: string; description: string }; EcoHero: { title: string; description: string };
};
export type RootTabParamList = { Home: undefined; Scan: undefined; Services: undefined; Profile: undefined };

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();
const AuthStackNavigator = createNativeStackNavigator<AuthStackParamList>();

function Tabs() {
  const { t } = useLanguage();
  return <Tab.Navigator initialRouteName="Home" screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, borderTopWidth: 1, height: 82, paddingBottom: 12, paddingTop: 8 }, tabBarLabelStyle: { fontSize: 12, fontWeight: '700' }, tabBarLabel: t(`nav.${route.name.toLowerCase()}`), tabBarIcon: ({ color, size, focused }) => { const icons = { Home: focused ? 'home' : 'home-outline', Scan: focused ? 'scan' : 'scan-outline', Services: focused ? 'grid' : 'grid-outline', Profile: focused ? 'person' : 'person-outline' } as const; return <Ionicons name={icons[route.name]} size={size} color={color} />; } })}><Tab.Screen name="Home" component={HomeScreen} /><Tab.Screen name="Scan" component={ScanScreen} /><Tab.Screen name="Services" component={ServicesScreen} /><Tab.Screen name="Profile" component={ProfileScreen} /></Tab.Navigator>;
}

const placeholderRoutes = [
  ['Map', 'Recycling Map', 'Find nearby recycling points and collection centers.'],
  ['WasteGuide', 'Waste Guide', 'Browse waste categories and learn how to prepare items.'],
  ['Challenges', 'Challenges', 'All active and completed eco challenges.'],
  ['Activity', 'My Activity', 'Your recycling and scan history will appear here.'],
  ['Quiz', 'Eco Quiz', 'Short educational sustainability quizzes.'],
  ['EcoHero', 'EcoHero Card', 'Your digital eco identity and progress card.'],
] as const;

function AppStack() { return <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}><Stack.Screen name="Tabs" component={Tabs} /><Stack.Screen name="Rankings" component={RankingsScreen} /><Stack.Screen name="Rewards" component={RewardsScreen} /><Stack.Screen name="Achievements" component={AchievementsScreen} /><Stack.Screen name="Settings" component={SettingsScreen} />{placeholderRoutes.map(([name, title, description]) => <Stack.Screen key={name} name={name} component={ServicePlaceholderScreen} initialParams={{ title, description }} />)}</Stack.Navigator>; }
function AuthStack() { return <AuthStackNavigator.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}><AuthStackNavigator.Screen name="SignIn" component={SignInScreen} /><AuthStackNavigator.Screen name="SignUp" component={SignUpScreen} /><AuthStackNavigator.Screen name="ForgotPassword" component={ForgotPasswordScreen} /></AuthStackNavigator.Navigator>; }

function AppContent() {
  const { user, loading } = useAuth(); const { ready, t } = useLanguage();
  if (loading || !ready) return <View style={styles.loading}><View style={styles.logo}><Ionicons name="leaf" size={26} color={colors.card} /></View><Text style={styles.loadingText}>QaitaJanaru</Text><ActivityIndicator color={colors.primary} style={styles.spinner} /><Text style={styles.loadingLabel}>{t('common.loading')}</Text></View>;
  return <NavigationContainer>{user ? <AppStack /> : <AuthStack />}</NavigationContainer>;
}

export default function App() { return <LanguageProvider><AuthProvider><AppContent /></AuthProvider></LanguageProvider>; }

const styles = StyleSheet.create({ loading: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center' }, logo: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 18, height: 58, justifyContent: 'center', width: 58 }, loadingText: { color: colors.ink, fontSize: 24, fontWeight: '800', marginTop: 16 }, spinner: { marginTop: 30 }, loadingLabel: { color: colors.muted, fontSize: 13, marginTop: 10 } });
