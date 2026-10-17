import axios, { AxiosError } from 'axios';
import { useSessionStore } from 'hooks/stores';
import { alertError } from './alerts';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : '/api',
  withCredentials: true,
});

api.interceptors.response.use((response) => response, (error: AxiosError) => {
  const statusCode = error.response.status;
  if (statusCode === 401) {
    setTimeout(() => {
      useSessionStore.setState({ isLogin: false });
    }, 0);
  } else if (statusCode === 500) {
    setTimeout(() => {
      alertError('서버 오류가 발생했습니다.');
    }, 0);
  }
});

export default api;
