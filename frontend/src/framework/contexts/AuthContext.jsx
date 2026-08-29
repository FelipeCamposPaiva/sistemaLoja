import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";

import AuthService from "../services/auth.service";

import auth from "../core/auth/auth";

/*
|--------------------------------------------------------------------------
| Context
|--------------------------------------------------------------------------
*/

const AuthContext = createContext(null);

/*
|--------------------------------------------------------------------------
| Estado Inicial
|--------------------------------------------------------------------------
*/

const INITIAL_STATE = {

    token: null,

    refreshToken: null,

    usuario: null,

    empresa: null,

    filial: null,

    permissoes: [],

    modulos: [],

    menu: [],

    preferencias: {},

    autenticado: false,

    ultimoLogin: null,

    ultimaAtividade: null

};

/*
|--------------------------------------------------------------------------
| Provider
|--------------------------------------------------------------------------
*/

export function AuthProvider({

    children

}) {

    /*
    |--------------------------------------------------------------------------
    | Estados
    |--------------------------------------------------------------------------
    */

    const [

        loading,

        setLoading

    ] = useState(true);

    const [

        sessao,

        setSessao

    ] = useState(INITIAL_STATE);

    /*
    |--------------------------------------------------------------------------
    | Dados derivados
    |--------------------------------------------------------------------------
    */

    const token = sessao.token;

    const refreshToken = sessao.refreshToken;

    const usuario = sessao.usuario;

    const empresa = sessao.empresa;

    const filial = sessao.filial;

    const permissoes = sessao.permissoes;

    const modulos = sessao.modulos;

    const menu = sessao.menu;

    const preferencias = sessao.preferencias;

    const autenticado =

        Boolean(

            token && usuario

        );

    /*
    |--------------------------------------------------------------------------
    | Carregar Sessão
    |--------------------------------------------------------------------------
    */

    const carregarSessao = useCallback(() => {

        try {

            const dados = auth.getSessao();

            if (!dados) {

                setLoading(false);

                return;

            }

            setSessao({

                ...INITIAL_STATE,

                ...dados,

                autenticado: true

            });

        }

        catch (erro) {

            console.error(

                erro

            );

            auth.logout();

        }

        finally {

            setLoading(false);

        }

    }, []);

    /*
    |--------------------------------------------------------------------------
    | Salvar Sessão
    |--------------------------------------------------------------------------
    */

    const salvarSessao = useCallback((dados) => {

        const novaSessao = {

            ...INITIAL_STATE,

            ...dados,

            autenticado: true,

            ultimaAtividade:

                new Date().toISOString()

        };

        auth.login(

            novaSessao

        );

        setSessao(

            novaSessao

        );

    }, []);

    /*
    |--------------------------------------------------------------------------
    | Atualizar Sessão
    |--------------------------------------------------------------------------
    */

    const atualizarSessao = useCallback((dados) => {

        setSessao(sessaoAtual => {

            const novaSessao = {

                ...sessaoAtual,

                ...dados,

                ultimaAtividade:

                    new Date().toISOString()

            };

            auth.salvarSessao(

                novaSessao

            );

            return novaSessao;

        });

    }, []);

    /*
    |--------------------------------------------------------------------------
    | Limpar Sessão
    |--------------------------------------------------------------------------
    */

    const limparSessao = useCallback(() => {

        auth.logout();

        setSessao(

            INITIAL_STATE

        );

    }, []);

    /*
    |--------------------------------------------------------------------------
    | Inicialização
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        carregarSessao();

    }, [

        carregarSessao

    ]);

    /*
    |--------------------------------------------------------------------------
    | Login
    |--------------------------------------------------------------------------
    */

    // Continua na Parte 2...

    /*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

const login = useCallback(async (login, senha) => {

    setLoading(true);

    try {

        const response = await AuthService.login({

            login,

            senha

        });

        salvarSessao({

            token: response.token,

            refreshToken:

                response.refreshToken,

            usuario:

                response.usuario,

            empresa:

                response.empresa,

            filial:

                response.filial,

            permissoes:

                response.permissoes ?? [],

            modulos:

                response.modulos ?? [],

            menu:

                response.menu ?? [],

            preferencias:

                response.preferencias ?? {},

            ultimoLogin:

                new Date().toISOString()

        });

        return {

            success: true,

            usuario: response.usuario

        };

    }

    catch (erro) {

        limparSessao();

        return {

            success: false,

            message:

                erro?.response?.data?.message ??

                "Usuário ou senha inválidos."

        };

    }

    finally {

        setLoading(false);

    }

}, [

    salvarSessao,

    limparSessao

]);

/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

const logout = useCallback(async () => {

    try {

        if (

            AuthService.logout

        ) {

            await AuthService.logout();

        }

    }

    catch {

    }

    finally {

        limparSessao();

    }

}, [

    limparSessao

]);

/*
|--------------------------------------------------------------------------
| Refresh Token
|--------------------------------------------------------------------------
*/

const renovarToken = useCallback(async () => {

    if (

        !refreshToken ||

        !AuthService.refreshToken

    ) {

        return false;

    }

    try {

        const response =

            await AuthService.refreshToken(

                refreshToken

            );

        atualizarSessao({

            token:

                response.token,

            refreshToken:

                response.refreshToken ??

                refreshToken

        });

        return true;

    }

    catch {

        limparSessao();

        return false;

    }

}, [

    refreshToken,

    atualizarSessao,

    limparSessao

]);

/*
|--------------------------------------------------------------------------
| Atualizações
|--------------------------------------------------------------------------
*/

const atualizarUsuario = useCallback((dados) => {

    atualizarSessao({

        usuario: {

            ...usuario,

            ...dados

        }

    });

}, [

    usuario,

    atualizarSessao

]);

const atualizarEmpresa = useCallback((empresaNova) => {

    atualizarSessao({

        empresa:

            empresaNova

    });

}, [

    atualizarSessao

]);

const atualizarFilial = useCallback((filialNova) => {

    atualizarSessao({

        filial:

            filialNova

    });

}, [

    atualizarSessao

]);

const atualizarPermissoes = useCallback((lista) => {

    atualizarSessao({

        permissoes:

            lista

    });

}, [

    atualizarSessao

]);

const atualizarModulos = useCallback((lista) => {

    atualizarSessao({

        modulos:

            lista

    });

}, [

    atualizarSessao

]);

const atualizarMenu = useCallback((lista) => {

    atualizarSessao({

        menu:

            lista

    });

}, [

    atualizarSessao

]);

const atualizarPreferencias = useCallback((dados) => {

    atualizarSessao({

        preferencias: {

            ...preferencias,

            ...dados

        }

    });

}, [

    preferencias,

    atualizarSessao

]);

const atualizarToken = useCallback((novoToken) => {

    atualizarSessao({

        token:

            novoToken

    });

}, [

    atualizarSessao

]);

const atualizarRefreshToken = useCallback((novoToken) => {

    atualizarSessao({

        refreshToken:

            novoToken

    });

}, [

    atualizarSessao

]);

/*
|--------------------------------------------------------------------------
| Getters
|--------------------------------------------------------------------------
*/

const getSessao = () => sessao;

const getUsuario = () => usuario;

const getEmpresa = () => empresa;

const getFilial = () => filial;

const getToken = () => token;

const getRefreshToken = () => refreshToken;

const getPermissoes = () => permissoes;

const getModulos = () => modulos;

const getMenu = () => menu;

const getPreferencias = () => preferencias;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const isAuthenticated = () =>

    autenticado;

const isLoading = () =>

    loading;

const isAdmin = () =>

    usuario?.role === "ADMIN";

const hasRole = (...roles) =>

    roles.includes(

        usuario?.role

    );

const hasPermission = (...permissions) =>

    isAdmin() ||

    permissions.every(

        permission =>

            permissoes.includes(

                permission

            )

    );

const hasAnyPermission = (...permissions) =>

    isAdmin() ||

    permissions.some(

        permission =>

            permissoes.includes(

                permission

            )

    );

const hasModule = module =>

    isAdmin() ||

    modulos.includes(

        module

    );

const getPreference = (

    chave,

    valor = null

) =>

    preferencias[chave] ??

    valor;

const setPreference = (

    chave,

    valor

) => {

    atualizarPreferencias({

        [chave]:

            valor

    });

};

/*
|--------------------------------------------------------------------------
| Continua na Parte 3
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Heartbeat
|--------------------------------------------------------------------------
*/

const heartbeat = useCallback(() => {

    atualizarSessao({

        ultimaAtividade:

            new Date().toISOString()

    });

}, [

    atualizarSessao

]);

/*
|--------------------------------------------------------------------------
| Validação da Sessão
|--------------------------------------------------------------------------
*/

const validarSessao = useCallback(async () => {

    if (!token) {

        return false;

    }

    return true;

}, [

    token

]);

/*
|--------------------------------------------------------------------------
| Broadcast entre abas
|--------------------------------------------------------------------------
*/

useEffect(() => {

    if (

        typeof BroadcastChannel ===

        "undefined"

    ) {

        return;

    }

    const channel =

        new BroadcastChannel(

            "erp-auth"

        );

    channel.onmessage =

        ({ data }) => {

            switch (

                data.type

            ) {

                case "LOGIN":

                    carregarSessao();

                    break;

                case "LOGOUT":

                    limparSessao();

                    break;

                default:

                    break;

            }

        };

    return () =>

        channel.close();

}, [

    carregarSessao,

    limparSessao

]);

/*
|--------------------------------------------------------------------------
| Atualiza atividade do usuário
|--------------------------------------------------------------------------
*/

useEffect(() => {

    if (

        autenticado

    ) {

        heartbeat();

    }

}, [

    autenticado,

    heartbeat

]);

/*
|--------------------------------------------------------------------------
| Value
|--------------------------------------------------------------------------
*/

const value = useMemo(

    () => ({

        /*
        ---------------------------
        Estado
        ---------------------------
        */

        loading,

        autenticado,

        sessao,

        /*
        ---------------------------
        Dados
        ---------------------------
        */

        usuario,

        empresa,

        filial,

        token,

        refreshToken,

        permissoes,

        modulos,

        menu,

        preferencias,

        /*
        ---------------------------
        Login
        ---------------------------
        */

        login,

        logout,

        renovarToken,

        validarSessao,

        /*
        ---------------------------
        Sessão
        ---------------------------
        */

        salvarSessao,

        atualizarSessao,

        limparSessao,

        /*
        ---------------------------
        Atualizações
        ---------------------------
        */

        atualizarUsuario,

        atualizarEmpresa,

        atualizarFilial,

        atualizarPermissoes,

        atualizarModulos,

        atualizarMenu,

        atualizarPreferencias,

        atualizarToken,

        atualizarRefreshToken,

        /*
        ---------------------------
        Helpers
        ---------------------------
        */

        heartbeat,

        isAdmin,

        isAuthenticated,

        isLoading,

        hasRole,

        hasPermission,

        hasAnyPermission,

        hasModule,

        /*
        ---------------------------
        Preferências
        ---------------------------
        */

        getPreference,

        setPreference,

        /*
        ---------------------------
        Getters
        ---------------------------
        */

        getSessao,

        getUsuario,

        getEmpresa,

        getFilial,

        getToken,

        getRefreshToken,

        getPermissoes,

        getModulos,

        getMenu,

        getPreferencias

    }),

    [

        loading,

        autenticado,

        sessao,

        usuario,

        empresa,

        filial,

        token,

        refreshToken,

        permissoes,

        modulos,

        menu,

        preferencias

    ]

);

/*
|--------------------------------------------------------------------------
| Provider
|--------------------------------------------------------------------------
*/

return (

    <AuthContext.Provider

        value={value}

    >

        {children}

    </AuthContext.Provider>

);

}

/*
|--------------------------------------------------------------------------
| Hook
|--------------------------------------------------------------------------
*/

export function useAuth() {

    const context =

        useContext(

            AuthContext

        );

    if (!context) {

        throw new Error(

            "useAuth deve ser utilizado dentro do AuthProvider."

        );

    }

    return context;

}

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export default AuthContext;