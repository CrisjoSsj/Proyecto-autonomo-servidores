import { useForm, type SubmitHandler } from 'react-hook-form';
import type { Ilogin } from '../interfaces/login';
import { login as loginApi } from '../api/login';
import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null >(null);

  const { login: loginContext } = useContext(AuthContext);

  const { register, handleSubmit, formState: { errors } } = useForm<Ilogin>();

  const onSubmit: SubmitHandler<Ilogin> = async (data) => {
    try {
        const res = await loginApi(data);
        const token = res.data.token ?? res.data.accessToken;
        if (!token) throw new Error('No token returned from login');
        loginContext(token);

        navigate("/");
    } catch (err: any) {
      setApiError("Error al Iniciar Sesión, revisa tus datos");
      console.log(err.response?.data)
      console.error(err);
    }
  };

  return (
    <div className="container">
        <form onSubmit={handleSubmit(onSubmit)}>
          <input placeholder='Usuario' {...register('username', { required: 'Obligatorio' })} />
          {errors.username && <span> {errors.username.message} </span> }

          <input type="password" placeholder='Contraseña' {...register('password', { required: 'Obligatorio' })} />
          {errors.password && <span> {errors.password.message} </span>}

          <p><Link to='/signup'>¿No tienes cuenta? Registrate aquí</Link></p>

          {apiError && <p style={{ color: 'red' }}>{apiError}</p>}
          <button type='submit'>Iniciar Sesión</button>
        </form>
    </div>
  )
}
