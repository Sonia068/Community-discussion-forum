import axios from "axios";

// create an axios instance with base configuration
const api = axios.create({
  baseURL: "/api",
});

// this interceptor runs before every request
// it automatically adds the JWT token to the headers if the user is logged in
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = "Bearer " + token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// this interceptor runs after every response
// if we get a 401 it means the token expired so we log the user out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;