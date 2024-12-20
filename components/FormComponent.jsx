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
import sqlite from '../components/SQliteComponent';
import * as SQLite from 'expo-sqlite';
import { get, create } from '../components/Api';
import NetInfo from '@react-native-community/netinfo';
import { TextInputMask } from "react-native-masked-text";
const FormComponent = ({database,tabelas = [],fields = [],initialData = [{}],ocultar = [],labels = [],barraPersonalizada, TipoSub, labelsInline = [] }) => {
const [formData, setFormData] = useState(initialData);
const [campos, setCampos] = useState(null);
const [valor, setValor] = useState({});
const [currentTableIndex, setCurrentTableIndex] = useState(0);
const [schemas, setSchemas] = useState([]);
const [fkLoaded, setFkLoaded] = useState(false); 
const [inlineFields, setInlineFields] = useState({});
const [FK, setFK] = useState({});
const [records, setRecords] = useState([]);
const [Gambi, setGambi] = useState([]);
const databases = sqlite.openDatabase(database);
const [isConnected, setIsConnected] = useState(null);
let inl = false;
if(tabelas.length > 0) {
  inl = true;
}
useEffect(() => {
  // Função para verificar o estado da conexão inicial e monitorar mudanças
  const unsubscribe = NetInfo.addEventListener((state) => {
    setIsConnected(state.isConnected);
  });


  // Clean up para evitar vazamento de memória
  return () => {
    unsubscribe();
  };
}, []);

useEffect(() => {
    const initialInlineFields = {};
    fields.forEach(field => {
      if (field[0] === 'inline') {
        const [_, label, subFields] = field;
        initialInlineFields[label] = subFields.map(() => ['']); // Inicializa os campos
      }
    });
    setInlineFields(initialInlineFields);
  }, [fields]);
  useEffect(() => {
    const atualizarInlineFields = () => {
      setInlineFields((prevFields) => {
        const updatedFields = { ...prevFields };
        Object.keys(updatedFields).forEach((label) => {
          updatedFields[label] = updatedFields[label].map((fieldSet) =>
            fieldSet.map((field) => {
              if (field.type === "picker" && valor[field.columnName]) {
                return { ...field, options: valor[field.columnName] };
              }
              return field;
            })
          );
        });
        return updatedFields;
      });
    };
  
    atualizarInlineFields();
  }, [valor, FK]); // Atualiza sempre que as opções de FK ou o estado mudar.
  
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
     
          <Text style={styles.navText}>
            {barraPersonalizada[table] || table}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const carregaForeignKeys = async (fk) => {
  const results = {};
  try {
    for (const key in fk) {
      const { databaseName, tableName, displayField, fieldName } = fk[key];
      const registros = await sqlite.getRecords(databaseName, tableName);
      // Retorna uma lista de objetos com label (nome) e value (ID)
      results[key] = registros.map((registro) => ({
        label: registro[displayField],
        value: registro[fieldName], // Salva o ID
      }));
    }
    setValor(results);
    // console.log("Chaves Estrangeiras encontradas para esse index:", results);
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
      const camposGerados = gerarFields(schema, ocultar);
      setCampos(camposGerados);
      // console.log("Esquema obtido para gerar o formulário, as opções estão como objetos: ", camposGerados);
    } catch (error) {
      console.error("Erro ao carregar esquemas:", error);
    }
  };

  fetchSchemas();
}, [database, tabelas, currentTableIndex, ocultar,valor,FK,Gambi]);

useEffect(() => {
  const fetchForeignKeys = async () => {
    try {
      if (Object.keys(FK).length === 0) return; // Se FK ainda não estiver definido, não faz nada.
      
      await carregaForeignKeys(FK);  // Carregar as chaves estrangeiras com a chave FK
      // console.log("Chaves estrangeiras carregadas: ", FK);
    } catch (error) {
      console.error("Erro ao carregar chaves estrangeiras:", error);
    }
  };

  fetchForeignKeys(); // Chama sempre que `currentTableIndex` ou `FK` mudar
}, [currentTableIndex, FK, Gambi])


