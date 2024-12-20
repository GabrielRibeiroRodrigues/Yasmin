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
    ['Lista de Veículos', 'placaLista'],
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
//         await sqlite.deleteTables(['transito'], ['teste']);
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
    const [motoristas, setMotoristas] = useState([]);


    const initializeDatabase = async () => {
        await createVeiculoTable();
        await createMarcaTable();
        await createModeloTable();
        await createCorTable();
        await createCombustivelTable();
        await createMotoristaTable();
        await createVeiculoMotorista(); //
        await createTeste();
    };

const addPlacasBanco = async (formData) => {
        const { Proprietario, Placa, Marca, Modelo, Cor, Ano, Combustivel, Renavam, Chassi } = formData;
    
        try {
            await SQLComponent.insertRecord('transito', 'Veiculos', { 
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
            console.log('Dados inseridos com sucesso, ID do veículo:', idVeiculo);
            return idVeiculo;
            carregaPlacaDoBanco();
        } catch (error) {
            console.error('Erro ao inserir dados:', error);
        }
    };
const carregaPlacaDoBanco = async () => {
        const registros = await SQLComponent.getAllRecords('transito', 'Veiculos'); 
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
       carregaMotoristaDoBanco(setMotoristas);
    //     addNovoCombustivelBanco('Gasolina', setCombustivel); // Atualiza)
    //    addNovaCorBanco('Branco', setCores)// Atualiza os modelos no estado
    //    addModeloBanco('KA', setModelos); // Atualiza os modelos no estado
    //     addMarcaBanco('Ford', setMarcas); // Atualiza
    // addMotoristaBanco(
    //     { nome: 'Paulo Santos', CNH: '1234567890', Telefone: '(11) 98765-4321' },
    //     setMotoristas
    // );
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
/> 
            <ScrollView>
            <FormComponent 
            database = {'transito'} 
            tabelas = {['teste']} 
            fields={fields}  
            initialData={{}} 
             ocultar = {['id','Veiculos_id']} 
             labels = {{
                            placas: "Placa",
                            proprietario: "Proprietario",
                            modelo_id: "Modelo",
                            marca_id:"Marca",
                            cor_id:"Cor",
                            ano: "Ano",
                            combustivel_id: "Combustivel",
                            renavam:"Renavam",
                            chassi:"Chassi",
                            Motorista_id : "Motorista"}}  
            barraPersonalizada={{
                            Veiculos: 'Veículo',
                            VeiculoMotorista: 'Motorista'}}
            TipoSub={"CRIAR"} 
            labelsInline={{
                            VeiculoMotorista : "Motorista"}}
            />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};
const createVeiculoTable = async () => {
    try {
        await SQLComponent.createTable('transito', 'Veiculos', [
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'proprietario', type: 'TEXT' },
            { name: 'placas', type: 'TEXT' },
            { name: 'marca_id', type: 'INTEGER', foreignKey: { table: 'Marca', column: 'id' } },
            { name: 'modelo_id', type: 'INTEGER', foreignKey: { table: 'Modelo', column: 'id' } },
            { name: 'cor_id', type: 'INTEGER', foreignKey: { table: 'Cor', column: 'id' }},
            { name: 'ano', type: 'INTEGER' },
            { name: 'combustivel_id', type: 'INTEGER', foreignKey: { table: 'Combustivel', column: 'id' }},
            { name: 'renavam', type: 'TEXT' },
            { name: 'chassi', type: 'TEXT' },
        ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "Veiculos":', error);
    }
};
const createVeiculoMotorista = async () => {
    try {
        await SQLComponent.createTable('transito', 'VeiculoMotorista',[
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'Veiculos_id', type: 'INTEGER', foreignKey: { table: 'Veiculos', column: 'id' }},
            { name: 'Motorista_id', type: 'INTEGER', foreignKey: { table: 'Motorista', column: 'id' }},
        ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "VeiculoMotorista":', error);
    }
};
const createTeste = async () => {
    try {
        await SQLComponent.createTable('transito', 'Teste',[
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'cpf', type: 'TEXT '},
            { name: 'rg', type: 'TEXT'},
            { name: 'data', type: 'TEXT'},
            { name: 'telefone', type: 'TEXT'},
            { name: 'valor', type: 'TEXT'},
            { name: 'ano', type: 'TEXT'},
        ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "VeiculoMotorista":', error);
    }
};

const createModeloTable = async () => {
    try {
        await SQLComponent.createTable('transito', 'Modelo', [
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'nome', type: 'TEXT' },
        ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "Modelo":', error);
    }
};

const createMotoristaTable = async () => {
    try {
        await SQLComponent.createTable('transito', 'Motorista', [
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'nome', type: 'TEXT' },
            { name: 'CNH', type: 'TEXT' },
            { name: 'Telefone', type: 'TEXT' },
        ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "Modelo":', error);
    }
};
const carregaMotoristaDoBanco = async (setMotoristas) => {
    try {
        const motoristas = await SQLComponent.getAllRecords('transito', 'Motorista');
        console.log("Motoristas carregados do banco:", motoristas);
        const motoristaNames = motoristas.map(motorista => motorista.id); // Obtém apenas os nomes dos motoristas
        setMotoristas(motoristaNames); // Atualiza o estado com os motoristas obtidos do banco
        console.log("Motoristas para o picker:", motoristaNames);
    } catch (error) {
        console.error("Erro ao carregar motoristas:", error);
    }
};

const addMotoristaBanco = async (motorista, setMotoristas) => {
    try {
        await SQLComponent.insertRecord('transito', 'Motorista', { 
            nome: motorista.nome,
            CNH: motorista.CNH,
            Telefone: motorista.Telefone
        });
        carregaMotoristaDoBanco(setMotoristas); // Atualiza os motoristas após a inserção
    } catch (error) {
        console.error("Erro ao inserir o motorista:", error);
    }
};
const carregaModeloDoBanco = async (setModelos) => {
    try {
        const modelo = await SQLComponent.getAllRecords('transito', 'Modelo');
        const ModeloNames = modelo.map(modelo => modelo.modelo); 
        setModelos(ModeloNames); 
        console.log("Modelos carregados:", ModeloNames);
    } catch (error) {
        console.error("Erro ao carregar modelos:", error);
    }
};
const addModeloBanco = async (modelo, setModelos) => {
    try {
        await SQLComponent.insertRecord('transito', 'Modelo', { 
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
        await SQLComponent.createTable('transito', 'Marca', [
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'nome', type: 'TEXT' },
        ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "Marca":', error);
    }
};
const addMarcaBanco = async (marca, setMarcas) => {
    try {
        await SQLComponent.insertRecord('transito', 'Marca', { 
            nome: marca
        });   
        carregaMarcaDoBanco(setMarcas);
    } catch (error) {
        console.error("Erro ao inserir a marca:", error);
    }
};
const carregaMarcaDoBanco = async (setMarcas) => {
    try {
        const marcas = await SQLComponent.getAllRecords('transito', 'Marca');
        const marcasNames = marcas.map(marca => marca.marca); // Extraímos apenas os nomes das marcas
        setMarcas(marcasNames); // Atualiza o estado com as marcas obtidas do banco
        console.log("Marcas carregadas:", marcasNames);
    } catch (error) {
        console.error("Erro ao buscar marcas:", error);
    }
};
const createCorTable = async () => {
    try {
        await SQLComponent.createTable('transito', 'Cor', [
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'nome', type: 'TEXT' },
        ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "Cor":', error);
    }}
const carregaCorDoBanco = async (setCores) => {
        try {
            const cor = await SQLComponent.getAllRecords('transito', 'Cor');
            const CorNames = cor.map(cor => cor.cor); 
            setCores(CorNames); 
            console.log("Cores carregadas:", CorNames);
        } catch (error) {
            console.error("Erro ao carregar Cores:", error);
        }
    };
const addNovaCorBanco = async (cor, setCores) => {
        try {
            await SQLComponent.insertRecord('transito', 'Cor', { 
                nome: cor
            });    
            carregaCorDoBanco(setCores);
        } catch (error) {
            console.error("Erro ao inserir a Cor:", error);
        }
    };
const createCombustivelTable = async () => {
        try {
            await SQLComponent.createTable('transito', 'Combustivel', [
                { name: 'id', type: 'INTEGER', primaryKey: true },
                { name: 'nome', type: 'TEXT' },
            ]);
        } catch (error) {
            console.error('Erro ao criar a tabela "combustivel":', error);
        }}
const carregaCombustivelDoBanco = async (setCombustivel) => {
            try {
                const combustivel = await SQLComponent.getAllRecords('transito', 'Combustivel');
                const CombustivelNames = combustivel.map(combustivel => combustivel.combustivel);  
                setCombustivel(CombustivelNames); 
                console.log("Combustiveis carregadas:", CombustivelNames);
            } catch (error) {
                console.error("Erro ao carregar Combustiveis:", error);
            }
        };
const addNovoCombustivelBanco = async (combustivel, setCombustivel) => {
            try {
                await SQLComponent.insertRecord('transito', 'Combustivel', { 
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
    // header: {
        
    //     width: '100%'},  // Garante que a header ocupe toda a largura
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