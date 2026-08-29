import {

createContext,

useContext,

useEffect,

useState,

useCallback

} from "react";

import financeiroService from "../services/financeiro.service";

const FinanceiroContext=createContext({});

export function FinanceiroProvider({children}){

const [dados,setDados]=useState([]);

const [loading,setLoading]=useState(false);

const carregar=useCallback(async()=>{

setLoading(true);

try{

const lista=await financeiroService.listar();

setDados(lista);

}

finally{

setLoading(false);

}

},[]);

useEffect(()=>{

carregar();

},[carregar]);

return(

<FinanceiroContext.Provider

value={{

dados,

loading,

carregar

}}

>

{children}

</FinanceiroContext.Provider>

);

}

export function useFinanceiro(){

return useContext(FinanceiroContext);

}