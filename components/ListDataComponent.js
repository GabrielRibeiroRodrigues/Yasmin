import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import sqlite from "./SQliteComponent"; // Ajuste o caminho conforme necessário
import FormComponent from "./FormComponent.jsx"; // Ajuste o caminho conforme necessário

const DataTable = ({ databaseName, tableName, fields }) => {
  const [data, setData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false); // Controle de visibilidade do modal
  const [currentRecord, setCurrentRecord] = useState({});
  const [schema, setSchema] = useState([]);
  const [primaryKey, setPrimaryKey] = useState(null);
  const [fieldsToHide, setFieldsToHide] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = await sqlite.openDatabase(databaseName);

        // Obter esquema da tabela
        const tableSchema = await sqlite.getTableSchema(databaseName, tableName);
        setSchema(tableSchema);

        // Identificar a chave primária e as chaves estrangeiras
        const pkField = tableSchema.find((field) => field.primaryKey);
        const fkFields = tableSchema.filter((field) => field.isForeignKey);

        if (pkField) {
          setPrimaryKey(pkField.columnName);
        } else {
          console.warn("Nenhuma chave primária encontrada na tabela.");
        }

        setFieldsToHide([pkField ? pkField.columnName : "", ...fkFields.map((field) => field.columnName)]);

        // Obter registros da tabela
        const query = `SELECT * FROM ${tableName}`;
        const records = await db.getAllAsync(query);
        setData(records);
      } catch (error) {
        console.error("Erro ao buscar dados ou esquema:", error);
      }
    };

    fetchData();
  }, [databaseName, tableName]);

  const handleEdit = (record) => {
    setCurrentRecord(record);
    setIsModalVisible(true); // Abre o modal para edição
  };

 const handleSaveEdit = async (editedData) => {
  try {
    if (!primaryKey) {
      Alert.alert("Erro", "Chave primária não definida para a tabela.");
      return;
    }

    // Adapta os dados para o formato esperado pela função `insert`
    const formattedData = formatDataForInsert(editedData);

    // Inserir ou atualizar os dados no banco
    const db = await sqlite.openDatabase(databaseName);
    const fieldsToUpdate = schema
      .filter(field => !field.primaryKey && !field.isForeignKey)
      .map(field => field.columnName);

    const updateQuery = `
      UPDATE ${tableName} 
      SET ${fieldsToUpdate.map(field => `${field} = ?`).join(", ")} 
      WHERE ${primaryKey} = ?`;

    const values = [...fieldsToUpdate.map(field => formattedData[field]), formattedData[primaryKey]];

    await db.getAllAsync(updateQuery, values);

    // Atualizar os dados na interface do usuário
    setData(prevData => 
      prevData.map(item => 
        item[primaryKey] === formattedData[primaryKey] ? formattedData : item
      )
    );
    
    setIsModalVisible(false); // Fecha o modal após salvar
  } catch (error) {
    console.error("Erro ao salvar edição:", error);
    Alert.alert("Erro", "Não foi possível salvar as alterações.");
  }
};

// Função para formatar os dados para o formato esperado pela função `insert`
const formatDataForInsert = (data) => {
  const formattedData = {};
  const childRecords = {};

  // Percorrer todos os campos e identificar registros filhos (se existirem)
  for (const key in data) {
    if (data[key] && Array.isArray(data[key])) {
      // Se o campo é um array (representando registros filhos)
      const childTableName = key.slice(0, -4); // Remove o sufixo '_set' para obter o nome da tabela
      childRecords[childTableName] = data[key];
    } else {
      // Caso contrário, é um campo normal
      formattedData[key] = data[key];
    }
  }

  // Adicionar os registros filhos no formato adequado
  formattedData._childRecords = childRecords;

  return formattedData;
};

  const handleDelete = (id) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Você tem certeza que deseja excluir este registro?",
      [
        {
          text: "Sim",
          onPress: async () => {
            try {
              if (!primaryKey) {
                Alert.alert("Erro", "Chave primária não definida para a tabela.");
                return;
              }

              const db = await sqlite.openDatabase(databaseName);
              const deleteQuery = `DELETE FROM ${tableName} WHERE ${primaryKey} = ?`;
              await db.getAllAsync(deleteQuery, [id]);

              setData((prevData) => prevData.filter((item) => item[primaryKey] !== id));
              console.log(`Registro com ID ${id} excluído com sucesso.`);
            } catch (error) {
              console.error("Erro ao excluir registro:", error);
              Alert.alert("Erro", "Não foi possível excluir o registro.");
            }
          },
        },
        {
          text: "Não",
          onPress: () => console.log("Exclusão cancelada"),
          style: "cancel",
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancelar Edição",
      "Você tem certeza que deseja cancelar as alterações?",
      [
        {
          text: "Sim",
          onPress: () => {
            console.log("Edição cancelada");
            setIsModalVisible(false); // Fecha o modal
          },
        },
        {
          text: "Não",
          onPress: () => {
            console.log("Cancelamento abortado");
          },
          style: "cancel",
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {data.map((item) => (
          <View key={item[primaryKey]} style={styles.card}>
            <View style={styles.content}>
              {fields.map((field) => {
                const schemaField = schema.find((s) => s.columnName === field);
                return schemaField && !schemaField.primaryKey && !schemaField.isForeignKey ? (
                  <Text key={field} style={styles.field}>
                    {schemaField.columnName}: {item[field]}
                  </Text>
                ) : null;
              })}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => handleEdit(item)}
                style={styles.iconButton}
              >
                <Text>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item[primaryKey])}
                style={styles.iconButton}
              >
                <Text>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      
      <Modal
        animationType="slide"
        transparent={false}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)} // Fecha o modal
      >
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Editar Registro</Text>
          <FormComponent 
            database={databaseName}
            ts={"update"}
            tabelas={[tableName]}
            fields={schema
              .filter(field => fields.includes(field.columnName) && !fieldsToHide.includes(field.columnName))
              .map(field => [
                field.dataType,
                field.columnName,
                field.columnName,
                [],
                tableName
              ])
            }
            initialData={{
              [tableName]: currentRecord
            }}
            ocultar={fieldsToHide}
            barraPersonalizada={{
              [tableName]: "Editar " + tableName
            }}
            onSubmit={(formData) => {
              handleSaveEdit(formData[tableName]);
            }}
            TipoSub={"EDITAR"}
          />
          {/* Botão para fechar o modal sem salvar */}
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancel} // Chama a função de cancelamento
          >
            <Text style={{ color: "white" }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  content: {
    flex: 1,
  },
  field: {
    fontSize: 14,
    marginBottom: 5,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    marginHorizontal: 5,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  cancelButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#ff5c5c",
    borderRadius: 5,
    alignItems: "center",
  },
});

export default DataTable;