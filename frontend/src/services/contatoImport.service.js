import * as XLSX from "xlsx";

function chave(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
}

const CAMPOS = {
    id: ["id"],
    codigo: ["codigo"],
    nome: ["nome", "razaosocial", "razao"],
    fantasia: ["fantasia", "nomefantasia"],
    endereco: ["endereco"],
    numero: ["numero", "nro"],
    complemento: ["complemento"],
    bairro: ["bairro"],
    cep: ["cep"],
    cidade: ["cidade", "municipio"],
    estado: ["estado", "uf"],
    fone: ["fone", "telefone"],
    celular: ["celular", "whatsapp"],
    email: ["email"],
    cpfCnpj: ["cnpjcpf", "cpfcnpj", "cnpj", "cpf"],
    situacao: ["situacao", "status"],
    observacoes: ["observacoes"],
    obsContato: ["observacoesdocontato"],
    tipos: ["tiposdecontatos", "tipodecontato", "tipo"],
    tipoPessoa: ["tipopessoa"]
};

function mapaCabecalho(linha) {
    const mapa = {};
    Object.keys(linha || {}).forEach((col) => {
        const k = chave(col);
        Object.entries(CAMPOS).forEach(([campo, aliases]) => {
            if (aliases.includes(k) && mapa[campo] === undefined) {
                mapa[campo] = col;
            }
        });
    });
    return mapa;
}

function celula(linha, mapa, campo) {
    const col = mapa[campo];
    if (!col) {
        return "";
    }
    const v = linha[col];
    return v == null ? "" : String(v).trim();
}

function texto(valor, max) {
    const s = String(valor || "").trim();
    if (!s) {
        return "";
    }
    return max && s.length > max ? s.slice(0, max) : s;
}

function cpfCnpj(valor) {
    const bruto = String(valor || "").trim();
    if (!bruto) {
        return "";
    }
    return bruto.length <= 20 ? bruto : bruto.replace(/\D/g, "").slice(0, 20);
}

function cep(valor) {
    const d = String(valor || "").replace(/\D/g, "");
    if (d.length === 8) {
        return `${d.slice(0, 5)}-${d.slice(5)}`;
    }
    return texto(valor, 10);
}

function uf(valor) {
    const s = String(valor || "").replace(/[^a-zA-Z]/g, "").toUpperCase();
    return s.slice(0, 2);
}

function telefone(fone, celular) {
    const t = texto(celular, 20) || texto(fone, 20);
    return t;
}

function ativoDe(situacao) {
    const t = String(situacao || "").trim().toLowerCase();
    if (!t) {
        return true;
    }
    return !["inativo", "inativa", "excluido", "excluído", "nao", "não", "0", "false"].includes(t);
}

function mapearTipo(valor) {
    const t = String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    if (!t) {
        return null;
    }
    if (t.includes("fornec")) {
        return "fornecedor";
    }
    if (t.includes("transp")) {
        return "transportador";
    }
    if (t.includes("func")) {
        return "funcionario";
    }
    if (t.includes("client")) {
        return "cliente";
    }
    return "outro";
}

function tiposDe(valor) {
    const partes = String(valor || "")
        .split(/[|,;/]+/)
        .map(mapearTipo)
        .filter(Boolean);
    return [...new Set(partes.length ? partes : ["cliente"])];
}

function tinyIdDe(valor) {
    const n = Number(String(valor || "").replace(/\D/g, ""));
    return Number.isInteger(n) && n > 0 && n <= 2147483647 ? n : null;
}

function enderecoDe(linha, mapa) {
    return [
        celula(linha, mapa, "endereco"),
        celula(linha, mapa, "numero") ? `nº ${celula(linha, mapa, "numero")}` : "",
        celula(linha, mapa, "complemento"),
        celula(linha, mapa, "bairro")
    ].filter(Boolean).join(", ");
}

export function linhaParaContato(linha, mapa) {
    const nome = texto(celula(linha, mapa, "nome"), 150);
    if (!nome) {
        return null;
    }
    const tipos = tiposDe(celula(linha, mapa, "tipos"));
    const obs = [celula(linha, mapa, "observacoes"), celula(linha, mapa, "obsContato")]
        .filter(Boolean)
        .join("\n");
    return {
        tinyId: tinyIdDe(celula(linha, mapa, "id")),
        nome,
        fantasia: texto(celula(linha, mapa, "fantasia"), 255),
        cpfCnpj: cpfCnpj(celula(linha, mapa, "cpfCnpj")),
        telefone: telefone(celula(linha, mapa, "fone"), celula(linha, mapa, "celular")),
        celular: telefone(celula(linha, mapa, "celular"), celula(linha, mapa, "fone")),
        email: texto(celula(linha, mapa, "email"), 150),
        endereco: enderecoDe(linha, mapa),
        municipio: texto(celula(linha, mapa, "cidade"), 100),
        uf: uf(celula(linha, mapa, "estado")),
        cep: cep(celula(linha, mapa, "cep")),
        observacoes: obs,
        tipos,
        tipoPessoa: /juridica/i.test(String(celula(linha, mapa, "tipoPessoa")).normalize("NFD").replace(/[\u0300-\u036f]/g, "")) ? "juridica" : "fisica",
        ativo: ativoDe(celula(linha, mapa, "situacao"))
    };
}

