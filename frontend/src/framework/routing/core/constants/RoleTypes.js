import React from "react";
import BaseGuard from "./BaseGuard";
import { useAuth } from "../../providers/core/AuthProvider";

export default function RoleRoute({

    role,

    children

}) {

    const { hasRole } = useAuth();

    return (

        <BaseGuard

            allow={hasRole(role)}

        >

            {children}

        </BaseGuard>

    );

}