import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Header from '../../components/HeaderComponent';
const headerTitle = "Trânsito";
const headerItems = [
    ['Home', 'HomeTransito'],
    ['Registro de Veículos', 'placaCadastro'],
    ['Lista de Veículos', 'placaLista'],
];
const headerColor = '#0051ff';
const HomeScreen = ({ navigation }) => {
    return (
        <View style={styles.appContainer}>
     
            <Header
    title={headerTitle}
    items={headerItems}
    color={headerColor}
    navigation={navigation}
/>
            <View style={styles.container}>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('placaCadastro')}
                >
                    <Text style={styles.buttonText}>Registro de Veículo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('placaLista')}
                >
                    <Text style={styles.buttonText}>Lista de Veículos</Text>
                </TouchableOpacity>
              
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    appContainer: {
        flex: 1,
        flexDirection: 'column',
        width: '100%',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    title: {
        fontSize: 24,
        marginBottom: 50,
    },
    button: {
        width: 250,
        height: 50,
        backgroundColor: '#0051ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginVertical: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default HomeScreen;