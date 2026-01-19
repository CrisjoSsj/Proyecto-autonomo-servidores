import { useState, type  ReactNode, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { authenticateSocket, disconnectSocket } from '../websocket/socket';
import { useNavigate } from 'react-router-dom';
import { parseJwt } from '../utils/jwt';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const navigate = useNavigate();
    
    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        if (savedToken) setToken(savedToken);
    }, []);

    const login = async (newToken: string) => {
        setToken(newToken);
        localStorage.setItem('token', newToken);

        try {
            const payload = parseJwt(newToken) ?? {};
            const id = payload.sub ?? payload.id;
            const roleRaw = payload.role ?? payload.rol;
            let rol: 'cliente' | 'proveedor' | 'admin' | null = null;
            if (roleRaw === 'cliente' || roleRaw === 'proveedor' || roleRaw === 'admin') rol = roleRaw;
            else if (roleRaw === 'user') rol = 'cliente';

            if (id && rol) {
                await authenticateSocket({ token: newToken, userId: String(id), role: rol });
            }

            // Redirigir al dashboard de proveedor si aplica
            if (rol === 'proveedor') {
                navigate('/proveedor/dashboard');
            }
        } catch (e) {
            console.error('WebSocket auth failed:', e);
        }
    };

    const logout = () => {
        setToken(null);
        localStorage.removeItem('token');
        disconnectSocket();
    };

    useEffect(() => {
        // Auto-autenticar WebSocket si hay token guardado al cargar
        const savedToken = localStorage.getItem('token');
        if (!savedToken) return;
        (async () => {
            try {
                const payload = parseJwt(savedToken) ?? {};
                const id = payload.sub ?? payload.id;
                const roleRaw = payload.role ?? payload.rol;
                let rol: 'cliente' | 'proveedor' | 'admin' | null = null;
                if (roleRaw === 'cliente' || roleRaw === 'proveedor' || roleRaw === 'admin') rol = roleRaw;
                else if (roleRaw === 'user') rol = 'cliente';

                if (id && rol) {
                    await authenticateSocket({ token: savedToken, userId: String(id), role: rol });
                }
            } catch (e) {
                console.warn('Auto WebSocket auth skipped:', e);
            }
        })();
    }, []);

    return(
        <AuthContext.Provider value = {{token, login, logout }} >
            {children}
        </AuthContext.Provider>
    )
}