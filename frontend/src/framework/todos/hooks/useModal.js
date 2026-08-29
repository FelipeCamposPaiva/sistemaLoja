import {
    useCallback,
    useState
} from "react";

/*
|--------------------------------------------------------------------------
| useModal
|--------------------------------------------------------------------------
|
| Hook para gerenciamento de modais do ERP.
|
| Recursos:
| ✔ Abrir
| ✔ Fechar
| ✔ Toggle
| ✔ Dados da Modal
| ✔ Tipo (create, edit, delete, view...)
| ✔ Loading
| ✔ Reset
|
*/

export default function useModal() {

    /*
    |--------------------------------------------------------------------------
    | Estados
    |--------------------------------------------------------------------------
    */

    const [

        open,

        setOpen

    ] = useState(false);

    const [

        title,

        setTitle

    ] = useState("");

    const [

        type,

        setType

    ] = useState("default");

    const [

        data,

        setData

    ] = useState(null);

    const [

        loading,

        setLoading

    ] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | Abrir
    |--------------------------------------------------------------------------
    */

    const show = useCallback(({

        title = "",

        type = "default",

        data = null

    } = {}) => {

        setTitle(title);

        setType(type);

        setData(data);

        setOpen(true);

    }, []);

    /*
    |--------------------------------------------------------------------------
    | Fechar
    |--------------------------------------------------------------------------
    */

    const close = useCallback(() => {

        setOpen(false);

        setLoading(false);

        setTimeout(() => {

            setTitle("");

            setType("default");

            setData(null);

        }, 150);

    }, []);

    /*
    |--------------------------------------------------------------------------
    | Toggle
    |--------------------------------------------------------------------------
    */

    const toggle = useCallback(() => {

        setOpen(

            value => !value

        );

    }, []);

    /*
    |--------------------------------------------------------------------------
    | Atualizar Dados
    |--------------------------------------------------------------------------
    */

    const updateData = useCallback((novoValor) => {

        setData(novoValor);

    }, []);

    /*
    |--------------------------------------------------------------------------
    | Atualizar Tipo
    |--------------------------------------------------------------------------
    */

    const updateType = useCallback((novoTipo) => {

        setType(novoTipo);

    }, []);

    /*
    |--------------------------------------------------------------------------
    | Atualizar Título
    |--------------------------------------------------------------------------
    */

    const updateTitle = useCallback((novoTitulo) => {

        setTitle(novoTitulo);

    }, []);

    /*
    |--------------------------------------------------------------------------
    | Loading
    |--------------------------------------------------------------------------
    */

    const startLoading = useCallback(() => {

        setLoading(true);

    }, []);

    const stopLoading = useCallback(() => {

        setLoading(false);

    }, []);

    /*
    |--------------------------------------------------------------------------
    | Reset
    |--------------------------------------------------------------------------
    */

    const reset = useCallback(() => {

        setOpen(false);

        setLoading(false);

        setTitle("");

        setType("default");

        setData(null);

    }, []);

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    const isCreate =

        type === "create";

    const isEdit =

        type === "edit";

    const isView =

        type === "view";

    const isDelete =

        type === "delete";

    /*
    |--------------------------------------------------------------------------
    | Return
    |--------------------------------------------------------------------------
    */

    return {

        open,

        title,

        type,

        data,

        loading,

        show,

        close,

        toggle,

        reset,

        updateData,

        updateTitle,

        updateType,

        startLoading,

        stopLoading,

        isCreate,

        isEdit,

        isView,

        isDelete

    };

}