function chaveContato(c) {
    return String(c.tinyId || c.cpfCnpj || c.nome || "").trim().toLowerCase();
}

export function deduparContatos(itens) {
    const mapa = new Map();
    itens.forEach((c) => {
        const k = chaveContato(c);
        if (!k) {
            return;
        }
        const atual = mapa.get(k);
        if (!atual) {
            mapa.set(k, { ...c });
            return;
        }
        mapa.set(k, {
            ...atual,
            ...c,
            tipos: [...new Set([...(atual.tipos || []), ...(c.tipos || [])])],
            telefone: c.telefone || atual.telefone,
            email: c.email || atual.email,
            ativo: atual.ativo !== false || c.ativo !== false
        });
    });
    return [...mapa.values()];
}

export function mesclarContatos(leituras) {
    const todos = [];
    (leituras || []).forEach((lido) => {
        todos.push(...(Array.isArray(lido) ? lido : (lido?.itens || [])));
    });
    return { itens: deduparContatos(todos), origem: "contatos" };
}

export function preverImportacaoContatos(itens, atuais) {
    const porTiny = new Set();
    const porDoc = new Set();
    (atuais || []).forEach((contato) => {
        if (contato?.tinyId) {
            porTiny.add(Number(contato.tinyId));
        }
        const doc = String(contato?.cpfCnpj || "").trim().toLowerCase();
        if (doc) {
            porDoc.add(doc);
            const digitos = doc.replace(/\D/g, "");
            if (digitos) {
                porDoc.add(digitos);
            }
        }
    });
    let novos = 0;
    let atualizados = 0;
    (itens || []).forEach((item) => {
        const doc = String(item?.cpfCnpj || "").trim().toLowerCase();
        const digitos = doc.replace(/\D/g, "");
        const existe = (item?.tinyId && porTiny.has(Number(item.tinyId)))
            || (doc && porDoc.has(doc))
            || (digitos && porDoc.has(digitos));
        if (existe) {
            atualizados += 1;
        } else {
            novos += 1;
        }
    });
    return { novos, atualizados };
}

export function baixarModeloContatos() {
    const cabecalho = [
        "Nome",
        "Nome Fantasia",
        "CPF/CNPJ",
        "Fone",
        "Celular",
        "E-mail",
        "Endereço",
        "Número",
        "Complemento",
        "Bairro",
        "CEP",
        "Cidade",
        "Estado",
        "Tipos de Contatos",
        "Tipo Pessoa",
        "Situação"
    ];
    const exemplo = [
        "Maria Silva",
        "Maria",
        "123.456.789-09",
        "",
        "(21) 99999-0000",
        "maria@email.com",
        "Rua A",
        "10",
        "",
        "Centro",
        "22000-000",
        "Rio de Janeiro",
        "RJ",
        "Cliente",
        "Física",
        "Ativo"
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([cabecalho, exemplo]);
    ws["!cols"] = cabecalho.map((coluna) => ({ wch: Math.max(coluna.length + 2, 14) }));
    XLSX.utils.book_append_sheet(wb, ws, "Contatos");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo-contatos.xlsx";
    link.click();
    URL.revokeObjectURL(url);
}

export async function lerPlanilhaContatos(arquivo) {
    const buffer = await arquivo.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const nomeFolha = (wb.SheetNames || []).find((n) => /contato/i.test(n)) || wb.SheetNames[0];
    const linhas = XLSX.utils.sheet_to_json(wb.Sheets[nomeFolha], { defval: "" });
    if (!linhas.length) {
        return { itens: [], erros: [], origem: "vazia", nomeFolha };
    }
    const mapa = mapaCabecalho(linhas[0]);
    const brutos = [];
    const erros = [];
    linhas.forEach((linha, indice) => {
        const contato = linhaParaContato(linha, mapa);
        if (!contato) {
            const vazio = Object.values(linha).every((valor) => String(valor || "").trim() === "");
            if (!vazio) {
                erros.push({ linha: indice + 2, motivo: "Sem nome" });
            }
            return;
        }
        brutos.push(contato);
    });
    return {
        itens: deduparContatos(brutos),
        erros,
        origem: "contatos",
        nomeFolha
    };
}
