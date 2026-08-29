import { useMemo } from "react";

import { useEmpresa } from "../contexts/EmpresaContext";

/*
|--------------------------------------------------------------------------
| useEmpresa
|--------------------------------------------------------------------------
|
| Hook para gerenciamento da Empresa e Filiais.
|
| Recursos:
| ✔ Empresa Atual
| ✔ Alteração de Empresa
| ✔ Multiempresa
| ✔ Multi Filial
| ✔ Dados Fiscais
| ✔ React 19
|
*/

export default function useEmpresa() {

    const {

        empresa,

        alterarEmpresa,

        limparEmpresa

    } = useEmpresa();

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    function existeEmpresa() {

        return empresa !== null;

    }

    function getId() {

        return empresa?.id ?? null;

    }

    function getNome() {

        return empresa?.nome ?? "";

    }

    function getFantasia() {

        return empresa?.nomeFantasia ?? "";

    }

    function getDocumento() {

        return empresa?.cnpj ?? "";

    }

    function getEmail() {

        return empresa?.email ?? "";

    }

    function getTelefone() {

        return empresa?.telefone ?? "";

    }

    function getEndereco() {

        return empresa?.endereco ?? {};

    }

    function getFiliais() {

        return empresa?.filiais ?? [];

    }

    function getFilialAtual() {

        return empresa?.filialAtual ?? null;

    }

    /*
    |--------------------------------------------------------------------------
    | Alterar Filial
    |--------------------------------------------------------------------------
    */

    function alterarFilial(idFilial) {

        if (!empresa) {

            return;

        }

        const filial = empresa.filiais?.find(

            item => item.id === idFilial

        );

        if (!filial) {

            return;

        }

        alterarEmpresa({

            ...empresa,

            filialAtual: filial

        });

    }

    /*
    |--------------------------------------------------------------------------
    | Dados Fiscais
    |--------------------------------------------------------------------------
    */

    function getInscricaoEstadual() {

        return empresa?.ie ?? "";

    }

    function getInscricaoMunicipal() {

        return empresa?.im ?? "";

    }

    function getRegimeTributario() {

        return empresa?.regimeTributario ?? "";

    }

    /*
    |--------------------------------------------------------------------------
    | Memo
    |--------------------------------------------------------------------------
    */

    return useMemo(() => ({

        empresa,

        alterarEmpresa,

        limparEmpresa,

        alterarFilial,

        existeEmpresa,

        getId,

        getNome,

        getFantasia,

        getDocumento,

        getEmail,

        getTelefone,

        getEndereco,

        getFiliais,

        getFilialAtual,

        getInscricaoEstadual,

        getInscricaoMunicipal,

        getRegimeTributario

    }), [

        empresa,

        alterarEmpresa,

        limparEmpresa

    ]);

}