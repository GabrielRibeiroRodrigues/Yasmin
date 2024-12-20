import * as SQLite from "expo-sqlite";

// Função para abrir o banco de dados
const openDatabase = async (databaseName) => {
  try {
    const db = await SQLite.openDatabaseAsync(databaseName);
    return db;
  } catch (error) {
    console.error("Erro ao abrir o banco de dados:", error);
    throw error;
  }
};

// Função para registrar logs de operações no banco
const logDatabaseOperation = (operation, query, params = []) => {
  console.log(`[${operation}] Query: ${query} | Parâmetros: ${params}`);
};


// Função para criar ou atualizar uma tabela
const createTable = async (databaseName, tableName, columns) => {
  const db = await openDatabase(databaseName);

  const columnDefinitions = columns.map(column => {
      let columnDef = `${column.name} ${column.type}`;
      if (column.primaryKey) {
          columnDef += ' PRIMARY KEY';
      }
      if (column.foreignKey) {
          const onDeleteAction = column.foreignKey.on_delete || 'DO NOTHING';
          columnDef += ` REFERENCES ${column.foreignKey.table}(${column.foreignKey.column}) ON DELETE ${onDeleteAction.toUpperCase()}`;
      }
      return columnDef;
  });

  const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefinitions.join(', ')})`;

  try {
      await db.runAsync(query);
      console.log(`Tabela '${tableName}' criada com sucesso no banco de dados '${databaseName}'.`);
  } catch (error) {
      console.error(`Erro ao criar a tabela '${tableName}' no banco de dados '${databaseName}':`, error);
      throw error;
  }
};

// Função para excluir tabelas de múltiplos bancos de dados
const deleteTables = async (databaseNames, tableNames) => {
  for (let databaseName of databaseNames) {
    const db = await openDatabase(databaseName);

    // Criando a query para excluir todas as tabelas passadas no array
    const queries = tableNames
      .map((tableName) => `DROP TABLE IF EXISTS ${tableName}`)
      .join("; ");

    logDatabaseOperation("DROP TABLES", queries);

    try {
      // Executa todas as queries de exclusão de tabelas para o banco de dados atual
      await db.runAsync(queries);
      console.log(
        `Tabelas ${tableNames.join(
          ", "
        )} excluídas com sucesso no banco de dados '${databaseName}'.`
      );
    } catch (error) {
      console.error(
        `Erro ao excluir as tabelas no banco de dados '${databaseName}':`,
        error
      );
      throw error;
    }
  }
};

// Função para editar ou criar tabelas em múltiplos bancos de dados
const editTables = async (databaseNames, tablesAndFields) => {
  for (let databaseName of databaseNames) {
    const db = await openDatabase(databaseName);

    for (let { tableName, newFields } of tablesAndFields) {
      try {
        // Verificar se a tabela já existe
        const checkQuery = `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`;
        const result = await db.getAllAsync(checkQuery);

        if (result.length === 0) {
          // Se a tabela não existir, criamos uma nova tabela
          await createTable(databaseName, tableName, newFields);
          console.log(
            `Tabela '${tableName}' não existia, foi criada com os novos campos.`
          );
        } else {
          // Se a tabela existir, verificamos as colunas existentes
          const existingColumns = await getTableSchema(databaseName, tableName);

          // Adicionar os campos novos
          const addColumns = newFields.filter(
            (field) =>
              !existingColumns.some((col) => col.columnName === field.name)
          );
          if (addColumns.length > 0) {
            for (const col of addColumns) {
              const addColumnQuery = `ALTER TABLE ${tableName} ADD COLUMN ${
                col.name
              } ${col.type}${
                col.primaryKey ? " PRIMARY KEY AUTOINCREMENT" : ""
              }`;
              await db.runAsync(addColumnQuery);
              console.log(
                `Campo '${col.name}' adicionado à tabela '${tableName}'`
              );
            }
          }

          // Caso haja necessidade de editar dados mais complexos, como renomear colunas, você pode adicionar lógica extra aqui
        }
      } catch (error) {
        console.error(
          `Erro ao editar ou criar a tabela '${tableName}' no banco '${databaseName}':`,
          error
        );
        throw error;
      }
    }
  }
};

// Função para obter todas as tabelas de múltiplos bancos de dados
const getTables = async (databaseNames, filter = "") => {
  const tables = [];

  for (let databaseName of databaseNames) {
    const db = await openDatabase(databaseName);

    try {
      // Consultar as tabelas do banco de dados
      const query = "SELECT name FROM sqlite_master WHERE type='table'";
      const result = await db.getAllAsync(query);

      // Filtrar as tabelas com base no filtro (se fornecido)
      const filteredTables = result.filter((table) =>
        table.name.includes(filter)
      );
      if (filteredTables.length > 0) {
        tables.push({
          database: databaseName,
          tables: filteredTables.map((table) => table.name),
        });
      }
    } catch (error) {
      console.error(
        `Erro ao obter tabelas do banco de dados '${databaseName}':`,
        error
      );
      throw error;
    }
  }

  // Exibir as tabelas
  if (tables.length > 0) {
    console.log("Tabelas encontradas:", tables);
  } else {
    console.log("Nenhuma tabela encontrada.");
  }

  return tables;
};

// Função para inserir registros em uma tabela
const insert = async (databaseName, tableName, records, parentInfo = null) => {
  const db = await openDatabase(databaseName);

  const insertRecord = async (record, parentInfo) => {
    const columns = [];
    const values = [];
    let placeholders = [];
    const childRecords = {};

    for (const key in record) {
      const value = record[key];

      if (key.endsWith("_set") && Array.isArray(value)) {
        const childTableName = key.slice(0, -4); // Remove '_set' to get the child table name
        childRecords[childTableName] = value;
      } else {
        columns.push(key);
        placeholders.push("?");
        values.push(value);
      }
    }

    if (parentInfo !== null) {
      const [parentTableName, parentId] = parentInfo;
      const parentColumn = `${parentTableName}_id`;
      columns.push(parentColumn);
      placeholders.push("?");
      values.push(parentId);
    }

    const query = `INSERT INTO ${tableName} (${columns.join(
      ", "
    )}) VALUES (${placeholders.join(", ")})`;

    try {
      const result = await db.runAsync(query, values);
      const newRecordId = result.lastInsertRowId;

      for (const childTableName in childRecords) {
        const childRecordsArray = childRecords[childTableName];
        await insert(databaseName, childTableName, childRecordsArray, [
          tableName,
          newRecordId,
        ]);
      }

      return newRecordId;
    } catch (error) {
      console.error(
        `Erro ao inserir o registro na tabela '${tableName}' no banco de dados '${databaseName}':`,
        error
      );
      throw error;
    }
  };

  if (Array.isArray(records)) {
    for (const record of records) {
      await insertRecord(record, parentInfo);
    }
  } else {
    await insertRecord(records, parentInfo);
  }
};

// Função para excluir um registro de uma tabela
const deleteRecords = async (databaseName, tablesAndIds) => {
  const db = await openDatabase(databaseName);

  // Validar a entrada
  if (!Array.isArray(tablesAndIds) || tablesAndIds.length === 0) {
    throw new Error("O array de tabelas e IDs é inválido ou está vazio.");
  }

  try {
    // Iniciar a transação
    await db.execAsync("BEGIN TRANSACTION");

    // Processar as tabelas na ordem reversa para respeitar hierarquias
    for (let i = tablesAndIds.length - 1; i >= 0; i--) {
      const { tableName, id } = tablesAndIds[i];

      if (!tableName || typeof id === "undefined") {
        throw new Error("Nome da tabela ou ID inválido.");
      }

      const query = `DELETE FROM ${tableName} WHERE id = ?`;
      logDatabaseOperation?.("DELETE", query, [id]);

      try {
        await db.runAsync(query, [id]);
        console.log(
          `Registro excluído com sucesso da tabela ${tableName} (id = ${id})`
        );
      } catch (error) {
        console.error(
          `Erro ao excluir o registro da tabela ${tableName} (id = ${id}):`,
          error
        );
        throw error;
      }
    }

    // Confirmar a transação
    await db.execAsync("COMMIT");
    console.log("Todos os registros foram excluídos com sucesso!");
  } catch (error) {
    // Reverter a transação em caso de erro
    await db.execAsync("ROLLBACK");
    console.error(
      "Erro ao excluir registros com hierarquias. Transação revertida.",
      error
    );
    throw error;
  } finally {
    // Fechar o banco de dados (opcional)
    if (db.closeAsync) {
      await db.closeAsync();
    }
  }
};

// Função para editar dados de uma tabela
const editRecords = async (databaseNames, tableFields) => {
  console.log("MEU DATA ANTES DO FOR", databaseNames);
  for (const databaseName of databaseNames) {
    const db = await openDatabase(databaseName); // Usando a função openDatabase que você criou
    for (const tableData of tableFields) {
      console.log("MEU DATA DENTRO SQLITE", databaseName);
      const { tableName, fieldsToUpdate } = tableData;

      // Verificar se a tabela existe
      const tableExistsQuery = `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`;
      const tableExistsResult = await db.execAsync(tableExistsQuery);

      if (tableExistsResult[0].rows.length === 0) {
        console.error(
          `Tabela '${tableName}' não encontrada no banco de dados '${databaseName}'.`
        );
        continue;
      }
      // Atualizar registros na tabela
      for (const record of fieldsToUpdate) {
        const { id, ...updateFields } = record;

        // Garantir que o ID seja fornecido
        if (!id) {
          console.error(
            `O campo 'id' é obrigatório para atualizar o registro na tabela '${tableName}'`
          );
          continue;
        }

        // Verificar se updateFields é um objeto válido
        if (!updateFields || typeof updateFields !== "object") {
          console.error(
            `Os campos para atualização são inválidos ou nulos na tabela '${tableName}'`
          );
          continue;
        }

        const columns = Object.keys(updateFields);
        const values = Object.values(updateFields);

        const setClause = columns.map((col) => `${col} = ?`).join(", ");
        const query = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;

        try {
          await db.executeSqlAsync(query, [...values, id]);
        } catch (error) {
          console.error(
            `Erro ao atualizar o registro com id ${id} na tabela '${tableName}':`,
            error
          );
        }
      }
    }
  }
};

const getRecords = async (databaseName, tableName, depth = 0) => {
  const db = await openDatabase(databaseName);

  // 1. Busca os registros da tabela principal
  const query = `SELECT * FROM ${tableName}`;
  logDatabaseOperation("SELECT", query);
  
  try {
    let results = {};
    results = await db.getAllAsync(query);

    // 2. Processa relacionamentos apenas se depth > 0
    if (depth > 0) {
      for (const record of results) {
        // 3. Busca tabelas que possuem referência à tabela pai
        const childTables = await findChildTables(db, tableName);

        console.log('record', record)

        for (const childTable of childTables) {
          const foreignKeyColumn = `${tableName}_id`; // Padrão de coluna FK
          const childQuery = `SELECT * FROM ${childTable} WHERE ${foreignKeyColumn} = ${record.id}`;
          console.log('aqui')

          logDatabaseOperation("SELECT", childQuery, [record.id]);

          const childResults = await db.getAllAsync(childQuery);
          console.log(childResults)

          // 4. Adiciona os registros filhos no formato '<nome_tabela>_set'
          record[`${childTable}_set`] = childResults;
        }
      }
    }

    return results;
    
  } catch (error) {
    console.error(`Erro ao buscar registros da tabela '${tableName}':`, error);
    throw error;
  }
};

// Função para encontrar tabelas filhas baseadas na presença de colunas <tabela_pai>_id
const findChildTables = async (db, parentTable) => {
  const query = `SELECT name FROM sqlite_master WHERE type='table'`;
  try {
    const tables = await db.getAllAsync(query);

    const childTables = [];
    for (const table of tables) {
      const pragmaQuery = `PRAGMA table_info(${table.name})`;
      const columns = await db.getAllAsync(pragmaQuery);

      // Verifica se a tabela contém uma coluna <tabela_pai>_id
      const hasForeignKey = columns.some(
        (column) => column.name === `${parentTable}_id`
      );

      if (hasForeignKey) {
        childTables.push(table.name);
      }
    }

    return childTables;
  } catch (error) {
    console.error("Erro ao buscar tabelas filhas:", error);
    throw error;
  }
};

const checkIfColumnExists = async (db, tableName, columnName) => {
  try {
    // Consulta para obter informações sobre as colunas da tabela
    const query = `PRAGMA table_info(${tableName})`;
    const result = await db.getAllAsync(query);

    // Verifica se a coluna está presente na lista de colunas
    const columnExists = result.some((column) => column.name === columnName);

    return columnExists;
  } catch (error) {
    console.error(
      `Erro ao verificar a existência da coluna '${columnName}' na tabela '${tableName}':`,
      error
    );
    return false; // Caso ocorra erro, retornamos false
  }
};

const checkIfTableExists = async (db, tableName) => {
  try {
    // Consulta para verificar se a tabela existe no banco de dados
    const query = `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`;
    const result = await db.getAllAsync(query);

    // Se o resultado for null ou undefined, a tabela não existe
    return result !== null && result !== undefined;
  } catch (error) {
    console.error(
      `Erro ao verificar a existência da tabela '${tableName}':`,
      error
    );
    return false; // Caso ocorra erro, retornamos false
  }
};

// Função para obter informações de chaves estrangeiras de uma tabela
const getForeignKeyInfo = async (db, tableName) => {
  const query = `PRAGMA foreign_key_list(${tableName})`;
  try {
    const results = await db.getAllAsync(query);
    return results.map((row) => ({
      columnName: row.from,      // Coluna na tabela filha
      table: row.table,          // Nome da tabela filha
      to: row.to                 // Coluna referenciada na tabela pai
    }));
  } catch (error) {
    console.error(
      `Erro ao obter informações de chaves estrangeiras da tabela '${tableName}':`,
      error
    );
    throw error;
  }
};

// Função para verificar se uma coluna existe em uma tabela
const columnExists = async (db, tableName, columnName) => {
  const query = `PRAGMA table_info(${tableName})`;
  const results = await db.getAllAsync(query);
  return results.some((row) => row.name === columnName);
};

// Função genérica para executar operações no banco de dados
const executeOperations = async (operations) => {
  for (const operation of operations) {
    const { func, args } = operation;
    try {
      await func(...args);
    } catch (error) {
      console.error(`Erro ao executar a operação ${func.name}:`, error);
      throw error;
    }
  }
};

// Função para agrupar registros por uma coluna relacionada (ex.: livros por autor)
const getGroupedRecords = async (
  databaseName,
  mainTable,
  relatedTable,
  groupByColumn,
  foreignKey
) => {
  const db = await openDatabase(databaseName);
  const query = `
    SELECT ${mainTable}.name AS ${groupByColumn}, ${relatedTable}.* 
    FROM ${mainTable}
    JOIN ${relatedTable} ON ${mainTable}.id = ${relatedTable}.${foreignKey}
    ORDER BY ${mainTable}.${groupByColumn}
  `;

  try {
    const groupedResults = await db.getAllAsync(query);
    return groupedResults;
  } catch (error) {
    console.error(
      `Erro ao agrupar registros de ${relatedTable} por ${groupByColumn}:`,
      error
    );
    throw error;
  }
};
// Função para obter informações sobre as chaves estrangeiras de uma tabela
const obterForKeyInfo = async (databaseName, tableName) => {
  const db = await openDatabase(databaseName);

  // Consultas SQL
  const tableInfoQuery = `PRAGMA table_info(${tableName})`;
  const foreignKeyQuery = `PRAGMA foreign_key_list(${tableName})`;

  try {
    // Obter informações da tabela
    const tableInfo = await db.getAllAsync(tableInfoQuery);

    // Obter informações das chaves estrangeiras
    const foreignKeys = await db.getAllAsync(foreignKeyQuery);

    // Criar um mapa para relacionamentos
    const relationships = foreignKeys.reduce((acc, fk) => {
      acc[fk.from] = {
        databaseName: databaseName,
        tableName: fk.table,
        fieldName: fk.to,
        displayField: "nome", // Você pode definir como um padrão ou obter dinamicamente
      };
      return acc;
    }, {});

    // Processar o esquema da tabela
    const schema = tableInfo.map((row) => {
      const match = row.type.match(/(\w+)(\((\d+)\))?/);
      return {
        columnName: row.name,
        dataType: match ? match[1] : row.type,
        isForeignKey: !!relationships[row.name],
        relationship: relationships[row.name] || null,
      };
    });

    // Retornar o esquema processado
    return schema;
  } catch (error) {
    console.error(`Erro ao obter o esquema da tabela ${tableName}:`, error);
    throw error;
  }
};

const getTableSchema = async (databaseName, tableName) => {
  const db = await openDatabase(databaseName);

  // Get table info
  const tableInfoQuery = `PRAGMA table_info(${tableName})`;

  // Get foreign key info
  const foreignKeyQuery = `
    SELECT 
      m.name as tableName,
      p."from" as columnName,
      p."to" as columnRef,
      p."table" as refTableName
    FROM sqlite_master m
    JOIN pragma_foreign_key_list(m.name) p
    WHERE m.name = ?
  `;

  try {
    // Get basic column info
    const tableInfo = await db.getAllAsync(tableInfoQuery);
    const foreignKeys = await db.getAllAsync(foreignKeyQuery, [tableName]);

    // Map foreign keys for easy lookup
    const fkMap = foreignKeys.reduce((acc, fk) => {
      acc[fk.columnName] = {
        referencedTable: fk.refTableName,
        referencedColumn: fk.columnRef,
      };
      return acc;
    }, {});

    // Map schema with additional information needed by FormComponent
    const schema = tableInfo.map((row) => ({
      columnName: row.name,
      dataType: mapSQLTypeToFieldType(row.type),
      notNull: row.notnull === 1,
      defaultValue: row.dflt_value,
      primaryKey: row.pk === 1,
      isForeignKey: !!fkMap[row.name],
      relationship: fkMap[row.name],
    }));

    return schema;
  } catch (error) {
    console.error(`Erro ao obter o esquema da tabela ${tableName}:`, error);
    throw error;
  }
};

// Helper function to map SQL types to form field types
const mapSQLTypeToFieldType = (sqlType) => {
  const type = sqlType.toLowerCase();

  if (type.includes("int")) {
    return "number";
  } else if (
    type.includes("text") ||
    type.includes("varchar") ||
    type.includes("char")
  ) {
    return "text";
  } else if (type.includes("boolean")) {
    return "checkbox";
  } else if (type.includes("date")) {
    return "date";
  } else if (type.includes("time")) {
    return "time";
  } else if (type.includes("blob")) {
    return "file";
  }

  return "text"; // default type
};

// Exporta todas as funções
export default {
  openDatabase,
  createTable,
  deleteTables,
  editTables,
  getTables,
  insert,
  getRecords,
  deleteRecords,
  editRecords,
  getTableSchema,
  executeOperations,
  obterForKeyInfo,
  getGroupedRecords,
};