import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSessionStore } from 'hooks/stores';
import api, { isUnauthorized } from 'utils/api';

function respondWith(status: number, data?: unknown) {
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const response: AxiosResponse = { status, statusText: '', data, headers: {}, config };
    if (status < 400) return response;
    throw new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_RESPONSE', config, null, response);
  };
}

function networkError() {
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
  };
}

async function failure(): Promise<AxiosError> {
  try {
    await api.post('/object/get', {}, { headers: new AxiosHeaders() });
  } catch (err) {
    return err;
  }
  throw new Error('expected the request to fail');
}

describe('api response interceptor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useSessionStore.setState({ isLogin: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('passes successful responses through untouched', async () => {
    respondWith(200, { success: true });
    const { data } = await api.post('/object/get', {});
    expect(data).toEqual({ success: true });
  });

  it('shows the ProblemDetail detail for a 4xx', async () => {
    respondWith(409, { status: 409, detail: '폴더가 이미 존재합니다.' });
    expect((await failure()).message).toBe('폴더가 이미 존재합니다.');
  });

  it('falls back to the axios message when a 4xx has no detail', async () => {
    respondWith(400, 'plain text');
    expect((await failure()).message).toBe('Request failed with status code 400');
  });

  it('hides server internals behind a generic message for a 5xx', async () => {
    respondWith(500, { detail: 'NullPointerException at ...' });
    expect((await failure()).message).toBe('서버 오류가 발생했습니다.');
  });

  it('reports an unreachable server', async () => {
    networkError();
    expect((await failure()).message).toBe('서버에 연결할 수 없습니다.');
  });

  it('logs the user out on a 401 and marks the error as handled', async () => {
    respondWith(401);
    const err = await failure();
    expect(err.message).toBe('로그인이 필요합니다.');
    expect(isUnauthorized(err)).toBe(true);
    vi.runAllTimers();
    expect(useSessionStore.getState().isLogin).toBe(false);
  });

  it('does not treat other errors as unauthorized', async () => {
    respondWith(403);
    expect(isUnauthorized(await failure())).toBe(false);
    expect(isUnauthorized(new Error('x'))).toBe(false);
    vi.runAllTimers();
    expect(useSessionStore.getState().isLogin).toBe(true);
  });
});
