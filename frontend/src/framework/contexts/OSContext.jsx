import {

createContext,

useContext,

useEffect,

useState,

useCallback

} from "react";

import osService from "../services/os.service";

const OSContext=createContext({});

export function OSProvider({children}){

const [ordens,setOrdens]=useState([]);

const [loading,setLoading]=useState(false);

const carregar=useCallback(async()=>{

setLoading(true);

try{

const lista=await osService.listar();

setOrdens(lista);

}

finally{

setLoading(false);

}

},[]);

useEffect(()=>{

carregar();

},[carregar]);

async function atualizarStatus(id,status){

const os=await osService.atualizarStatus(

id,

status

);

setOrdens(lista=>

lista.map(item=>

item.id===id

? os

: item

)

);

}

return(

<OSContext.Provider

value={{

ordens,

loading,

carregar,

atualizarStatus

}}

>

{children}

</OSContext.Provider>

);

}

export function useOS(){

return useContext(OSContext);

}