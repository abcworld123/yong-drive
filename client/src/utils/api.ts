import axios, { AxiosError } from 'axios';
import { useSessionStore } from 'hooks/stores';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
});

function toUserMessage(error: AxiosError) {
  if (!error.response) return '서버에 연결할 수 없습니다.';
  const { status } = error.response;
  if (status === 401) return '로그인이 필요합니다.';
  if (status >= 500) return '서버 오류가 발생했습니다.';
  const detail = (error.response.data as { detail?: unknown } | undefined)?.detail;
  if (typeof detail === 'string' && detail) return detail;
  return error.message;
}

api.interceptors.response.use((response) => response, (error: AxiosError) => {
  if (error.response?.status === 401) {
    setTimeout(() => {
      useSessionStore.setState({ isLogin: false });
    }, 0);
  }
  error.message = toUserMessage(error);
  return Promise.reject(error);
});

// A 401 already swaps in the login modal (see the interceptor); alerting it too would only flash over the modal.
export function isUnauthorized(err: unknown) {
  return axios.isAxiosError(err) && err.response?.status === 401;
}

export default api;
