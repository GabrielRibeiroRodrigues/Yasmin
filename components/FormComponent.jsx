import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, TextInput, Button, Pressable, 
  ScrollView, Image, LayoutAnimation, Platform,TouchableOpacity 
} from 'react-native';
import { Checkbox } from 'expo-checkbox';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import databasee from '../components/SQliteComponent';
import * as SQLite from 'expo-sqlite';
import sqlite from '../components/SQliteComponent';

const FormComponent = ({database,tabelas = [],fields = [],onSubmit,initialData = [{}],ocultar = [],labels = [],}) => {
const [formData, setFormData] = useState(initialData);
const [campos, setCampos] = useState(null);
const [valor, setValor] = useState({});
const [currentTableIndex, setCurrentTableIndex] = useState(0);
const [schemas, setSchemas] = useState([]);
const [fkLoaded, setFkLoaded] = useState(false); 
const [inlineFields, setInlineFields] = useState({});
const [FK, setFK] = useState({});

useEffect(() => {
  const initialInlineFields = {};
  fields.forEach(field => {
    if (field[0] === 'inline') {
      initialInlineFields[field[1]] = [''];
    }
  });
  setInlineFields(initialInlineFields);

}, []);
const renderNavigationBar = () => {
  return (
    <View style={styles.navBar}>
      {tabelas.map((table, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => setCurrentTableIndex(index)}
          style={[
            styles.navItem,
            currentTableIndex === index && styles.activeNavItem,
          ]}
        >
          <Text style={styles.navText}>{table}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const carregaForeignKeys = async (fk) => {
  const results = {};
  try {
    for (const key in fk) {
      const { databaseName, tableName, displayField } = fk[key];
      const registros = await sqlite.getAllRecords(databaseName, tableName);
      results[key] = registros.map((registro) => registro[displayField]);
    }
    setValor(results);
    
  } catch (error) {
    console.error("Erro ao carregar chaves estrangeiras:", error);
  }
};

useEffect(() => {
  setFormData(initialData); 
}, [initialData]);

useEffect(() => {
  const fetchSchemas = async () => {
    try {
      if (!database || tabelas.length === 0) return; 
      const tabelaAtual = tabelas[currentTableIndex]; 
      const schema = await sqlite.getTableSchema(database, tabelaAtual);
      const fkk = await todasFkPopuladas(database, tabelaAtual);

      setFK((prevFK) => {
        if (JSON.stringify(prevFK) !== JSON.stringify(fkk)) {
          return fkk; 
        }
        return prevFK;
      });

   
      // console.log("Chaves Estrangeiras:", fkk);
      const camposGerados = gerarFields(schema, ocultar);
      setCampos(camposGerados);
    } catch (error) {
      console.error("Erro ao carregar esquemas:", error);
    }
  };

  fetchSchemas();
}, [database, tabelas, currentTableIndex, ocultar,valor]);

useEffect(() => {
  const fetchForeignKeys = async () => {
    if (fkLoaded || Object.keys(FK).length === 0) return; 
    try {
      await carregaForeignKeys(FK);

      setFkLoaded(true); 
    } catch (error) {
      console.error("Erro ao carregar chaves estrangeiras:", error);
    }
  };

  fetchForeignKeys();
}, [FK, fkLoaded]); 


const gerarFields = (tipos, campos_ocultos) => {
  if (!Array.isArray(tipos)) return [];
  return tipos
    .map(({ dataType, columnName, isForeignKey }) => {
      if (!isForeignKey && !campos_ocultos.includes(columnName) && currentTableIndex == 0) {
        return ["text", columnName];
      } else if (isForeignKey && !campos_ocultos.includes(columnName)) {
        const pickerOptions = valor[columnName] || []; // Verifica se `valor` está pronto
        return ["picker", columnName, pickerOptions]; // Garante que o campo com FK seja um picker
      }else if(!isForeignKey && currentTableIndex > 0 && !campos_ocultos.includes(columnName)){
        return ["inline", columnName];
      }
    })
    .filter(Boolean);
};

const todasFkPopuladas = async (databaseName, tableName, displayFields) => {
  const schema = await sqlite.obterForKeyInfo(databaseName, tableName);
  const fkMap = {};
  schema.forEach((column) => {
    if (column.isForeignKey && column.relationship) {
      const { columnName, relationship } = column;
      fkMap[columnName] = {
        databaseName: relationship.databaseName,
        tableName: relationship.tableName,
        fieldName: relationship.fieldName,
        displayField: 'nome' || null, 
      };
    }
  });

  return fkMap;
};


const handleInputChange = (name, value) => {
  setFormData((prevData) => ({ ...prevData, [name]: value }));
};


const handleAddInlineField = (label) => {
 
  setInlineFields((prevFields) => {
    const updatedFields = { ...prevFields };
    if (!updatedFields[label]) {
      updatedFields[label] = []; 
    }
    updatedFields[label].push(''); 

  
    setFormData((prevData) => ({
      ...prevData,
      [label]: updatedFields[label], 
    }));

    return updatedFields;
  });
};


const handleRemoveInlineField = (label, index) => {
  setInlineFields((prevFields) => {
    const updatedFields = { ...prevFields };
    updatedFields[label] = updatedFields[label].filter((_, i) => i !== index); 

    
    setFormData((prevData) => ({
      ...prevData,
      [label]: updatedFields[label], 
    }));

    return updatedFields;
  });
};



const visualizacao_form = (fields) => {
  if (!Array.isArray(fields) || fields.length === 0) {
    return <Text style={styles.warning}>Nenhum campo disponível</Text>;
  }
  return fields.map((field, index) => {
    const label = labels[index] || field[1]; 
    const [type, columnName, options] = field;
    const tableName = tabelas[currentTableIndex].toLowerCase();  // Tabela atual, por exemplo, 'veiculo' ou 'motorista'
    return (
      <View key={index} style={styles.formContainer}>
        {renderField([type, label, columnName, options, tableName])}
      </View>
    );
  });
};

const renderField = (field) => {
  const [type, label, columnName, options, tableName] = field;
  const value = formData[tableName]?.[columnName] || '';  // Use a estrutura com tabelas
  switch (type) {
    case "text":
      return (
        <View key={columnName} style={styles.fieldContainer}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.input}
            placeholder={label}
            value={value}
            onChangeText={(text) => handleInputChange(tableName, columnName, text)}
          />
        </View>
      );
    case "picker":
      return (
        <View key={columnName} style={styles.fieldContainer}>
          <Text style={styles.label}>{label}</Text>
          <Picker
            style={styles.picker}
            selectedValue={value}
            onValueChange={(value) => handleInputChange(tableName, columnName, value)}
          >
            {options.map((option, index) => (
              <Picker.Item key={index} label={option} value={option} />
            ))}
          </Picker>
        </View>
      );
    case 'inline':
      const inlineFieldSets = inlineFields[label] || [];
      return (
        <View key={label} style={styles.inlineFieldContainer}>
          {inlineFieldSets.map((inlineValue, index) => (
            <View key={`${label}-${index}`} style={styles.inlineField}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                value={inlineValue}
                onChangeText={(text) => {
                  setInlineFields((prevFields) => {
                    const updatedInline = [...prevFields[label]];
                    updatedInline[index] = text;
                    setFormData((prevData) => ({
                      ...prevData,
                      [label]: updatedInline,
                    }));
                    return { ...prevFields, [label]: updatedInline };
                  });
                }}
              />
              <TouchableOpacity
                onPress={() => handleRemoveInlineField(label, index)}
                style={styles.removeButton}
              >
                <Text>Remover</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => handleAddInlineField(label)}
            style={styles.addButton}
          >
            <Text>Adicionar {label}</Text>
          </TouchableOpacity>
        </View>
      );
    default:
      return null;
  }
};




const proximaPagina = async() => {
  if (currentTableIndex < tabelas.length - 1) {
    setCurrentTableIndex(currentTableIndex + 1);
  } else {
    console.log("Dados para salvar:", formData);
    const databases = {
      myDatabase: await sqlite.openDatabase(database),  
    };
    console.log('Database opened:', databases);
    // console.log('TablesData:', tablesData);
    // console.log('Current FormData:', formData);
    const tablesData = [
      [
        'myDatabase',
        [
          ['Veiculos', [formData]], // '
        ],
      ],
    ];
    
    try {
      await sqlite.insertMultipleIntoTables(databases, tablesData);
    

    } catch (error) {
      console.error(error);
    }
  };
  }



const voltarPagina = () => {
  if (currentTableIndex > 0) {
    setCurrentTableIndex(currentTableIndex - 1);
  }
};

return (
  <ScrollView>
    {renderNavigationBar()}
    <Text style={styles.title}>Registro de {tabelas[currentTableIndex]}</Text>
    <View style={styles.mainContainer}>
      {visualizacao_form(campos || fields)} {/* Exibe os campos da tabela atual */}
      <TouchableOpacity onPress={voltarPagina} style={styles.submitButton} disabled={currentTableIndex === 0}>
        <Text style={styles.submitButtonText}>Voltar</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={proximaPagina} style={styles.submitButton}>

        <Text style={styles.submitButtonText}>{currentTableIndex === tabelas.length - 1 ? "Salvar" : "Próximo"}</Text>
        
      </TouchableOpacity>
    </View>
  </ScrollView>
);
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: "row", // Itens dispostos em linha
    flexWrap: "wrap", // Permite que os itens que não cabem na linha se movam para a linha seguinte
    justifyContent: "space-between", // Distribui os itens igualmente
    backgroundColor: "#0051ff",
    padding: 1,
    alignItems: 'center', // Garante que os itens fiquem centralizados verticalmente
  },
  navItem: {
    padding: 10,
    marginRight: 5,
    borderRadius: 5,
    flex: 1, // Torna os itens flexíveis para preencher o espaço
    alignItems: 'center', // Alinha o conteúdo do botão no centro
    justifyContent: 'center', // Alinha o conteúdo do botão no centro
  },
  activeNavItem: {
    backgroundColor: "#007bff",
  },
  navText: {
    color: "#fff",
    fontSize: 16,
  },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
      textAlign: 'center',
      marginVertical: 20,
  },
  formContainer: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 14,
  },
  picker: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    fontSize: 14,
    paddingLeft: 8,
    marginVertical: 20,
  },
  
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  checkboxGroup: {
    flexDirection: 'column', // Exibe os checkboxes em uma coluna
    alignItems: 'flex-start', // Alinha os checkboxes à esquerda
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5, // Espaçamento vertical entre os checkboxes
  },
  checkboxText: {
    marginLeft: 8,
    fontSize: 14,
  },
  textarea: {
    height: 100,
    verticalAlign: 'top',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 14, // Adicionado fontSize
  },
  uploadContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  fileNameText: {
    fontSize: 14,
    marginRight: 5,
  },
  removeButton: {
    fontSize: 16,
    color: 'red',
  },
  errorText: {
    overflowWrap: 'break-word',
  },
  uploadButton: { // Estilos para o botão de upload
    backgroundColor: '#4CAF50', // Cor de fundo (verde)
    color: 'white',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  imagePreviewItem: {
    marginRight: 10,
    alignItems: 'center',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  radioGroup: {
    flexDirection: 'column',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  radioButtonOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonOuterActive: {
    borderColor: '#2196F3',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2196F3',
  },
  radioText: {
    marginLeft: 10,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#0051ff', // Cor de fundo do botão (azul)
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  collapsibleHeader: {
    backgroundColor: '#f0f0f0', // Cor de fundo do header
    padding: 10,
    marginBottom: 10,
    flexDirection: 'row', // Alinhar texto e ícone na horizontal
    alignItems: 'center', // Centralizar verticalmente
  },
  collapsibleHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  collapsibleContent: {
    paddingLeft: 20, // Indentação do conteúdo
  },
  // inlineContainer: {
  //   flexDirection: 'row', // Organizar os campos em linha
  //   flexWrap: 'wrap',     // Permitir que os campos quebrem para a próxima linha se necessário
  //   alignItems: 'center', // Centralizar verticalmente
  // },
  // inlineField: {
  //   flex: 1,             // Cada campo ocupa uma parte igual da linha
  //   minWidth: 120,        // Largura mínima para cada campo
  //   marginHorizontal: 5,  // Espaçamento horizontal entre os campos
  // },

});

export default FormComponent;