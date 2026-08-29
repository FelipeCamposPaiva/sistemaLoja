import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import dashboardService from "../services/dashboard.service";

const DashboardContext = createContext({});

export function DashboardProvider({ children }) {

    const [dashboard, setDashboard] = useState({});

    const [loading, setLoading] = useState(true);

    async function carregarDashboard() {

        try {

            const dados = await dashboardService.geral();

            setDashboard(dados);

        }

        catch (erro) {

            console.error(erro);

        }

        finally {

            setLoading(false);

        }

    }

    useEffect(() => {

        carregarDashboard();

    }, []);

    return (

        <DashboardContext.Provider

            value={{

                dashboard,

                loading,

                atualizar: carregarDashboard

            }}

        >

            {children}

        </DashboardContext.Provider>

    );

}

export function useDashboard() {

    return useContext(DashboardContext);

}