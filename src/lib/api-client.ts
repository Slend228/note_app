import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Auth API
export const authAPI = {
  register: async (name: string, email: string, password: string) => {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  requestPasswordReset: async (email: string) => {
    const response = await api.post("/auth/request-password-reset", { email });
    return response.data;
  },
};

// Notes API
export const notesAPI = {
  getNotes: async (includeDeleted = false) => {
    const response = await api.get(`/notes?includeDeleted=${includeDeleted}`);
    return response.data;
  },

  getNoteById: async (id: string) => {
    const response = await api.get(`/notes/${id}`);
    return response.data;
  },

  createNote: async (note: {
    title: string;
    content?: string;
    audioUrl?: string;
    hasAudio?: boolean;
    tags?: string[];
    isFavorite?: boolean;
    folderId?: string | null;
  }) => {
    const response = await api.post("/notes", note);
    return response.data;
  },

  updateNote: async (
    id: string,
    note: {
      title?: string;
      content?: string;
      audioUrl?: string;
      hasAudio?: boolean;
      tags?: string[];
      isFavorite?: boolean;
      folderId?: string | null;
    },
  ) => {
    const response = await api.put(`/notes/${id}`, note);
    return response.data;
  },

  moveNoteToTrash: async (id: string) => {
    const response = await api.put(`/notes/${id}/trash`);
    return response.data;
  },

  restoreNoteFromTrash: async (id: string) => {
    const response = await api.put(`/notes/${id}/restore`);
    return response.data;
  },

  deleteNotePermanently: async (id: string) => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  },

  moveNoteToFolder: async (id: string, folderId: string | null) => {
    const response = await api.put(`/notes/${id}/move`, { folderId });
    return response.data;
  },
};

// Folders API
export const foldersAPI = {
  getFolders: async () => {
    const response = await api.get("/folders");
    return response.data;
  },

  createFolder: async (folder: { name: string; color?: string }) => {
    const response = await api.post("/folders", folder);
    return response.data;
  },

  updateFolder: async (
    id: string,
    folder: { name?: string; color?: string },
  ) => {
    const response = await api.put(`/folders/${id}`, folder);
    return response.data;
  },

  deleteFolder: async (id: string) => {
    const response = await api.delete(`/folders/${id}`);
    return response.data;
  },
};

export default api;
