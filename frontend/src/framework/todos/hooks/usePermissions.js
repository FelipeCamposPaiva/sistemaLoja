import { useMemo } from "react";

import useAuth from "./useAuth";

/*
|--------------------------------------------------------------------------
| usePermissions
|--------------------------------------------------------------------------
|
| Hook para gerenciamento de permissões.
|
| Compatível com:
| ✔ AuthContext
| ✔ PermissaoContext
| ✔ React 19
|
*/

export default function usePermissions() {

    const {

        usuario,

        permissoes,

        modulos,

        hasPermission,

        hasAnyPermission,

        hasRole,

        hasModule,

        isAdmin

    } = useAuth();

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    const can = (permission) =>

        hasPermission(permission);

    const canAny = (...permissions) =>

        hasAnyPermission(...permissions);

    const role = (roleName) =>

        hasRole(roleName);

    const module = (moduleName) =>

        hasModule(moduleName);

    /*
    |--------------------------------------------------------------------------
    | Memo
    |--------------------------------------------------------------------------
    */

    return useMemo(() => ({

        usuario,

        permissoes,

        modulos,

        isAdmin,

        can,

        canAny,

        role,

        module,

        hasPermission,

        hasAnyPermission,

        hasRole,

        hasModule

    }), [

        usuario,

        permissoes,

        modulos,

        isAdmin,

        hasPermission,

        hasAnyPermission,

        hasRole,

        hasModule

    ]);

}