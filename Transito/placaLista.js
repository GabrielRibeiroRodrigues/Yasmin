    import React, { useState, useEffect } from 'react';
    import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
    import Header from '../../components/HeaderComponent';
    import sqlite from '../../components/SQliteComponent';
    import DataTable from '../../components/ListDataComponent';

    const headerTitle = "Trânsito";
    const headerItems = [
        ['Home', 'HomeTransito'],
        ['Registro de Veículos', 'placaCadastro'],
        ['Lista de Veículos', 'placaLista'],
    ];
    const headerColor = '#0051ff';

    const PlacaLista = ({ navigation }) => {
        const [placas, setPlacas] = useState([]);
        const [marcas, setModelos] = useState([]);
        // Carregar placas do banco de dados
        const carregaPlacasDoBanco = async () => {

            const registros = await sqlite.getRecords('transito', 'Veiculos');
            console.log(registros);
            setPlacas(registros); // Atualize o estado com os dados carregados

        };

        const carregaMarcasDoBanco = async () => {

            const registrosMarcas = await sqlite.getRecords('transito', 'Marca');
            console.log(registrosMarcas);
            setPlacas(registrosMarcas); // Atualize o estado com os dados carregados

        };

        // Executado na primeira renderização
        useEffect(() => {
            carregaPlacasDoBanco();
        }, []);

        // Função para filtrar placas com base na pesquisa


        // Função para navegar para os detalhes da placa
        const goToPlacaDetails = (placa) => {
            // Passar o objeto inteiro da placa para a tela de detalhes
            navigation.navigate('placaDetalhada', { placa });
        };
        
        return (<View>
            
                <Header
    title={headerTitle}
    items={headerItems}
    color={headerColor}
    navigation={navigation}
/>            
                    <DataTable
                databaseName="transito"
                tableName="Veiculos"
                fields={['placas', 'proprietario']} 
            />          
</View>
        );
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            padding: 16,
            backgroundColor: '#fff',
        },
        appContainer: {
            flex: 1,
            flexDirection: 'column',
            width: '100%',
        },
        searchInput: {
            height: 40,
            borderColor: '#ccc',
            borderWidth: 1,
            borderRadius: 8,
            marginBottom: 10,
            paddingLeft: 10,
            fontSize: 16,
        },
        refreshButton: {
            backgroundColor: '#007BFF',
            padding: 10,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: 10,
        },
        refreshButtonText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
        },
        recordButton: {
            marginVertical: 8,
            padding: 16,
            backgroundColor: '#f8f9fa',
            borderRadius: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
        },
        recordText: {
            fontSize: 16,
        },
    });

    export default PlacaLista;