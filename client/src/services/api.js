// API client configuration and endpoints
const API_BASE_URL = "http://localhost:8000/api";

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

// Helper function to make API requests
const apiRequest = async (method, endpoint, data = null) => {
  const headers = {
    "Content-Type": "application/json",
  };

  const authToken = getAuthToken();
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const config = {
    method,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error);
    throw error;
  }
};

// Transaction API endpoints
export const transactionAPI = {
  // Create a new transaction
  create: (transactionData) =>
    apiRequest("POST", "/transactions", transactionData),

  // Get all transactions for the authenticated user
  getAll: () => apiRequest("GET", "/transactions"),

  // Get a single transaction by ID
  getById: (id) => apiRequest("GET", `/transactions/${id}`),

  // Update a transaction
  update: (id, transactionData) =>
    apiRequest("PUT", `/transactions/${id}`, transactionData),

  // Delete a transaction
  delete: (id) => apiRequest("DELETE", `/transactions/${id}`),
};

// Category API endpoints
export const categoryAPI = {
  // Get all categories for the authenticated user
  getAll: () => apiRequest("GET", "/categories"),
};

// Auth API endpoints (placeholder for Person 3)
export const authAPI = {
  login: (email, password) =>
    apiRequest("POST", "/auth/login", { email, password }),

  signup: (email, password, name) =>
    apiRequest("POST", "/auth/signup", { email, password, name }),

  logout: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  },

  setToken: (token) => {
    localStorage.setItem("authToken", token);
  },

  getToken: () => getAuthToken(),

  isAuthenticated: () => !!getAuthToken(),
};
