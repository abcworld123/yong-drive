import 'styles/tailwind.css';
import 'styles/globals.scss';
import Head from 'next/head';
import { useCallback, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useLayoutStore, useSessionStore } from 'hooks/stores';
import Loader from 'svg/Loader';
import { alertError, shakeOutsideClick } from 'utils/alerts';
import api from 'utils/api';
import { sha256Hex } from 'utils/hash';
import type { AppProps } from 'next/app';
import type { ResCheck, ResLogin } from 'types/apis';

function App({ Component, pageProps }: AppProps) {
  const isLogin = useSessionStore(state => state.isLogin);
  const dropdownClick = useLayoutStore(state => state.dropdownClick);

  const login = useCallback(() => {
    Swal.fire({
      icon: 'info',
      title: '비밀번호 입력',
      input: 'password',
      backdrop: true,
      focusConfirm: false,
      allowEscapeKey: false,
      confirmButtonText: '확인',
      showLoaderOnConfirm: true,
      allowOutsideClick: shakeOutsideClick,
      preConfirm: async (pw: string) => {
        if (!pw.trim()) { Swal.showValidationMessage('비밀번호를 입력해주세요.'); return; }
        try {
          const { data } = await api.post<ResLogin>('/auth/login', { pw: await sha256Hex(pw.trim()) });
          if (!data.success) Swal.showValidationMessage('비밀번호가 일치하지 않습니다.');
          else useSessionStore.setState({ isLogin: true });
        } catch (err) {
          Swal.showValidationMessage(err.message);
        }
      },
    });
  }, []);

  const check = useCallback(async () => {
    try {
      const { data } = await api.get<ResCheck>('/auth/check');
      useSessionStore.setState({ isLogin: data.success });
    } catch (err) {
      alertError(err.message);
      useSessionStore.setState({ isLogin: false });
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  useEffect(() => {
    if (isLogin === false) {
      login();
    }
  }, [isLogin, login]);

  useEffect(() => {
    const handler = ({ target }: MouseEvent) => {
      if (target instanceof HTMLElement && !target.classList.contains('btn-dropdown')) {
        dropdownClick(null);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [dropdownClick]);

  return (
    <>
      <Head>
        <title>yong-drive</title>
      </Head>
      {
        isLogin === true
          ? <Component {...pageProps} />
          : <Loader />
      }
    </>
  );
}

export default App;
