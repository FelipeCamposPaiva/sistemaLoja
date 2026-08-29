/**
 * =============================================================================
 * ERP TEM DE TUDO
 * =============================================================================
 *
 * Arquivo.....: BaseGuard.jsx
 * Local.......: src/routes/guard/
 *
 * Responsável.: Executor central dos Guards do Framework V4.
 *
 * =============================================================================
 */

import React from "react";

import AuthGuard from "./AuthGuard";
import GuestGuard from "./GuestGuard";
import PermissionGuard from "./PermissionGuard";
import RoleGuard from "./RoleGuard";

import { RouteGuards } from "../config/RouteConstants";

/*
|--------------------------------------------------------------------------
| Registro de Guards
|--------------------------------------------------------------------------
*/

const guards = {

    [RouteGuards.AUTH]: AuthGuard,

    [RouteGuards.GUEST]: GuestGuard,

    [RouteGuards.PERMISSION]: PermissionGuard,

    [RouteGuards.ROLE]: RoleGuard

};

/*
|--------------------------------------------------------------------------
| Base Guard
|--------------------------------------------------------------------------
*/

export default function BaseGuard({

    route,

    children

}) {

    let content = children;

    /*
    |--------------------------------------------------------------------------
    | Executa os Guards em sequência
    |--------------------------------------------------------------------------
    */

    route.guards.forEach((guardName) => {

        const Guard = guards[guardName];

        if (!Guard) {

            console.warn(

                `Guard "${guardName}" não encontrado.`

            );

            return;

        }

        content = (

            <Guard route={route}>

                {content}

            </Guard>

        );

    });

    return content;

}