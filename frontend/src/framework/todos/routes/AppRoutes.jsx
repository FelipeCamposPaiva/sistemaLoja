import { lazy, Suspense } from "react";

import {

    Routes,

    Route,

    Navigate

} from "react-router-dom";

import Layout from "../components/layout/Layout";

import Loader from "../components/ui/Loader/Loader";

import PublicRoute from "./guard/PublicRoute";
import PrivateRoute from "./guard/PrivateRoute";

/*
|--------------------------------------------------------------------------
| PÁGINAS PÚBLICAS
|--------------------------------------------------------------------------
*/

const Login = lazy(() =>
    import("../pages/auth/Login")
);

const ForgotPassword = lazy(() =>
    import("../components/auth/ForgotPassword")
);

/*
|--------------------------------------------------------------------------
| MÓDULOS
|--------------------------------------------------------------------------
*/




/*
|--------------------------------------------------------------------------
| TODAS AS ROTAS
|--------------------------------------------------------------------------
*/

const appRoutes = [

    ...inicioRoutes,

    ...cadastrosRoutes,

    ...suprimentosRoutes,

    ...vendasRoutes,

    ...financasRoutes,

    ...servicosRoutes,

    ...ecommerceRoutes,

    ...funcionariosRoutes,

    ...configuracoesRoutes,


];

/*
|--------------------------------------------------------------------------
| APP ROUTES
|--------------------------------------------------------------------------
*/

export default function AppRoutes() {

    return (

        <Suspense fallback={<Loader />}>

            <Routes>

                {/* =======================================================
                    ROTAS PÚBLICAS
                ======================================================= */}

                <Route element={<PublicRoute />}>

                    <Route

                        path="/login"

                        element={<Login />}

                    />

                    <Route

                        path="/esqueci-senha"

                        element={<ForgotPassword />}

                    />

                </Route>

                {/* =======================================================
                    ROTAS PRIVADAS
                ======================================================= */}

                <Route element={<PrivateRoute />}>

                    <Route element={<Layout />}>

                        <Route

                            path="/"

                            element={

                                <Navigate

                                    to="/dashboard"

                                    replace

                                />

                            }

                        />

                        {

                            appRoutes.map(route => (

                                <Route

                                    key={route.path}

                                    path={route.path}

                                    element={route.element}

                                />

                            ))

                        }

                    </Route>

                </Route>

                {/* =======================================================
                    PÁGINAS DE ERRO
                ======================================================= */}

                <Route

                    path="/403"

                    element={

                        <h1>

                            403 - Acesso Negado

                        </h1>

                    }

                />

                <Route

                    path="/404"

                    element={

                        <h1>

                            404 - Página não encontrada

                        </h1>

                    }

                />

                <Route

                    path="/modulo-indisponivel"

                    element={

                        <h1>

                            Módulo indisponível.

                        </h1>

                    }

                />

                <Route

                    path="/licenca"

                    element={

                        <h1>

                            Licença inválida.

                        </h1>

                    }

                />

                <Route

                    path="*"

                    element={

                        <Navigate

                            to="/404"

                            replace

                        />

                    }

                />

            </Routes>

        </Suspense>

    );

}