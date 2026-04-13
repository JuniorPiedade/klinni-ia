import React, { useState } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Componentes de Exemplo para as Abas
const Dashboard = () => (
  <View style={styles.contentContainer}>
    <Text style={styles.title}>Dashboard</Text>
    <View style={styles.card}>
      <Text style={styles.cardText}>Bem-vindo ao Klinni IA</Text>
    </View>
  </View>
);

const Leads = () => (
  <View style={styles.contentContainer}>
    <Text style={styles.title}>Gestão de Leads</Text>
    <Text style={styles.subtitle}>Nenhum lead pendente no momento.</Text>
  </View>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#fdfbfb', '#ebedee']}
        style={styles.background}
      />
      
      {/* Header com Logo Ajustada */}
      <View style={styles.header}>
        <Text style={styles.logoText}>
          KLINNI <Text style={styles.logoHighlight}>IA</Text>
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'dashboard' ? <Dashboard /> : <Leads />}
      </ScrollView>

      {/* Menu Inferior */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>
            Início
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab('leads')}
        >
          <Text style={[styles.tabText, activeTab === 'leads' && styles.activeTabText]}>
            Leads
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2, // Espaçamento solicitado
    color: '#333',
  },
  logoHighlight: {
    color: '#6366f1',
  },
  scrollContent: {
    padding: 20,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, // Soft Shadows
    shadowRadius: 10,
    elevation: 3,
  },
  cardText: {
    fontSize: 16,
    color: '#444',
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    color: '#888',
  },
  activeTabText: {
    color: '#6366f1',
    fontWeight: 'bold',
  },
});
