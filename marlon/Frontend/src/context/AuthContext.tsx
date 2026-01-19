import { createContext } from 'react';

type AuthContextType = {
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
    token: null,
    login: () => {},
    logout: () => {},
});