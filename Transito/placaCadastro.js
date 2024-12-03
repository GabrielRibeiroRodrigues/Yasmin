import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import FormComponent from '../../components/FormComponent';
import Header from '../../components/HeaderComponent';
import SQLComponent from '../../components/SQLComponent';
import sqlite from '../../components/SQliteComponent';
const headerTitle = "Trânsito";
const headerItems = [
    ['Home', 'HomeTransito'],
    ['Registro de Veículos', 'placaCadastro'],
    ['Lista de Veículos', 'placaCadastro'],
];
const headerColor = '#0051ff';
// const handledelete= async () => {
//     try {
//         await sqlite.deleteRecord('myDatabase.db', 'Cor', 'cor', 'Azul Marinho');
//         console.log('Registro Deletado com sucesso!');
        
//     } catch (error) {
//         console.error('Erro ao Deletar :', error);
//     }
// };
// handledelete();

// const deletarTabela= async () => {
//     try {
//         await sqlite.deleteTable('myDatabase.db', 'Combustivel');
//         console.log('Marca Deletado com sucesso!');
        
//     } catch (error) {
//         console.error('Erro ao Deletar Tabela :', error);
//     }
// };
// deletarTabela();

const fields = [

];

const PlacaCadastro = ({ navigation }) => {
    const [placas, setPlacas] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [modelos, setModelos] = useState([]);
    const [cores, setCores] = useState([]);
    const [combustivel, setCombustivel] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const initializeDatabase = async () => {
        await createVeiculoTable();
        await createMarcaTable();
        await createModeloTable();
        await createCorTable();
        await createCombustivelTable();
        await createMotoristaTable();
    };

    const addPlacasBanco = async (formData) => {
        const { Proprietario, Placa, Marca, Modelo, Cor, Ano, Combustivel, Renavam, Chassi } = formData;
    
        try {
            await SQLComponent.insertRecord('myDatabase.db', 'Veiculos', { 
                proprietario: Proprietario,
                placas: Placa,
                marca_id: Marca,
                modelo_id: Modelo,
                cor_id: Cor,
                ano: Ano,
                combustivel_id: Combustivel,
                renavam: Renavam,
                chassi: Chassi,
            });
            console.log('Dados inseridos com sucesso:', formData);
            carregaPlacaDoBanco();
        } catch (error) {
            console.error('Erro ao inserir dados:', error);
        }
    };
    


const carregaPlacaDoBanco = async () => {
        const registros = await SQLComponent.getAllRecords('myDatabase.db', 'Veiculos'); 
        setPlacas(registros);
    };

const handleSubmit = (formData) => {
        addPlacasBanco(formData);
    };

useEffect(() => {
        initializeDatabase();
        carregaPlacaDoBanco();
        carregaMarcaDoBanco(setMarcas);  
        carregaModeloDoBanco(setModelos);
        carregaCorDoBanco(setCores);  
       carregaCombustivelDoBanco(setCombustivel);  // Atualiza os combustiveis no estado
        // addNovoCombustivelBanco('GAS', setCombustivel); // Atualiza)
    //    addNovaCorBanco('Vermelha', setCores)// Atualiza os modelos no estado
    //    addModeloBanco('McLaren', setModelos); // Atualiza os modelos no estado
    //     addMarcaBanco('Ferrari', setMarcas); // Atualiza
    }, []);

    
return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Header
    title={headerTitle}
    items={headerItems}
    color={headerColor}
    navigation={navigation}
/>;
            <ScrollView contentContainerStyle={styles.scrollContainer}>
            <FormComponent database = {'myDatabase.db'} tabelas = {['Veiculos','Motorista',]} fields={fields} onSubmit={handleSubmit} initialData={{}} 
             ocultar = {'id'} labels = {{proprietario: 'Proprietário',placas:'Placa', modelo_id: 'Modelo',
            marca_id: 'Marca',cor_id: 'Cor',Ano: 'Ano',combustivel_id: 'Combustivel',renavam:'Renavam',
            chassi:'Chassi', nome:'Nome',CNH: 'CNH', Telefone: 'Telefone'}} 
            />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};
