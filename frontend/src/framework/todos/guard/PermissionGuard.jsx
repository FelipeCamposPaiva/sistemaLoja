import React from "react";
import BaseGuard from "./BaseGuard";

export default function ProtectedRoute({ children }) {

    return (

        <BaseGuard>

            {children}

        </BaseGuard>

    );

}