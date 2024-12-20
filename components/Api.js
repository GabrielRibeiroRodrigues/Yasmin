import axios from "axios";

const API_BASE_URL = "https://campusinteligente.ifsuldeminas.edu.br/api/";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common["Authorization"];
    }
};

export const login = async (username, password) => {
    try {
        const json = { "username": "gabriel.ribeiro", "password": "ifsuldeminas" };
        const response = await api.post('/token/', json);
        return response.data;
    } catch (error) {
        console.log("Login error:", error); // Mostra o erro completo se houver falha
        throw error;
    }
};

// Método GET com parâmetros opcionais (id, profundidade)
export const get = async (aplicacao, tabela, id = null, profundidade = null) => {
    try {
        let url = `/${aplicacao}/${tabela}/`;
        if (id) url += `${id}/`;
        if (profundidade) url += `?depth=${profundidade}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return Promise.reject(error.response.data);
        }
        return Promise.reject(error);
    }
};

// Método CREATE
export const create = async (aplicacao, tabela, data) => {
    try {
        const url = `/${aplicacao}/${tabela}/`;
        const response = await api.post(url, data);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return Promise.reject(error.response.data);
        }
        return Promise.reject(error);
    }
};
// Método UPDATE (PATCH)
export const update = async (aplicacao, tabela, id, data) => {
    try {
        const url = `/${aplicacao}/${tabela}/${id}/`;
        const response = await api.patch(url, data);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return Promise.reject(error.response.data);
        }
        return Promise.reject(error);
    }
};

// Método DELETE
export const remove = async (aplicacao, tabela, id) => {
    try {
        const url = `/${aplicacao}/${tabela}/${id}/`;
        const response = await api.delete(url);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return Promise.reject(error.response.data);
        }
        return Promise.reject(error);
    }
};