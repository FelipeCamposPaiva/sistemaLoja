import { formatarCep } from "../constants/mascarasContato";

export async function buscarCep(valor) {
    const numeros = String(valor || "").replace(/\D/g, "");
    if (numeros.length !== 8) {
        return null;
    }
    const resposta = await fetch(`https://viacep.com.br/ws/${numeros}/json/`);
    if (!resposta.ok) {
        throw new Error("Não foi possível consultar o CEP.");
    }
    const dados = await resposta.json();
    if (!dados || dados.erro) {
        return null;
    }
    return {
        cep: formatarCep(dados.cep || numeros),
        endereco: String(dados.logradouro || "").trim(),
        complemento: String(dados.complemento || "").trim(),
        bairro: String(dados.bairro || "").trim(),
        municipio: String(dados.localidade || "").trim(),
        uf: String(dados.uf || "").trim().toUpperCase(),
        ibge: String(dados.ibge || "").trim()
    };
}
