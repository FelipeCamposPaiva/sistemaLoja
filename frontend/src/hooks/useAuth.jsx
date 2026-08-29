import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";

import axios from "axios";

const API_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "/api" : "http://localhost:8080/api");

const DEV_TOKEN = "dev-token";
const DEV_LOGIN = "admin";
const DEV_SENHA = "123456";

const USUARIO_DEV = {
    token: DEV_TOKEN,
    tipo: "Bearer",
    id: 1,
    nome: "Administrador",
    usuario: DEV_LOGIN,
    email: "admin@temdetudovr.com.br",
    perfil: "ADMIN"
};

const AuthContext = createContext(null);

function tokenAceito(token) {
    if (!token) {
        return false;
    }

    if (token === DEV_TOKEN) {
        return import.meta.env.DEV;
    }

    return true;
}

function persistirSessao(tokenRecebido, dadosUsuario) {
    localStorage.setItem("token", tokenRecebido);
    localStorage.setItem("usuario", JSON.stringify(dadosUsuario));
}

function lerSessao() {
    try {
        const token = localStorage.getItem("token");
        const raw = localStorage.getItem("usuario");

        if (!tokenAceito(token)) {
            return { token: null, usuario: null };
        }

        return {
            token,
            usuario: raw ? JSON.parse(raw) : null
        };
    } catch {
        return { token: null, usuario: null };
    }
}

export function AuthProvider({ children }) {
    const sessao = lerSessao();

    const [token, setToken] = useState(sessao.token);
    const [usuario, setUsuario] = useState(sessao.usuario);
    const [inicializando, setInicializando] = useState(
        () => import.meta.env.DEV && !sessao.token
    );

    const aplicarSessao = useCallback((tokenRecebido, dadosUsuario) => {
        persistirSessao(tokenRecebido, dadosUsuario);
        setToken(tokenRecebido);
        setUsuario(dadosUsuario);
    }, []);

    const aplicarSessaoDummy = useCallback(() => {
        aplicarSessao(DEV_TOKEN, USUARIO_DEV);
    }, [aplicarSessao]);

    const login = useCallback(async (usuarioLogin, senha) => {
        try {
            const { data } = await axios.post(
                `${API_URL}/auth/login`,
                {
                    login: usuarioLogin,
                    senha
                }
            );

            const tokenRecebido = data?.token;

            if (!tokenRecebido) {
                return {
                    sucesso: false,
                    mensagem: "Resposta de login sem token."
                };
            }

            aplicarSessao(tokenRecebido, data);

            return { sucesso: true };
        } catch (error) {
            if (!error.response) {
                return {
                    sucesso: false,
                    mensagem: "Erro ao conectar com o servidor."
                };
            }

            const mensagem =
                error.response.data?.message ||
                error.response.data?.mensagem ||
                "Usuário ou senha inválidos.";

            return {
                sucesso: false,
                mensagem
            };
        }
    }, [aplicarSessao]);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        setToken(null);
        setUsuario(null);
    }, []);

    useEffect(() => {
        if (!import.meta.env.DEV) {
            return;
        }

        if (tokenAceito(lerSessao().token)) {
            setInicializando(false);
            return;
        }

        let cancelado = false;

        (async () => {
            const resultado = await login(DEV_LOGIN, DEV_SENHA);

            if (cancelado) {
                return;
            }

            if (!resultado.sucesso) {
                aplicarSessaoDummy();
            }

            setInicializando(false);
        })();

        return () => {
            cancelado = true;
        };
    }, [aplicarSessaoDummy, login]);

    const value = useMemo(
        () => ({
            token,
            usuario,
            autenticado: tokenAceito(token),
            inicializando,
            login,
            logout
        }),
        [token, usuario, inicializando, login, logout]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth deve ser utilizado dentro de AuthProvider.");
    }

    return context;
}
