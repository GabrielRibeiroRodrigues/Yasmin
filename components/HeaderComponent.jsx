import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function Header({ title, items, color, navigation }) {
  const [menuVisible, setMenuVisible] = useState(false);

  const handleMenuToggle = () => {
    setMenuVisible(!menuVisible);
  };

  const handleLogout = () => {
    setMenuVisible(false);
    // Aqui você pode adicionar a função de logout
  };


  return (
    <View style={[styles.header, { backgroundColor: color }]}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={handleMenuToggle} style={styles.menuButton}>
          <MaterialIcons name="menu" size={28} color="#fff" />
        </Pressable>
      </View>

      {/* Modal para o menu expansível */}
      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: '#fff' }]}>
          <Pressable style={styles.closeButton} onPress={handleMenuToggle}>
            <MaterialIcons name="close" size={28} color={color} />
          </Pressable>

          <ScrollView contentContainerStyle={styles.menuItems}>
            {items.map((item, index) => (
              <View key={index} style={styles.menuItemContainer}>
                <Pressable
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate(item[1]);
                  }}
                  style={styles.menuItem}
                >
                  <Text style={[styles.menuItemText, { color: color }]}>
                    {item[0]}
                  </Text>
                </Pressable>
                {index < items.length && (
                  <View style={[styles.separator, { backgroundColor: color }]} />
                )}
              </View>
            ))}

            <View style={styles.menuItemContainer}>
              <Pressable onPress={handleLogout} style={styles.menuItem}>
                <Text style={[styles.menuItemText, { color: color }]}>
                  Logout
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 7,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 30,
    right: 20,
  },
  menuItems: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemContainer: {
    width: '100%',
    alignItems: 'center',
  },
  menuItem: {
    paddingVertical: 15,
  },
  menuItemText: {
    fontSize: 26,  // Aumentar o tamanho do texto
    fontWeight: 'bold',  // Definir o texto em negrito
  },
  separator: {
    width: '80%',        // Largura da barra
    height: 2,           // Altura da barra fina
    marginVertical: 10,
  },
});