/** 
* this will centralizes the axios instance so every part of the app talks to the backend the same way, also automatically attaches the login token to every
* request
*/

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('flowfunds_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api