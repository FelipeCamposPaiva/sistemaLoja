import {

createContext,

useContext,

useState,

useEffect,

useCallback

} from "react";

import estoqueService from "../services/estoque.service";

const EstoqueContext=createContext({});

export function EstoqueProvider({children}){

const [estoque,setEstoque]=useState([]);

const [loading,setLoading]=useState(false);

const carregar=useCallback(async()=>{

setLoading(true);

try{

const dados=await estoqueService.listar();

setEstoque(dados);

}

finally{

setLoading(false);

}

},[]);

useEffect(()=>{

carregar();

},[carregar]);

return(

<EstoqueContext.Provider

value={{

estoque,

loading,

carregar

}}

>

{children}

</EstoqueContext.Provider>

);

}

export function useEstoque(){

return useContext(EstoqueContext);

}