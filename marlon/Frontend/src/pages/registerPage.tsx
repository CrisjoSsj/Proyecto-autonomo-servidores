import { useForm, type SubmitHandler } from 'react-hook-form';
import { registerAuth } from '../api/register';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

type RegisterFormValues = {
  rol: 'cliente' | 'proveedor';
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  telefono?: string;
  descripcion?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  pais?: string;
};

export function RegisterPage() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormValues>({
    defaultValues: { rol: 'cliente' }
  });

  const rolValue = watch('rol');

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    try {
      // Registrar en auth-service (este se encarga de sincronizar con Django)
      const authPayload = {
        username: data.username,
        password: data.password,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        role: data.rol,
        telefono: data.telefono || '0000000000',
        descripcion: data.descripcion || '',
        ubicacion: data.direccion ? {
          direccion: data.direccion,
          ciudad: data.ciudad || '',
          provincia: data.provincia || '',
          pais: data.pais || ''
        } : null
      };
      
      const res = await registerAuth(authPayload);
      console.log('Usuario registrado', res.data);

      navigate('/login'); // Redirige después de registro
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 
                       err.response?.data?.detail ||
                       'Error al registrar, revisa tus datos';
      setApiError(errorMsg);
      console.log(err.response?.data);
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <select {...register('rol', { required: 'Selecciona un rol' })}>
        <option value="">Selecciona tu rol</option>
        <option value="cliente">Cliente</option>
        <option value="proveedor">Proveedor</option>
      </select>
      {errors.rol && <span>{errors.rol.message}</span>}

      <input placeholder="Nombre" {...register('first_name', { required: 'Obligatorio' })} />
      {errors.first_name && <span>{errors.first_name.message}</span>}

      <input placeholder="Apellido" {...register('last_name', { required: 'Obligatorio' })} />
      {errors.last_name && <span>{errors.last_name.message}</span>}

      <input placeholder="Username" {...register('username', { required: 'Obligatorio' })} />
      {errors.username && <span>{errors.username.message}</span>}

      <input type="email" placeholder="Email" {...register('email', { required: 'Obligatorio' })} />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="password" placeholder="Contraseña" {...register('password', { required: 'Obligatorio', minLength: { value: 6, message: 'Min 6 caracteres' } })} />
      {errors.password && <span>{errors.password.message}</span>}

      <input placeholder="Teléfono" {...register('telefono')} />

      {rolValue === 'proveedor' && (
        <input placeholder="Descripción" {...register('descripcion', { required: 'Obligatorio para proveedores' })} />
      )}
      {errors.descripcion && <span>{errors.descripcion.message}</span>}

      <h3>Ubicación (opcional)</h3>
      <input placeholder="Dirección" {...register('direccion')} />
      <input placeholder="Ciudad" {...register('ciudad')} />
      <input placeholder="Provincia" {...register('provincia')} />
      <input placeholder="País" {...register('pais')} />

      <p><Link to='/login'>¿Ya tienes cuenta? Inicia Sesión aquí</Link></p>

      {apiError && <p style={{ color: 'red' }}>{apiError}</p>}
      <button type="submit">Registrarse</button>
    </form>
  );
}