const gerarFields = (tipos, campos_ocultos) => {
    if (!Array.isArray(tipos)) return [];
  
    const inlineFieldsAdded = {}; // Rastreamento de tabelas inline já adicionadas
  
    return tipos
      .map(({ dataType, columnName, isForeignKey }) => {
        if (currentTableIndex === 0 && !isForeignKey && !campos_ocultos.includes(columnName)) {
          // Campos normais para a tabela inicial
          return ["text", columnName];
        } else if (currentTableIndex === 0 && isForeignKey && !campos_ocultos.includes(columnName)) {
          // Campos FK na tabela inicial
          const pickerOptions = valor[columnName] || [];
          return ["picker", columnName, pickerOptions];
        } else if (currentTableIndex > 0 && !inlineFieldsAdded[tabelas[currentTableIndex]]) {
          // Criar um único campo "inline" para tabelas a partir da segunda
          inlineFieldsAdded[tabelas[currentTableIndex]] = true; // Marca como adicionado
  
          const inlineSubFields = tipos
            .filter(({ columnName: col }) => !campos_ocultos.includes(col)) // Filtra campos não ocultos
            .map(({ dataType, columnName: col, isForeignKey: isFK }) => {
              if (isFK) {
                const pickerOptions = valor[col] || [];
                return ["picker", col, pickerOptions];
              } else {
                return ["text", col];
              }
            });
  
          return ["inline", tabelas[currentTableIndex], inlineSubFields];
        }
        return null;
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

const handleInputChange = (tableName, columnName, value) => {
    setFormData((prevData) => {
      const newData = {
        ...prevData,
        [tableName]: {
          ...prevData[tableName],
          [columnName]: value,
        },
      };
      return newData;
    });
  };
  
  const [a, setA] = useState(0); // Estado para controlar 'a'

  const handleAddInlineField = (label, inlineSubFields) => {
    // Incrementa o estado de 'a'
    setA((prevA) => {
      const newA = prevA + 1;
      setGambi(1 + newA); // Atualiza o valor de Gambi
      return newA;
    });
  
    setInlineFields((prevFields) => {
      const updatedFields = { ...prevFields };
  
      if (!updatedFields[label]) {
        updatedFields[label] = [];
      }
  
      // Adiciona novos subcampos dinamicamente
      const newFieldSet = inlineSubFields.map(([type, columnName]) => ({
        type,
        columnName,
        value: type === "picker" ? "" : "",
        options: valor[columnName] || [], // Garante que opções sejam carregadas.
      }));
  
      updatedFields[label].push(newFieldSet);
  
      setFormData((prevData) => ({
        ...prevData,
        [label]: updatedFields[label],
      }));
  
      return updatedFields;
    });
  };
  

  
  const handleRemoveInlineField = (label, index) => {
    setInlineFields(prevFields => {
      const updatedFields = { ...prevFields };
      updatedFields[label] = updatedFields[label].filter((_, i) => i !== index);
  
      setFormData(prevData => ({
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
    const tableName = tabelas[currentTableIndex];  
    return (
      <View key={index} style={styles.formContainer}>
        {renderField([type, label, columnName, options, tableName])}
      </View>
      
    );
  });
};

const renderField = (field) => {
  const [type, label, columnName, options, tableName] = field;
  const labels_Modificada = labels[columnName] || columnName;
  const value = formData[tableName]?.[columnName] || '';  
  switch (type) {
    case "text":
      if (columnName === "cpf") {
        return (
          <View key={columnName} style={styles.fieldContainer}>
            <Text style={styles.label}>{labels_Modificada}</Text>
            <TextInputMask
              type={"cpf"}
              value={value}
              onChangeText={(text) =>
                handleInputChange(tableName, columnName, text)
              }
              style={styles.input}
              placeholder={labels_Modificada}
            />
          </View>
        );
      }else if (columnName === "rg") {
        return (
          <View key={columnName} style={styles.fieldContainer}>
            <Text style={styles.label}>{labels_Modificada}</Text>
            <TextInputMask
              type={"custom"}
              options={{
                mask: "99.999.999",
              }}
              value={value}
              onChangeText={(text) => handleInputChange(tableName, columnName, text)}
              style={styles.input}
              placeholder={labels_Modificada}
            />
          </View>
        );
      }
      else if (
        columnName[0] === 'd' &&
        columnName[1] === 'a' &&
        columnName[2] === 't' &&
        columnName[3] === 'a'
      ) {
        const isValidDate = (dateString) => {
          const [day, month, year] = dateString.split('/').map(Number);
      
         
          if (day < 1 || day > 30) {
            // console.error("O dia deve estar entre 1 e 30.");
            return false;
          }
          if (month < 1 || month > 12) {
            // console.error("O mês deve estar entre 1 e 12.");
            return false;
          }
          

          if (year < 1930) {
            // console.error("O ano não pode ser menor que 1930.");
            return false;
          }
          return true;
        };
      
        return (
          <View key={columnName} style={styles.fieldContainer}>
            <Text style={styles.label}>{labels_Modificada}</Text>
            <TextInputMask
              type={"datetime"}
              options={{
                format: 'DD/MM/YYYY',
              }}
              value={value}
              onChangeText={(text) => {
                if (isValidDate(text)) {
                  handleInputChange(tableName, columnName, text);
                } else {
                  console.error("Data inválida:", text);
                }
              }}
              style={styles.input}
              placeholder={labels_Modificada}
            />
          </View>
        );
      }else if (columnName === "telefone") {
        return (
          <View key={columnName} style={styles.fieldContainer}>
            <Text style={styles.label}>{labels_Modificada}</Text>
            <TextInputMask
              type={"custom"}
              options={{
                mask: "(99) 99999-9999",
              }}
              value={value}
              onChangeText={(text) => handleInputChange(tableName, columnName, text)}
              style={styles.input}
              placeholder={labels_Modificada}
            />
          </View>
        );
      }
      else if (
        columnName[0] == "v" &&
        columnName[1] == "a" && 
        columnName[2] == "l" && 
        columnName[3] == "o" && 
        columnName[4] == "r"   ) {
        return (
          <View key={columnName} style={styles.fieldContainer}>
            <Text style={styles.label}>{labels_Modificada}</Text>
            <TextInputMask
               type={'money'}
               options={{
                 precision: 2,
                 separator: ',',
                 delimiter: '.',
                 unit: 'R$',
                 suffixUnit: ''
               }}
              value={value}
              onChangeText={(text) => handleInputChange(tableName, columnName, text)}
              style={styles.input}
              placeholder={labels_Modificada}
            />
          </View>
        );
      }
      else if (columnName[0] == "a" && columnName[1] == "n" && columnName[2] == "o") {
        return (
          <View key={columnName} style={styles.fieldContainer}>
            <Text style={styles.label}>{labels_Modificada}</Text>
            <TextInputMask
              type={"custom"}
              options={{
                mask: "9999",
              }}
              value={value}
              onChangeText={(text) => handleInputChange(tableName, columnName, text)}
              style={styles.input}
              placeholder={labels_Modificada}
            />
          </View>
        );
      }
      
      return (
        <View key={columnName} style={styles.fieldContainer}>
          <Text style={styles.label}>{labels_Modificada}</Text>
          <TextInput
            style={styles.input}
            placeholder={labels_Modificada}
            value={value}
            onChangeText={(text) =>
              handleInputChange(tableName, columnName, text)
            }
          />
        </View>
      );

      case "picker":
        return (
          <View key={columnName} style={styles.fieldContainer}>
            <Text style={styles.label}>{labels_Modificada}</Text>
            <Picker
              style={styles.picker}
              selectedValue={value}
              onValueChange={(selectedValue) => {
                handleInputChange(tableName, columnName, selectedValue);
              }}
            >
             <Picker.Item label={`---------`} value={null} />
              {options.map((option, index) => (
                <Picker.Item key={index} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
        );
      
      
      
        case "inline":
          const inlineFieldSets = inlineFields[label] || [];
          return (
            <View key={label} style={styles.inlineFieldContainer}>
              {inlineFieldSets.map((fieldSet, index) => (
                <View key={`${label}-${index}`} style={styles.inlineField}>
                  {fieldSet.map(({ type, columnName, value, options }) => {
                    const labelModificada = labels[columnName] || columnName; // Use os labels personalizados aqui
        
                    if (type === "text") {
                      if (columnName === "cpf") {
                        return (
                          <View key={columnName} style={styles.fieldContainer}>
                            <Text style={styles.label}>{labelModificada}</Text>
                            <TextInputMask
                              type={"cpf"}
                              value={value}
                              onChangeText={(text) => {
                                setInlineFields((prevFields) => {
                                  const updatedFieldSet = [...prevFields[label]];
                                  updatedFieldSet[index] = updatedFieldSet[index].map((field) =>
                                    field.columnName === columnName ? { ...field, value: text } : field
                                  );
                    
                                  setFormData((prevData) => ({
                                    ...prevData,
                                    [label]: updatedFieldSet,
                                  }));
                    
                                  return { ...prevFields, [label]: updatedFieldSet };
                                });
                              }}
                              style={styles.input}
                              placeholder={labelModificada}
                            />
                          </View>
                        );
                      } else if (columnName === "rg") {
                        return (
                          <View key={columnName} style={styles.fieldContainer}>
                            <Text style={styles.label}>{labelModificada}</Text>
                            <TextInputMask
                              type={"custom"}
                              options={{
                                mask: "99.999.999",
                              }}
                              value={value}
                              onChangeText={(text) => {
                                setInlineFields((prevFields) => {
                                  const updatedFieldSet = [...prevFields[label]];
                                  updatedFieldSet[index] = updatedFieldSet[index].map((field) =>
                                    field.columnName === columnName ? { ...field, value: text } : field
                                  );
                    
                                  setFormData((prevData) => ({
                                    ...prevData,
                                    [label]: updatedFieldSet,
                                  }));
                    
                                  return { ...prevFields, [label]: updatedFieldSet };
                                });
                              }}
                              style={styles.input}
                              placeholder={labelModificada}
                            />
                          </View>
                        );
                      } else if (
                        columnName[0] === "d" &&
                        columnName[1] === "a" &&
                        columnName[2] === "t" &&
                        columnName[3] === "a"
                      ) {
                        const isValidDate = (dateString) => {
                          const [day, month, year] = dateString.split("/").map(Number);
                    
                          if (day < 1 || day > 30) return false;
                          if (month < 1 || month > 12) return false;
                          if (year < 1930) return false;
                          return true;
                        };
                    
                        return (
                          <View key={columnName} style={styles.fieldContainer}>
                            <Text style={styles.label}>{labelModificada}</Text>
                            <TextInputMask
                              type={"datetime"}
                              options={{
                                format: "DD/MM/YYYY",
                              }}
                              value={value}
                              onChangeText={(text) => {
                                if (isValidDate(text)) {
                                  setInlineFields((prevFields) => {
                                    const updatedFieldSet = [...prevFields[label]];
                                    updatedFieldSet[index] = updatedFieldSet[index].map((field) =>
                                      field.columnName === columnName ? { ...field, value: text } : field
                                    );
                    
                                    setFormData((prevData) => ({
                                      ...prevData,
                                      [label]: updatedFieldSet,
                                    }));
                    
                                    return { ...prevFields, [label]: updatedFieldSet };
                                  });
                                } else {
                                  console.error("Data inválida:", text);
                                }
                              }}
                              style={styles.input}
                              placeholder={labelModificada}
                            />
                          </View>
                        );
                      } else if (columnName === "telefone") {
                        return (
                          <View key={columnName} style={styles.fieldContainer}>
                            <Text style={styles.label}>{labelModificada}</Text>
                            <TextInputMask
                              type={"custom"}
                              options={{
                                mask: "(99) 99999-9999",
                              }}
                              value={value}
                              onChangeText={(text) => {
                                setInlineFields((prevFields) => {
                                  const updatedFieldSet = [...prevFields[label]];
                                  updatedFieldSet[index] = updatedFieldSet[index].map((field) =>
                                    field.columnName === columnName ? { ...field, value: text } : field
                                  );
                    
                                  setFormData((prevData) => ({
                                    ...prevData,
                                    [label]: updatedFieldSet,
                                  }));
                    
                                  return { ...prevFields, [label]: updatedFieldSet };
                                });
                              }}
                              style={styles.input}
                              placeholder={labelModificada}
                            />
                          </View>
                        );
                      } else if (
                        columnName[0] == "v" &&
                        columnName[1] == "a" &&
                        columnName[2] == "l" &&
                        columnName[3] == "o" &&
                        columnName[4] == "r"
                      ) {
                        return (
                          <View key={columnName} style={styles.fieldContainer}>
                            <Text style={styles.label}>{labelModificada}</Text>
                            <TextInputMask
                              type={"money"}
                              options={{
                                precision: 2,
                                separator: ",",
                                delimiter: ".",
                                unit: "R$",
                                suffixUnit: "",
                              }}
                              value={value}
                              onChangeText={(text) => {
                                setInlineFields((prevFields) => {
                                  const updatedFieldSet = [...prevFields[label]];
                                  updatedFieldSet[index] = updatedFieldSet[index].map((field) =>
                                    field.columnName === columnName ? { ...field, value: text } : field
                                  );
                    
                                  setFormData((prevData) => ({
                                    ...prevData,
                                    [label]: updatedFieldSet,
                                  }));
                    
                                  return { ...prevFields, [label]: updatedFieldSet };
                                });
                              }}
                              style={styles.input}
                              placeholder={labelModificada}
                            />
                          </View>
                        );
                      } else if (columnName[0] == "a" && columnName[1] == "n" && columnName[2] == "o") {
                        return (
                          <View key={columnName} style={styles.fieldContainer}>
                            <Text style={styles.label}>{labelModificada}</Text>
                            <TextInputMask
                              type={"custom"}
                              options={{
                                mask: "9999",
                              }}
                              value={value}
                              onChangeText={(text) => {
                                setInlineFields((prevFields) => {
                                  const updatedFieldSet = [...prevFields[label]];
                                  updatedFieldSet[index] = updatedFieldSet[index].map((field) =>
                                    field.columnName === columnName ? { ...field, value: text } : field
                                  );
                    
                                  setFormData((prevData) => ({
                                    ...prevData,
                                    [label]: updatedFieldSet,
                                  }));
                    
                                  return { ...prevFields, [label]: updatedFieldSet };
                                });
                              }}
                              style={styles.input}
                              placeholder={labelModificada}
                            />
                          </View>
                        );
                      }
                      
                      // Caso default (não é nenhum dos casos específicos)
                      return (
                        <View key={columnName} style={styles.fieldContainer}>
                          <Text style={styles.label}>{labelModificada}</Text>
                          <TextInput
                            style={styles.input}
                            placeholder={labelModificada}
                            value={value}
                            onChangeText={(text) => {
                              setInlineFields((prevFields) => {
                                const updatedFieldSet = [...prevFields[label]];
                                updatedFieldSet[index] = updatedFieldSet[index].map((field) =>
                                  field.columnName === columnName ? { ...field, value: text } : field
                                );
                    
                                setFormData((prevData) => ({
                                  ...prevData,
                                  [label]: updatedFieldSet,
                                }));
                    
                                return { ...prevFields, [label]: updatedFieldSet };
                              });
                            }}
                          />
                        </View>
                      );
                    }
                    
                    else if (type === "picker") {
                      const labelINL = labelsInline[label] || label;  
                      return (
                        <View key={columnName} style={styles.fieldContainer}>
                          <Text style={styles.label}>{labelModificada}</Text>
                          <Picker
                            style={styles.picker}
                            selectedValue={value}
                            onValueChange={(selectedValue) => {
                              setInlineFields((prevFields) => {
                                const updatedFieldSet = [...prevFields[label]];
                                updatedFieldSet[index] = updatedFieldSet[index].map((field) =>
                                  field.columnName === columnName ? { ...field, value: selectedValue } : field
                                );
        
                                setFormData((prevData) => ({
                                  ...prevData,
                                  [label]: updatedFieldSet,
                                }));
                                return { ...prevFields, [label]: updatedFieldSet };
                              });
                            }}
                          >
                            <Picker.Item label={`---------`} value={null} />
                            {options.map((option, idx) => (
                              <Picker.Item key={idx} label={option.label} value={option.value} />
                            ))}
                          </Picker>
                        </View>
                      );
                    }
        
                    return null;
                  })}
                  <TouchableOpacity
                    onPress={() => handleRemoveInlineField(label, index)}
                    style={styles.removeButton}
                  >
                    <Text>Remover</Text>
                  </TouchableOpacity>
                </View>
              ))}
        
              <TouchableOpacity
                onPress={() => {
                  const inlineSubFields = campos.find((field) => field[0] === "inline" && field[1] === label)?.[2] || [];
                  handleAddInlineField(label, inlineSubFields);
                }}
                style={styles.addButton}
              >
                <Text>Adicionar {labelsInline[label] || label}</Text> 
              </TouchableOpacity>
            </View>
          );
        
        

    default:
      return null;
  }
};

  const limparCamposVaziosSemInline = (dados) => {
    const dadosLimpos = {};
    for (const tabela in dados) {
      if (dados[tabela]) {
        for (const campo in dados[tabela]) {
          if (dados[tabela][campo].trim() !== "") {
            dadosLimpos[campo] = dados[tabela][campo]; // Exclui a tabela, mantém o campo
          }
        }
      }
    }
    return dadosLimpos;
  };
  
  const limparCamposVaziosComInline = (formData) => {
    const cleanedData = {};
  
    Object.keys(formData).forEach((tableName) => {
      const tableData = formData[tableName];
      
      // Verifica se é uma tabela inline (array de arrays)
      if (Array.isArray(tableData) && Array.isArray(tableData[0])) {
        cleanedData[tableName] = tableData.map((inlineRow) => {
          // Converte cada linha inline para JSON simples, ignorando campos vazios
          const cleanedRow = {};
          inlineRow.forEach(({ columnName, value }) => {
            if (value !== "") {
              cleanedRow[columnName] = value;
            }
          });
          return cleanedRow; // Retorna o JSON para a linha
        }).filter((row) => Object.keys(row).length > 0); // Remove linhas totalmente vazias
      } else {
        // Para tabelas não inline
        const cleanedRow = {};
        Object.entries(tableData).forEach(([key, value]) => {
          if (value !== "") {
            cleanedRow[key] = value;
          }
        });
        cleanedData[tableName] = cleanedRow;
      }
    });
  
    return cleanedData;
  };
  


const proximaPagina = async () => {
  
  if (currentTableIndex < tabelas.length - 1) {
    setCurrentTableIndex(currentTableIndex + 1);
  } else {

    //AQUI VAI SER OS TESTES DE INTERNET PARA MANDAR PARA API OU COMP SQLITE
    if(isConnected == true){
    let dadosLimpos = {};
    let jsonFinal = {};
    if(inl == false){
      dadosLimpos = limparCamposVaziosSemInline(formData);
      Object.keys(dadosLimpos).forEach((chave) => {
        jsonFinal[chave] = dadosLimpos[chave];
      });}
      else {
        dadosLimpos = limparCamposVaziosComInline(formData);
        jsonFinal = tabelas.reduce((acc, tabela, index) => {
          if (dadosLimpos[tabela]) {
            // Apenas as tabelas filhas recebem o sufixo "_set"
            const nomeTabela = index === 0 ? null : `${tabela}_set`;
            if (nomeTabela) {
              acc[nomeTabela] = dadosLimpos[tabela];
            } else {
              // Adiciona os dados da tabela pai diretamente ao JSON
              Object.assign(acc, dadosLimpos[tabela]);
            }
          }
          return acc;
        }, {});
      }
    console.log("JSON Gerado:", jsonFinal);
    
    // if (TipoSub == "EDITAR"){
    //   console.log("ENTROU");
    //   const dadosql = await sqlite.getRecords(database, tabelas[0], 0);
    //   console.log("dados na tabela: ", dadosql);
    //   console.log("DB",database);
    //     await sqlite.editRecords(database,jsonFinal);
    //     console.log("PASSOU");
    //   }
      // const dadosql = await sqlite.getRecords(database, tabelas[0], 0);
      // console.log("dados na tabela22222222: ", dadosql);
    // await sqlite.insert(database, tabelas[0], jsonFinal);
    // const dadosql = await sqlite.getRecords(database, tabelas[0], 1);
    // console.log("dados na tabela: ", dadosql);
    // console.log("NA TABLE",JSON.stringify(dadosql));
    if(TipoSub == "CRIAR"){
      await create(database, tabelas[0], jsonFinal);
      
    }else if (TipoSub == "EDITAR"){
      await update(database, tabelas[0], initialData ,jsonFinal); // 
    }  
  }
else{
 //IMPLEMENTAÇÃO DO SQLITE 
 if(TipoSub == "CRIAR"){
 if(inl == false){
  await sqlite.insert(database, tabelas[0], jsonFinal);
  const dadosql = await sqlite.getRecords(database, tabelas[0], 1);
      console.log("dados na tabela: ", dadosql);
  }  else{
  await sqlite.insert(database, tabelas[0], jsonFinal);
  const dadosql = await sqlite.getRecords(database, tabelas[0], 1);
      console.log("dados na tabela: ", dadosql);
  };
  }
else if (TipoSub == "EDITAR"){
  if(inl == false){
    await sqlite.editRecords(database,jsonFinal);
  }else{
    await sqlite.editRecords(database,jsonFinal);
  } 
}
}
}
}
  
const voltarPagina = () => {
  if (currentTableIndex > 0) {
    setCurrentTableIndex(currentTableIndex - 1);
  }
};

return (
  <ScrollView>
    {renderNavigationBar()}
    <Text style={styles.title}>Registro de {labelsInline[tabelas[currentTableIndex]] || tabelas[currentTableIndex]}</Text>
    <View style={styles.mainContainer}>
      {visualizacao_form(campos || fields)} 
      {currentTableIndex > 0 && (
      <TouchableOpacity onPress={voltarPagina} style={styles.submitButton} disabled={currentTableIndex === 0}>
        <Text style={styles.submitButtonText}>Voltar</Text>
      </TouchableOpacity>)}
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