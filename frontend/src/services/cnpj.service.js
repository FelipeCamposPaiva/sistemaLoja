import { capitalizarNome, formatarCep, formatarCnpj, formatarCpf } from "../constants/mascarasContato";

export async function consultarCnpjReceita(valor) {
    const numeros = String(valor || "").replace(/\D/g, "");
    if (numeros.length !== 14) {
        throw new Error("Informe o CNPJ completo.");
    }
    const resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${numeros}`);
    if (resposta.status === 404) {
        return null;
    }
    if (!resposta.ok) {
        throw new Error("Não foi possível consultar a Receita Federal.");
    }
    const dados = await resposta.json();
    const tipoLogradouro = String(dados.descricao_tipo_de_logradouro || "").trim();
    const logradouro = String(dados.logradouro || "").trim();
    const endereco = [tipoLogradouro, logradouro].filter(Boolean).join(" ");
    const telefone = String(dados.ddd_telefone_1 || "").replace(/\D/g, "");
    return {
        cpfCnpj: formatarCnpj(dados.cnpj || numeros),
        nome: capitalizarNome(dados.razao_social || ""),
        fantasia: capitalizarNome(dados.nome_fantasia || ""),
        cep: dados.cep ? formatarCep(dados.cep) : "",
        endereco,
        numero: String(dados.numero || "").trim(),
        complemento: String(dados.complemento || "").trim(),
        bairro: String(dados.bairro || "").trim(),
        municipio: String(dados.municipio || "").trim(),
        uf: String(dados.uf || "").trim().toUpperCase(),
        telefone
    };
}

export async function consultarCpfReceita(valor) {
    const numeros = String(valor || "").replace(/\D/g, "");
    if (numeros.length !== 11) {
        throw new Error("Informe o CPF completo.");
    }
    const resposta = await fetch(`https://brasilapi.com.br/api/cpf/v1/${numeros}`);
    if (resposta.status === 404) {
        return null;
    }
    if (!resposta.ok) {
        throw new Error("Não foi possível consultar o CPF.");
    }
    const dados = await resposta.json();
    return {
        cpf: formatarCpf(dados.cpf || numeros),
        valido: dados.isValid !== false,
        ufs: Array.isArray(dados.ufs) ? dados.ufs.map((uf) => String(uf || "").toUpperCase()).filter(Boolean) : []
    };
}
