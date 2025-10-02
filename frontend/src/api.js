import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api", // backend URL
  withCredentials: true // send cookies automatically
});

export default api;