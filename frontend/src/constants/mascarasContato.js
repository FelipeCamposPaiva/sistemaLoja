const IE_MASCARA = {
    AC: "##.###.###/###-##",
    AL: "#########",
    AP: "#########",
    AM: "##.###.###-#",
    BA: "###.###.##-#",
    CE: "########-#",
    DF: "###########-##",
    ES: "###.###.##-#",
    GO: "##.###.###-#",
    MA: "#########",
    MT: "###########",
    MS: "#########",
    MG: "###.###.###/####",
    PA: "##-######-#",
    PB: "########-#",
    PR: "########-##",
    PE: "#######-##",
    PI: "#########",
    RJ: "##.###.##-#",
    RN: "##.###.###-#",
    RS: "###/#######",
    RO: "#############-#",
    RR: "########-#",
    SC: "###.###.###",
    SP: "###.###.###.###",
    SE: "#########-#",
    TO: "###########"
};

function digitos(valor, max) {
    const numeros = String(valor || "").replace(/\D/g, "");
    return max ? numeros.slice(0, max) : numeros;
}

function aplicarMascara(numeros, mascara) {
    let i = 0;
    let saida = "";
    for (const caractere of mascara) {
        if (caractere === "#") {
            if (i >= numeros.length) {
                break;
            }
            saida += numeros[i++];
        } else if (i < numeros.length) {
            saida += caractere;
        } else {
            break;
        }
    }
    return saida;
}

export function capitalizarNome(valor) {
    return String(valor || "").replace(/\p{L}[\p{L}'’-]*/gu, (palavra) => {
        const minuscula = palavra.toLocaleLowerCase("pt-BR");
        return minuscula.charAt(0).toLocaleUpperCase("pt-BR") + minuscula.slice(1);
    });
}

export function formatarCpf(valor) {
    return aplicarMascara(digitos(valor, 11), "###.###.###-##");
}

export function formatarCnpj(valor) {
    return aplicarMascara(digitos(valor, 14), "##.###.###/####-##");
}

export function formatarCep(valor) {
    return aplicarMascara(digitos(valor, 8), "#####-###");
}

export function formatarIe(valor, uf) {
    const sigla = String(uf || "").trim().toUpperCase();
    if (sigla === "SP" && /^p/i.test(String(valor || "").trim())) {
        return `P-${digitos(valor, 8)}`;
    }
    const mascara = IE_MASCARA[sigla] || "###.###.###.###";
    const limite = (mascara.match(/#/g) || []).length;
    return aplicarMascara(digitos(valor, limite), mascara);
}

export function formatarIm(valor) {
    return aplicarMascara(digitos(valor, 15), "###.###.###/####");
}

export function formatarLimite(valor) {
    const texto = String(valor ?? "").trim();
    if (!texto) {
        return "0,00";
    }
    const normalizado = texto.includes(",")
        ? texto.replace(/\./g, "").replace(",", ".")
        : texto;
    const numero = Number(normalizado.replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(numero)) {
        return "0,00";
    }
    return numero.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
