import { API_URL } from "./apiConfig.js";


export async function getTasks() {

    const response = await axios.get(`${API_URL}/tasks`);

    return response.data;

}


export async function addTask(task) {

    const response = await axios.post(
        `${API_URL}/tasks`,
        task
    );

    return response.data;

}


export async function updateTask(id, task) {

    const response = await axios.put(
        `${API_URL}/tasks/${id}`,
        task
    );

    return response.data;

}


export async function deleteTask(id) {

    await axios.delete(
        `${API_URL}/tasks/${id}`
    );

}