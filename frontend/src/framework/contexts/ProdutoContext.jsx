import {

createContext,

useContext,

useState,

useEffect,

useCallback

} from "react";

import produtoService from "../services/produto.service";

const ProdutoContext=createContext({});

export function ProdutoProvider({children}){

const [produtos,setProdutos]=useState([]);

const [loading,setLoading]=useState(false);

const carregarProdutos=useCallback(async()=>{

setLoading(true);

try{

const dados=await produtoService.listar();

setProdutos(dados);

}

finally{

setLoading(false);

}

},[]);

useEffect(()=>{

carregarProdutos();

},[carregarProdutos]);

return(

<ProdutoContext.Provider

value={{

produtos,

loading,

carregarProdutos

}}

>

{children}

</ProdutoContext.Provider>

);

}

export function useProdutos(){

return useContext(ProdutoContext);

}