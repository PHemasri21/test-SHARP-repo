import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../context/AuthContext';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import TicketQueueScreen from '../screens/TicketQueueScreen';
import CreateTicketScreen from '../screens/CreateTicketScreen';
import TicketDetailScreen from '../screens/TicketDetailScreen';
import PaymentScreen from '../screens/PaymentScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="MainApp" component={TicketQueueScreen} />
          <Stack.Screen name="CreateTicket" component={CreateTicketScreen} options={{ headerShown: true, title: 'New Ticket' }} />
          <Stack.Screen name="TicketDetail" component={TicketDetailScreen} options={{ headerShown: true, title: 'Ticket Details' }} />
          <Stack.Screen name="Payment" component={PaymentScreen} options={{ headerShown: true, title: 'Service Billing & Payment' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}