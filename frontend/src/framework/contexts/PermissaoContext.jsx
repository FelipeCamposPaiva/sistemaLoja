import {
    createContext,
    useContext,
    useMemo
} from "react";

import { useAuth } from "./AuthContext";

import {

    hasPermission,

    hasAnyPermission,

    hasAllPermissions,

    hasRole,

    hasRoles,

    isAdmin,

    isGerente,

    isFinanceiro,

    isVendedor,

    isProducao,

    isEstoque,

    isFuncionario

} from "../core/auth/permission";

const PermissaoContext = createContext({});

export function PermissaoProvider({ children }) {

    const { usuario } = useAuth();

    const value = useMemo(() => ({

        usuario,

        hasPermission: (permissao) =>
            hasPermission(
                usuario,
                permissao
            ),

        hasAnyPermission: (permissoes) =>
            hasAnyPermission(
                usuario,
                permissoes
            ),

        hasAllPermissions: (permissoes) =>
            hasAllPermissions(
                usuario,
                permissoes
            ),

        hasRole: (role) =>
            hasRole(
                usuario,
                role
            ),

        hasRoles: (roles) =>
            hasRoles(
                usuario,
                roles
            ),

        isAdmin: () =>
            isAdmin(usuario),

        isGerente: () =>
            isGerente(usuario),

        isFinanceiro: () =>
            isFinanceiro(usuario),

        isVendedor: () =>
            isVendedor(usuario),

        isProducao: () =>
            isProducao(usuario),

        isEstoque: () =>
            isEstoque(usuario),

        isFuncionario: () =>
            isFuncionario(usuario)

    }), [usuario]);

    return (

        <PermissaoContext.Provider
            value={value}
        >

            {children}

        </PermissaoContext.Provider>

    );

}

export function usePermissao() {

    return useContext(PermissaoContext);

}