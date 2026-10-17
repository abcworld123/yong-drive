import 'animate.css';
import Swal from 'sweetalert2';

export function alertSuccess(msg: string) {
  return Swal.fire({
    icon: 'success',
    title: 'Success',
    text: msg,
  });
}

export function alertError(msg: string) {
  return Swal.fire({
    icon: 'error',
    title: 'Error',
    text: msg,
  });
}

export function alertWarn(title: string) {
  return Swal.fire({
    icon: 'warning',
    title: title,
  });
}

export function alertConfirm(title: string, msg: string) {
  return Swal.fire({
    icon: 'warning',
    title: title,
    text: msg,
    showCancelButton: true,
    confirmButtonText: '확인',
    cancelButtonText: '취소',
  });
}

export function alertWait(title: string) {
  return Swal.fire({
    title: title,
    imageUrl: '/img/loading.svg',
    showConfirmButton: false,
    allowOutsideClick: shakeOutsideClick,
    allowEscapeKey: false,
    backdrop: true,
  });
}

export function shakeOutsideClick() {
  const popup = Swal.getPopup();
  popup.classList.remove('swal2-show');
  setTimeout(() => {
    popup.classList.add('animate__animated', 'animate__headShake');
  });
  setTimeout(() => {
    popup.classList.remove('animate__animated', 'animate__headShake');
  }, 500);
  return false;
}
