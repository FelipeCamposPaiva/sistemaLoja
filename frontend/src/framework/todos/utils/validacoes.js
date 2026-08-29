/**
 * ==========================================================
 * ERP TEM DE TUDO
 * Utilitário de Validações
 * ==========================================================
 */

import {
    validarCPF
} from "./formatarCPF";

import {
    validarCNPJ
} from "./formatarCNPJ";

import {
    validarCEP
} from "./formatarCEP";

import {
    validarTelefone
} from "./formatarTelefone";

/* ==========================================================
 * Helpers
 * ========================================================== */

export function vazio(valor) {

    if (valor === null || valor === undefined) {

        return true;

    }

    if (typeof valor === "string") {

        return valor.trim() === "";

    }

    if (Array.isArray(valor)) {

        return valor.length === 0;

    }

    return false;

}

export function preenchido(valor) {

    return !vazio(valor);

}

/* ==========================================================
 * Email
 * ========================================================== */

export function email(valor) {

    if (vazio(valor)) {

        return false;

    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);

}

/* ==========================================================
 * URL
 * ========================================================== */

export function url(valor) {

    if (vazio(valor)) {

        return false;

    }

    try {

        new URL(valor);

        return true;

    }

    catch {

        return false;

    }

}

/* ==========================================================
 * Regex
 * ========================================================== */

export function regex(valor, expressao) {

    if (!(expressao instanceof RegExp)) {

        throw new Error(

            "expressao deve ser RegExp"

        );

    }

    return expressao.test(valor);

}

/* ==========================================================
 * Número
 * ========================================================== */

export function numero(valor) {

    return !isNaN(valor) &&

        valor !== "" &&

        valor !== null &&

        valor !== undefined;

}

export function inteiro(valor) {

    return Number.isInteger(

        Number(valor)

    );

}

export function decimal(valor) {

    return numero(valor) &&

        !inteiro(valor);

}

export function positivo(valor) {

    return numero(valor) &&

        Number(valor) >= 0;

}

export function negativo(valor) {

    return numero(valor) &&

        Number(valor) < 0;

}

/* ==========================================================
 * Intervalos
 * ========================================================== */

export function minimo(valor, min) {

    if (!numero(valor)) {

        return false;

    }

    return Number(valor) >= min;

}

export function maximo(valor, max) {

    if (!numero(valor)) {

        return false;

    }

    return Number(valor) <= max;

}

export function intervalo(

    valor,

    min,

    max

) {

    return minimo(valor, min) &&

        maximo(valor, max);

}

/* ==========================================================
 * Texto
 * ========================================================== */

export function tamanhoMinimo(

    texto,

    tamanho

) {

    if (vazio(texto)) {

        return false;

    }

    return texto.length >= tamanho;

}

export function tamanhoMaximo(

    texto,

    tamanho

) {

    if (vazio(texto)) {

        return false;

    }

    return texto.length <= tamanho;

}

export function tamanho(

    texto,

    min,

    max

) {

    return tamanhoMinimo(

        texto,

        min

    ) &&

    tamanhoMaximo(

        texto,

        max

    );

}

/* ==========================================================
 * Documentos
 * ========================================================== */

export function cpf(valor) {

    return validarCPF(valor);

}

export function cnpj(valor) {

    return validarCNPJ(valor);

}

export function cpfCnpj(valor) {

    if (vazio(valor)) {

        return false;

    }

    return cpf(valor) ||

        cnpj(valor);

}

export function cep(valor) {

    return validarCEP(valor);

}

export function telefone(valor) {

    return validarTelefone(valor);

}

/* ==========================================================
 * Datas
 * ========================================================== */

export function data(valor) {

    if (vazio(valor)) {

        return false;

    }

    const d = new Date(valor);

    return !Number.isNaN(d.getTime());

}

export function dataPassada(valor) {

    if (!data(valor)) {

        return false;

    }

    return new Date(valor) < new Date();

}

export function dataFutura(valor) {

    if (!data(valor)) {

        return false;

    }

    return new Date(valor) > new Date();

}

/* ==========================================================
 * Senha
 * ========================================================== */

