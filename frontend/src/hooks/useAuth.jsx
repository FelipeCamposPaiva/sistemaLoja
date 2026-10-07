import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState
} from "react";

import { clearAuthorization, setAuthorization } from "../services/api";
import { loginApi, verificar2faApi } from "../services/auth.service";

const SESSAO_EXPLICITA_KEY = "erp-sessao-ok";

const AuthContext = createContext(null);

function lerCookie(nome) {
    const prefixo = `${nome}=`;
    const cookies = document.cookie ? document.cookie.split("; ") : [];
    for (const item of cookies) {
        if (item.startsWith(prefixo)) {
            return decodeURIComponent(item.slice(prefixo.length));
        }
    }
    return "";
}

function gravarCookieSessao() {
    document.cookie = `${SESSAO_EXPLICITA_KEY}=1; Path=/; SameSite=Lax`;
}

function apagarCookieSessao() {
    document.cookie = `${SESSAO_EXPLICITA_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function sessaoExplicita() {
    try {
        const nestaAba = sessionStorage.getItem(SESSAO_EXPLICITA_KEY) === "1";
        const noNavegador = lerCookie(SESSAO_EXPLICITA_KEY) === "1";
        const token = localStorage.getItem("token");

        if (token && nestaAba && !noNavegador) {
            gravarCookieSessao();
        }

        if (token && noNavegador && !nestaAba) {
            sessionStorage.setItem(SESSAO_EXPLICITA_KEY, "1");
            return true;
        }

        return nestaAba || noNavegador;
    } catch {
        return false;
    }
}

function marcarSessaoExplicita() {
    try {
        sessionStorage.setItem(SESSAO_EXPLICITA_KEY, "1");
        gravarCookieSessao();
    } catch {
        /* ignore */
    }
}

function limparSessaoExplicita() {
    try {
        sessionStorage.removeItem(SESSAO_EXPLICITA_KEY);
        apagarCookieSessao();
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
    const data = error.response?.data;
    const status = error.response?.status;
    if (data && typeof data === "object") {
        if (data.mensagem) {
            return data.mensagem;
        }
        if (data.message && data.message !== "No message available") {
            return data.message;
        }
    }
    if (!error.response) {
        return "Erro ao conectar com o servidor.";
    }
    if (status >= 500) {
        return "O servidor encontrou um erro. Tente de novo em instantes.";
    }
    if (status === 401 || status === 403) {
        return "Usuário ou senha inválidos.";
    }
    return "Não foi possível entrar. Tente de novo.";
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
            const data = await loginApi(String(usuarioLogin ?? "").trim(), String(senha ?? "").trim());

            if (data?.precisa2fa) {
                return {
                    sucesso: false,
                    precisa2fa: true,
                    codigo: data.codigo2fa || "",
                    mensagem: "Informe o código de verificação."
                };
            }

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

    const confirmar2fa = useCallback(async (usuarioLogin, codigo) => {
        try {
            const data = await verificar2faApi(String(usuarioLogin ?? "").trim(), String(codigo ?? "").trim());
            const tokenRecebido = data?.token;
            if (!tokenRecebido) {
                return { sucesso: false, mensagem: "Código inválido." };
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
            confirmar2fa,
            login,
            logout
        }),
        [token, usuario, inicializando, login, confirmar2fa, logout]
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
