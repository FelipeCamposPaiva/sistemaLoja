import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState
} from "react";

import api, { clearAuthorization, setAuthorization } from "../services/api";

const SESSAO_EXPLICITA_KEY = "erp-sessao-ok";

const AuthContext = createContext(null);

function sessaoExplicita() {
    try {
        return sessionStorage.getItem(SESSAO_EXPLICITA_KEY) === "1";
    } catch {
        return false;
    }
}

function marcarSessaoExplicita() {
    try {
        sessionStorage.setItem(SESSAO_EXPLICITA_KEY, "1");
    } catch {
        /* ignore */
    }
}

function limparSessaoExplicita() {
    try {
        sessionStorage.removeItem(SESSAO_EXPLICITA_KEY);
    } catch {
        /* ignore */
    }
}

function tokenAceito(token) {
    return Boolean(token) && sessaoExplicita();
}

function persistirSessao(tokenRecebido, dadosUsuario) {
    localStorage.setItem("token", tokenRecebido);
    localStorage.setItem("usuario", JSON.stringify(dadosUsuario));
    setAuthorization(tokenRecebido);
}

function lerSessao() {
    try {
        const token = localStorage.getItem("token");
        const raw = localStorage.getItem("usuario");

        if (!tokenAceito(token)) {
            return { token: null, usuario: null };
        }

        setAuthorization(token);
        return {
            token,
            usuario: raw ? JSON.parse(raw) : null
        };
    } catch {
        return { token: null, usuario: null };
    }
}

function mensagemErro(error) {
    if (!error.response) {
        return "Erro ao conectar com o servidor.";
    }
    return (
        error.response.data?.mensagem ||
        error.response.data?.message ||
        "Usuário ou senha inválidos."
    );
}

export function AuthProvider({ children }) {
    const sessao = lerSessao();

    const [token, setToken] = useState(sessao.token);
    const [usuario, setUsuario] = useState(sessao.usuario);
    const [inicializando] = useState(false);

    const aplicarSessao = useCallback((tokenRecebido, dadosUsuario) => {
        marcarSessaoExplicita();
        persistirSessao(tokenRecebido, dadosUsuario);
        setToken(tokenRecebido);
        setUsuario(dadosUsuario);
    }, []);

    const login = useCallback(async (usuarioLogin, senha) => {
        try {
            const { data } = await api.post(
                "/auth/login",
                {
                    login: String(usuarioLogin ?? "").trim(),
                    senha: String(senha ?? "").trim()
                },
                { timeout: 15000 }
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
            return {
                sucesso: false,
                mensagem: mensagemErro(error)
            };
        }
    }, [aplicarSessao]);

    const logout = useCallback(() => {
        limparSessaoExplicita();
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        clearAuthorization();
        setToken(null);
        setUsuario(null);
    }, []);

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