const createVeiculoTable = async () => {
    try {
        await SQLComponent.createTable('myDatabase.db', 'Veiculos', [
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'proprietario', type: 'TEXT' },
            { name: 'placas', type: 'TEXT' },
            { name: 'modelo_id', type: 'INTEGER', foreignKey: { table: 'Modelo', column: 'id' } },
            { name: 'marca_id', type: 'INTEGER', foreignKey: { table: 'Marca', column: 'id' } },
            { name: 'cor_id', type: 'INTEGER', foreignKey: { table: 'Cor', column: 'id' }},
            { name: 'Ano', type: 'INTEGER' },
            { name: 'combustivel_id', type: 'INTEGER', foreignKey: { table: 'Combustivel', column: 'id' }},
            { name: 'renavam', type: 'TEXT' },
            { name: 'chassi', type: 'TEXT' },
        ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "Veiculos":', error);
    }
};
const createModeloTable = async () => {
    try {
        await SQLComponent.createTable('myDatabase.db', 'Modelo', [
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'nome', type: 'TEXT' },
        ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "Modelo":', error);
    }
};
const createMotoristaTable = async () => {
    try {
        await SQLComponent.createTable('myDatabase.db', 'Motorista', [
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'nome', type: 'TEXT' },
            { name: 'CNH', type: 'TEXT' },
            { name: 'Telefone', type: 'TEXT' },
        ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "Modelo":', error);
    }
};

const carregaModeloDoBanco = async (setModelos) => {
    try {
        const modelo = await SQLComponent.getAllRecords('myDatabase.db', 'Modelo');
        const ModeloNames = modelo.map(modelo => modelo.modelo); 
        setModelos(ModeloNames); 
        console.log("Modelos carregados:", ModeloNames);
    } catch (error) {
        console.error("Erro ao carregar modelos:", error);
    }
};
const addModeloBanco = async (modelo, setModelos) => {
    try {
        await SQLComponent.insertRecord('myDatabase.db', 'Modelo', { 
            nome: modelo
        });
        // Atualiza os modelos após a inserção
        carregaModeloDoBanco(setModelos);
    } catch (error) {
        console.error("Erro ao inserir o Modelo:", error);
    }
};
const createMarcaTable = async () => {
    try {
        await SQLComponent.createTable('myDatabase.db', 'Marca', [
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'nome', type: 'TEXT' },
        ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "Marca":', error);
    }
};
const addMarcaBanco = async (marca, setMarcas) => {
    try {
        await SQLComponent.insertRecord('myDatabase.db', 'Marca', { 
            nome: marca
        });   
        carregaMarcaDoBanco(setMarcas);
    } catch (error) {
        console.error("Erro ao inserir a marca:", error);
    }
};
const carregaMarcaDoBanco = async (setMarcas) => {
    try {
        const marcas = await SQLComponent.getAllRecords('myDatabase.db', 'Marca');
        const marcasNames = marcas.map(marca => marca.marca); // Extraímos apenas os nomes das marcas
        setMarcas(marcasNames); // Atualiza o estado com as marcas obtidas do banco
        console.log("Marcas carregadas:", marcasNames);
    } catch (error) {
        console.error("Erro ao buscar marcas:", error);
    }
};
const createCorTable = async () => {
    try {
        await SQLComponent.createTable('myDatabase.db', 'Cor', [
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'nome', type: 'TEXT' },
        ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "Cor":', error);
    }}
const carregaCorDoBanco = async (setCores) => {
        try {
            const cor = await SQLComponent.getAllRecords('myDatabase.db', 'Cor');
            const CorNames = cor.map(cor => cor.cor); 
            setCores(CorNames); 
            console.log("Cores carregadas:", CorNames);
        } catch (error) {
            console.error("Erro ao carregar Cores:", error);
        }
    };
const addNovaCorBanco = async (cor, setCores) => {
        try {
            await SQLComponent.insertRecord('myDatabase.db', 'Cor', { 
                nome: cor
            });    
            carregaCorDoBanco(setCores);
        } catch (error) {
            console.error("Erro ao inserir a Cor:", error);
        }
    };
const createCombustivelTable = async () => {
        try {
            await SQLComponent.createTable('myDatabase.db', 'Combustivel', [
                { name: 'id', type: 'INTEGER', primaryKey: true },
                { name: 'nome', type: 'TEXT' },
            ]);
        } catch (error) {
            console.error('Erro ao criar a tabela "combustivel":', error);
        }}
const carregaCombustivelDoBanco = async (setCombustivel) => {
            try {
                const combustivel = await SQLComponent.getAllRecords('myDatabase.db', 'Combustivel');
                const CombustivelNames = combustivel.map(combustivel => combustivel.combustivel);  
                setCombustivel(CombustivelNames); 
                console.log("Combustiveis carregadas:", CombustivelNames);
            } catch (error) {
                console.error("Erro ao carregar Combustiveis:", error);
            }
        };
const addNovoCombustivelBanco = async (combustivel, setCombustivel) => {
            try {
                await SQLComponent.insertRecord('myDatabase.db', 'Combustivel', { 
                    nome: combustivel
                });
                carregaCombustivelDoBanco(setCombustivel);
            } catch (error) {
                console.error("Erro ao inserir a Combustivel:", error);
            }
        };
const styles = StyleSheet.create({
    appContainer: {
        flex: 1,
        flexDirection: 'column',
        width: '100%',
    },
    container: {
        flex: 1,
        backgroundColor: '#f2f2f2',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginVertical: 20,
    },
    subTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 10,
    },
    // scrollContainer: {
    //     paddingHorizontal: 16,
    //     paddingBottom: 30,
    // },
    // record: {
    //     marginBottom: 10,
    //     padding: 10,
    //     backgroundColor: '#e0e0e0',
    //     borderRadius: 5,
    // },
});
export default PlacaCadastro;