export function senha(

    valor,

    {

        min = 8,

        maiuscula = true,

        minuscula = true,

        numero = true,

        especial = true

    } = {}

) {

    if (vazio(valor)) {

        return false;

    }

    if (valor.length < min) {

        return false;

    }

    if (

        maiuscula &&

        !/[A-Z]/.test(valor)

    ) {

        return false;

    }

    if (

        minuscula &&

        !/[a-z]/.test(valor)

    ) {

        return false;

    }

    if (

        numero &&

        !/\d/.test(valor)

    ) {

        return false;

    }

    if (

        especial &&

        !/[!@#$%^&*(),.?":{}|<>_\-+=\\[\]/]/.test(valor)

    ) {

        return false;

    }

    return true;

}

/* ==========================================================
 * Placa Mercosul / Antiga
 * ========================================================== */

export function placa(valor) {

    if (vazio(valor)) {

        return false;

    }

    valor = valor

        .replace(/-/g, "")

        .toUpperCase();

    return (

        /^[A-Z]{3}[0-9]{4}$/.test(valor) ||

        /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(valor)

    );

}

/* ==========================================================
 * Renavam
 * ========================================================== */

export function renavam(valor) {

    if (vazio(valor)) {

        return false;

    }

    return /^[0-9]{11}$/.test(

        String(valor)

    );

}

/* ==========================================================
 * Chassi
 * ========================================================== */

export function chassi(valor) {

    if (vazio(valor)) {

        return false;

    }

    return /^[A-HJ-NPR-Z0-9]{17}$/i.test(

        valor

    );

}

/* ==========================================================
 * NCM
 * ========================================================== */

export function ncm(valor) {

    if (vazio(valor)) {

        return false;

    }

    return /^[0-9]{8}$/.test(

        String(valor)

    );

}

/* ==========================================================
 * CFOP
 * ========================================================== */

export function cfop(valor) {

    if (vazio(valor)) {

        return false;

    }

    return /^[1-7][0-9]{3}$/.test(

        String(valor)

    );

}

/* ==========================================================
 * Código de Barras
 * (EAN8 / EAN13 / GTIN14)
 * ========================================================== */

export function codigoBarras(valor) {

    if (vazio(valor)) {

        return false;

    }

    valor = String(valor);

    return (

        /^[0-9]{8}$/.test(valor) ||

        /^[0-9]{13}$/.test(valor) ||

        /^[0-9]{14}$/.test(valor)

    );

}

/* ==========================================================
 * UUID
 * ========================================================== */

export function uuid(valor) {

    if (vazio(valor)) {

        return false;

    }

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(

        valor

    );

}

/* ==========================================================
 * IPv4
 * ========================================================== */

export function ip(valor) {

    if (vazio(valor)) {

        return false;

    }

    const partes = valor.split(".");

    if (partes.length !== 4) {

        return false;

    }

    return partes.every(parte => {

        const numero = Number(parte);

        return (

            !Number.isNaN(numero) &&

            numero >= 0 &&

            numero <= 255

        );

    });

}

/* ==========================================================
 * Domínio
 * ========================================================== */

export function dominio(valor) {

    if (vazio(valor)) {

        return false;

    }

    return /^(?!-)([a-zA-Z0-9-]{1,63}\.)+[A-Za-z]{2,}$/.test(

        valor

    );

}

/* ==========================================================
 * Arquivos
 * ========================================================== */

export function arquivo(valor) {

    return valor instanceof File;

}

export function imagem(valor) {

    if (!arquivo(valor)) {

        return false;

    }

    return valor.type.startsWith("image/");

}

export function extensao(

    arquivo,

    extensoes = []

) {

    if (!(arquivo instanceof File)) {

        return false;

    }

    if (!Array.isArray(extensoes)) {

        extensoes = [extensoes];

    }

    const ext = arquivo.name

        .split(".")

        .pop()

        .toLowerCase();

    return extensoes

        .map(e =>

            e.replace(".", "").toLowerCase()

        )

        .includes(ext);

}

export function mimeType(

    arquivo,

    tipos = []

) {

    if (!(arquivo instanceof File)) {

        return false;

    }

    if (!Array.isArray(tipos)) {

        tipos = [tipos];

    }

    return tipos.includes(

        arquivo.type

    );

}

export function tamanhoArquivo(

    arquivo,

    maxMB = 5

) {

    if (!(arquivo instanceof File)) {

        return false;

    }

    return (

        arquivo.size <=

        maxMB *

        1024 *

        1024

    );

}

/* ==========================================================
 * Horário
 * ========================================================== */

export function hora(valor) {

    if (vazio(valor)) {

        return false;

    }

    return /^([01]\d|2[0-3]):([0-5]\d)$/

        .test(valor);

}

export function horaSegundo(valor) {

    if (vazio(valor)) {

        return false;

    }

    return /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/

        .test(valor);

}

/* ==========================================================
 * Porcentagem
 * ========================================================== */

export function porcentagem(

    valor,

    min = 0,

    max = 100

) {

    if (!numero(valor)) {

        return false;

    }

    valor = Number(valor);

    return valor >= min &&

        valor <= max;

}

/* ==========================================================
 * Moeda
 * ========================================================== */

export function moeda(valor) {

    if (numero(valor)) {

        return true;

    }

    if (typeof valor !== "string") {

        return false;

    }

    return /^-?\d{1,3}(\.\d{3})*,\d{2}$/.test(

        valor

    );

}

/* ==========================================================
 * Arrays
 * ========================================================== */

export function array(valor) {

    return Array.isArray(valor);

}

export function arrayNaoVazio(valor) {

    return Array.isArray(valor) &&

        valor.length > 0;

}

/* ==========================================================
 * Objetos
 * ========================================================== */

export function objeto(valor) {

    return (

        typeof valor === "object" &&

        valor !== null &&

        !Array.isArray(valor)

    );

}

/* ==========================================================
 * Booleano
 * ========================================================== */

export function booleano(valor) {

    return typeof valor === "boolean";

}

/* ==========================================================
 * Campos Obrigatórios
 * ========================================================== */

export function required(valor) {

    return preenchido(valor);

}

export function notEmpty(valor) {

    return preenchido(valor);

}

export function oneOf(

    valor,

    lista

) {

    if (!Array.isArray(lista)) {

        return false;

    }

    return lista.includes(valor);

}

/* ==========================================================
 * Lista de valores
 * ========================================================== */

export function todos(

    lista,

    callback

) {

    if (!Array.isArray(lista)) {

        return false;

    }

    return lista.every(callback);

}

export function algum(

    lista,

    callback

) {

    if (!Array.isArray(lista)) {

        return false;

    }

    return lista.some(callback);

}

/* ==========================================================
 * Igualdade
 * ========================================================== */

export function igual(

    valor,

    outro

) {

    return valor === outro;

}

export function diferente(

    valor,

    outro

) {

    return valor !== outro;

}

/* ==========================================================
 * Entre
 * ========================================================== */

export function entre(

    valor,

    inicio,

    fim

) {

    if (!numero(valor)) {

        return false;

    }

    valor = Number(valor);

    return valor >= inicio &&

        valor <= fim;

}

/* ==========================================================
 * Composição de Validadores
 * ========================================================== */

export function compose(...validators) {

    return valor => {

        for (const validator of validators) {

            if (typeof validator !== "function") {

                continue;

            }

            if (!validator(valor)) {

                return false;

            }

        }

        return true;

    };

}

/* ==========================================================
 * Validar Campo
 * ========================================================== */

export function validarCampo(

    valor,

    regras = []

) {

    const erros = [];

    for (const regra of regras) {

        if (typeof regra === "function") {

            const resultado = regra(valor);

            if (!resultado) {

                erros.push("Valor inválido.");

            }

            continue;

        }

        if (

            regra &&

            typeof regra.validator === "function"

        ) {

            const ok = regra.validator(valor);

            if (!ok) {

                erros.push(

                    regra.message ||

                    "Valor inválido."

                );

            }

        }

    }

    return {

        valido: erros.length === 0,

        erros

    };

}

/* ==========================================================
 * Validar Formulário
 * ========================================================== */

export function validarFormulario(

    dados = {},

    schema = {}

) {

    const erros = {};

    let valido = true;

    Object.entries(schema).forEach(

        ([campo, regras]) => {

            const resultado = validarCampo(

                dados[campo],

                regras

            );

            if (!resultado.valido) {

                valido = false;

                erros[campo] = resultado.erros;

            }

        }

    );

    return {

        valido,

        erros

    };

}

/* ==========================================================
 * Biblioteca de Validadores
 * ========================================================== */

export const validators = {

    vazio,

    preenchido,

    required,

    notEmpty,

    email,

    url,

    regex,

    numero,

    inteiro,

    decimal,

    positivo,

    negativo,

    minimo,

    maximo,

    intervalo,

    tamanho,

    tamanhoMinimo,

    tamanhoMaximo,

    cpf,

    cnpj,

    cpfCnpj,

    cep,

    telefone,

    data,

    dataPassada,

    dataFutura,

    senha,

    placa,

    renavam,

    chassi,

    ncm,

    cfop,

    codigoBarras,

    uuid,

    ip,

    dominio,

    arquivo,

    imagem,

    extensao,

    mimeType,

    tamanhoArquivo,

    hora,

    horaSegundo,

    porcentagem,

    moeda,

    array,

    arrayNaoVazio,

    objeto,

    booleano,

    oneOf,

    todos,

    algum,

    igual,

    diferente,

    entre,

    compose,

    validarCampo,

    validarFormulario

};

/* ==========================================================
 * Export Default
 * ========================================================== */

export default validators;