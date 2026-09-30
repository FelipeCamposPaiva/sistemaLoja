import { lerContatos } from "./contatos";
import { gravarMinhasIntegracoes, lerMinhasIntegracoes } from "./integracoes";

export const WABA_KEY = "erp-waba-v2";
export const INBOX_KEY = "erp-crm-inbox-v2";
export const ASSUNTOS_KEY = "erp-crm-assuntos-v1";

export const ATENDENTE_CRM = {
    nome: "Mariana Silva",
    cargo: "Atendente de E-commerce",
    frase: "Aqui é a Mari! Tô aqui pra te ajudar!",
    foto: "/images/crm/mariana.jpg",
    online: true
};

export const STATUS_CONVERSA = [
    { id: "todas", label: "Todos" },
    { id: "aberta", label: "Abertas" },
    { id: "atendimento", label: "Em atendimento" },
    { id: "resolvida", label: "Resolvidas" }
];

export const WABA_LINKS = {
    manager: "https://business.facebook.com/latest/whatsapp_manager/overview",
    web: "https://web.whatsapp.com/",
    app: "https://www.whatsapp.com/business",
    docs: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
};

export const TEMPLATES_WABA = [
    {
        id: "orcamento",
        nome: "Orçamento",
        texto: "Olá! Segue o orçamento da Tem de Tudo. Qualquer ajuste me avise por aqui."
    },
    {
        id: "aprovado",
        nome: "Pedido aprovado",
        texto: "Seu pedido foi aprovado e já entrou em produção. Assim que sair para entrega avisamos neste WhatsApp."
    },
    {
        id: "enviado",
        nome: "Pedido enviado",
        texto: "Pedido despachado! Qualquer dúvida de prazo ou acabamento, é só responder esta conversa."
    },
    {
        id: "pronto",
        nome: "Pronto para retirada",
        texto: "Seu material está pronto para retirada na loja Tem de Tudo. Horário: 9h às 18h."
    },
    {
        id: "duvida",
        nome: "Outra dúvida",
        texto: "Claro! Me conta o que você precisa que eu te ajudo por aqui."
    }
];

export const ESTAGIOS_CRM = [
    { id: "novo", nome: "Novo" },
    { id: "andamento", nome: "Em andamento" },
    { id: "aguardando", nome: "Aguardando cliente" },
    { id: "concluido", nome: "Concluído" }
];

export function soDigitos(tel) {
    return String(tel || "").replace(/\D/g, "");
}

export function e164Brasil(tel) {
    const d = soDigitos(tel);
    if (!d) {
        return "";
    }
    if (d.startsWith("55") && d.length >= 12) {
        return d;
    }
    return `55${d}`;
}

export function linkWhatsApp(tel, texto) {
    const numero = e164Brasil(tel);
    if (!numero) {
        return WABA_LINKS.web;
    }
    const q = texto ? `?text=${encodeURIComponent(texto)}` : "";
    return `https://wa.me/${numero}${q}`;
}

export function contaPadrao() {
    return {
        conectado: false,
        numero: "(24) 98128-5708",
        nome: "Tem de Tudo Papelaria e Gráfica",
        wabaId: "",
        phoneNumberId: "",
        qualidade: "verde",
        conectadoEm: null
    };
}

export function lerContaWaba() {
    try {
        const bruto = JSON.parse(localStorage.getItem(WABA_KEY) || "null");
        if (bruto && typeof bruto.numero === "string") {
            return { ...contaPadrao(), ...bruto };
        }
    } catch {
        /* ignore */
    }
    return contaPadrao();
}

export function gravarContaWaba(conta) {
    localStorage.setItem(WABA_KEY, JSON.stringify(conta));
}

export function marcarIntegracaoWhatsapp(ativa) {
    const minhas = lerMinhasIntegracoes();
    const existe = minhas.some((item) => item.id === "whatsapp-business");
    if (ativa && !existe) {
        gravarMinhasIntegracoes([...minhas, { id: "whatsapp-business", ativa: true }]);
        return;
    }
    if (existe) {
        gravarMinhasIntegracoes(
            minhas.map((item) => (item.id === "whatsapp-business" ? { ...item, ativa } : item))
        );
    }
}

export function novoId(prefixo) {
    return `${prefixo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function isoHoras(h) {
    return new Date(Date.now() - h * 3600 * 1000).toISOString();
}

function iniciaisDe(nome) {
    return String(nome || "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase();
}

function conversa(parcial) {
    return {
        canal: "whatsapp",
        status: "aberta",
        naoLidas: 0,
        email: "",
        cidade: "Volta Redonda - RJ",
        tags: ["Cliente"],
        pedidos: [],
        observacao: "",
        favorita: false,
        digitando: false,
        ...parcial,
        iniciais: parcial.iniciais || iniciaisDe(parcial.nome)
    };
}

export const INBOX_PADRAO = [
    conversa({
        id: "cv-testeff",
        contatoId: 90,
        nome: "Cliente Testeff",
        iniciais: "CL",
        telefone: "(24) 99999-9999",
        email: "teste@teste.com",
        cidade: "Volta Redonda - RJ",
        tags: ["Cliente", "E-commerce", "Orçamento"],
        status: "aberta",
        naoLidas: 1,
        digitando: true,
        pedidos: [
            { id: "4921", titulo: "Orçamento personalizados", valor: "186,00" },
            { id: "4888", titulo: "Cartão de visita 500un", valor: "95,00" },
            { id: "4702", titulo: "Caneca personalizada", valor: "42,00" }
        ],
        observacao: "Cliente de teste do e-commerce. Prefere atendimento por WhatsApp.",
        mensagens: [
            { id: "m-t1", de: "cliente", texto: "Olá! Segue o orçamento da Tem de Tudo. Qualquer ajuste me avise por aqui.", em: isoHoras(0.8) },
            { id: "m-t2", de: "loja", texto: "Olá! Já vou conferir e te retorno em instantes.", em: isoHoras(0.7) },
            { id: "m-t3", de: "cliente", texto: "Perfeito! Obrigado!", em: isoHoras(0.6) }
        ]
    }),
    conversa({
        id: "cv-50",
        contatoId: 50,
        nome: "João Pedro Alves",
        iniciais: "JA",
        telefone: "(24) 99911-2233",
        email: "joao.alves@email.com",
        tags: ["Cliente", "Pedido"],
        status: "aberta",
        naoLidas: 2,
        mensagens: [
            { id: "m-j1", de: "cliente", texto: "O folder da farmácia ficou ótimo, obrigado!", em: isoHoras(8) },
            { id: "m-j2", de: "loja", texto: "Pedido despachado! Qualquer dúvida de prazo ou acabamento, é só responder esta conversa.", em: isoHoras(5.2) }
        ]
    }),
    conversa({
        id: "cv-15",
        contatoId: 15,
        nome: "Escola Horizonte",
        iniciais: "EH",
        telefone: "(24) 3348-9000",
        email: "compras@escolahorizonte.com.br",
        tags: ["Escola", "Orçamento"],
        status: "aberta",
        mensagens: [
            { id: "m-e1", de: "loja", texto: "Segue o orçamento dos 1000 cartões 4x4 com verniz local: R$ 190,00.", em: isoHoras(10) },
            { id: "m-e2", de: "cliente", texto: "Qual o prazo de entrega?", em: isoHoras(7.8) }
        ]
    }),
    conversa({
        id: "cv-fp",
        contatoId: 62,
        nome: "FELIPE CAMPOS PAIVA",
        iniciais: "FP",
        telefone: "(24) 98812-3344",
        tags: ["Cliente"],
        status: "atendimento",
        mensagens: [
            { id: "m-f1", de: "loja", texto: "Seu material está pronto para retirada na loja Tem de Tudo. Horário: 9h às 18h.", em: isoHoras(17) }
        ]
    }),
    conversa({
        id: "cv-12",
        contatoId: 12,
        nome: "Papelaria Central",
        iniciais: "PC",
        telefone: "(24) 3342-1100",
        tags: ["Fornecedor", "Parceiro"],
        status: "atendimento",
        mensagens: [
            { id: "m1", de: "cliente", texto: "Bom dia! O banner 3x1,20 já saiu da produção?", em: isoHoras(22) },
            { id: "m2", de: "loja", texto: "Bom dia! Está no acabamento com ilhós. Previsão de retirada hoje à tarde.", em: isoHoras(21) },
            { id: "m3", de: "cliente", texto: "bb", em: isoHoras(20.5) }
        ]
    }),
    conversa({
        id: "cv-41",
        contatoId: 41,
        nome: "Maria das Graças Oliveira",
        iniciais: "MO",
        telefone: "(24) 98877-1122",
        tags: ["Cliente", "Convite"],
        status: "atendimento",
        mensagens: [
            { id: "m6", de: "cliente", texto: "Vocês fazem convite de 15 anos com impressão digital?", em: isoHoras(28) },
            { id: "m7", de: "cliente", texto: "Preciso 80 unidades, papel couchê.", em: isoHoras(26) }
        ]
    }),
    conversa({
        id: "cv-lc",
        contatoId: 71,
        nome: "Luciana Campos",
        iniciais: "LC",
        telefone: "(24) 99221-4455",
        tags: ["Cliente"],
        status: "resolvida",
        mensagens: [
            { id: "m-l1", de: "cliente", texto: "Vocês fazem personalizados de aniversário?", em: isoHoras(30) },
            { id: "m-l2", de: "loja", texto: "Fazemos sim! Caneca, camiseta e convite.", em: isoHoras(29) }
        ]
    }),
    conversa({
        id: "cv-rn",
        contatoId: 72,
        nome: "Ricardo Nascimento",
        iniciais: "RN",
        telefone: "(24) 98765-2211",
        tags: ["Cliente"],
        status: "resolvida",
        mensagens: [
            { id: "m-r1", de: "cliente", texto: "Tem este caderno em outras cores?", em: isoHoras(32) },
            { id: "m-r2", de: "loja", texto: "Temos rosa, azul e verde. Quer que eu separe?", em: isoHoras(31) }
        ]
    }),
    conversa({
        id: "cv-ab",
        contatoId: 73,
        nome: "Ana Beatriz Souza",
        iniciais: "AB",
        telefone: "(24) 98111-7788",
        tags: ["E-commerce"],
        status: "aberta",
        mensagens: [
            { id: "m-a1", de: "cliente", texto: "O kit festa chega até sábado?", em: isoHoras(3) }
        ]
    }),
    conversa({
        id: "cv-sj",
        contatoId: 74,
        nome: "Colégio São José",
        iniciais: "SJ",
        telefone: "(24) 3344-2211",
        tags: ["Escola"],
        status: "aberta",
        mensagens: [
            { id: "m-s1", de: "cliente", texto: "Preciso de 200 crachás para os professores.", em: isoHoras(6) }
        ]
    }),
    conversa({
        id: "cv-mb",
        contatoId: 75,
        nome: "Mercado do Bairro",
        iniciais: "MB",
        telefone: "(24) 3333-1010",
        tags: ["Cliente"],
        status: "resolvida",
        mensagens: [
            { id: "m-b1", de: "loja", texto: "Faixa da promoção entregue. Qualquer ajuste nos chama.", em: isoHoras(40) }
        ]
    }),
    conversa({
        id: "cv-cm",
        contatoId: 76,
        nome: "Carla Mendes",
        iniciais: "CM",
        telefone: "(24) 99987-0012",
        tags: ["Cliente"],
        status: "resolvida",
        mensagens: [
            { id: "m-c1", de: "cliente", texto: "Obrigada pelas canecas, ficaram lindas!", em: isoHoras(48) }
        ]
    }),
    conversa({
        id: "cv-ig-1",
        canal: "instagram",
        nome: "Studio Luna",
        iniciais: "SL",
        telefone: "(24) 98800-1122",
        status: "aberta",
        naoLidas: 1,
        mensagens: [
            { id: "m-i1", de: "cliente", texto: "Vi o story das canecas! Fazem com foto?", em: isoHoras(2) }
        ]
    }),
    conversa({
        id: "cv-fb-1",
        canal: "facebook",
        nome: "Associação Vila",
        iniciais: "AV",
        telefone: "(24) 3340-0001",
        status: "aberta",
        mensagens: [
            { id: "m-fb1", de: "cliente", texto: "Queria um banner para o arraial.", em: isoHoras(9) }
        ]
    })
];

export const ASSUNTOS_PADRAO = [
    {
        id: "as-1",
        titulo: "Banner lona 3x1,20 — Papelaria Central",
        contatoId: 12,
        contato: "Papelaria Central",
        estagio: "andamento",
        canal: "whatsapp",
        valor: "280,00",
        atualizado: isoHoras(1)
    },
    {
        id: "as-2",
        titulo: "Cartões de visita 1000un — Escola Horizonte",
        contatoId: 15,
        contato: "Escola Horizonte",
        estagio: "aguardando",
        canal: "whatsapp",
        valor: "190,00",
        atualizado: isoHoras(20)
    },
    {
        id: "as-3",
        titulo: "Convite 15 anos — Maria das Graças",
        contatoId: 41,
        contato: "Maria das Graças Oliveira",
        estagio: "novo",
        canal: "whatsapp",
        valor: "",
        atualizado: isoHoras(0.4)
    }
];

export function lerInbox() {
    try {
        const bruto = JSON.parse(localStorage.getItem(INBOX_KEY) || "null");
        if (Array.isArray(bruto) && bruto.length) {
            return bruto;
        }
    } catch {
        /* ignore */
    }
    return INBOX_PADRAO.map((item) => ({ ...item, mensagens: [...item.mensagens] }));
}

export function gravarInbox(lista) {
    localStorage.setItem(INBOX_KEY, JSON.stringify(lista));
}

export function lerAssuntos() {
    try {
        const bruto = JSON.parse(localStorage.getItem(ASSUNTOS_KEY) || "null");
        if (Array.isArray(bruto) && bruto.length) {
            return bruto;
        }
    } catch {
        /* ignore */
    }
    return ASSUNTOS_PADRAO.map((item) => ({ ...item }));
}

export function gravarAssuntos(lista) {
    localStorage.setItem(ASSUNTOS_KEY, JSON.stringify(lista));
}

export function conversaDeContato(inbox, contato) {
    if (!contato) {
        return null;
    }
    const existente = inbox.find((item) => Number(item.contatoId) === Number(contato.id));
    if (existente) {
        return existente;
    }
    const tel = contato.celular || contato.telefone || "";
    return {
        id: novoId("cv"),
        contatoId: contato.id,
        nome: contato.fantasia || contato.nome,
        telefone: tel,
        naoLidas: 0,
        canal: "whatsapp",
        status: "aberta",
        email: contato.email || "",
        cidade: [contato.cidade, contato.uf].filter(Boolean).join(" - "),
        tags: ["Cliente"],
        pedidos: [],
        observacao: "",
        favorita: false,
        digitando: false,
        iniciais: iniciaisDe(contato.fantasia || contato.nome),
        mensagens: []
    };
}

export function contatosComWhatsApp() {
    return lerContatos().filter((c) => !c.excluido && soDigitos(c.celular || c.telefone));
}

export function telefoneChave(valor) {
    const d = soDigitos(valor);
    if (d.startsWith("55") && d.length >= 12) {
        return d.slice(2);
    }
    return d;
}

export function mesclarMensagensZapi(inbox, eventos) {
    if (!Array.isArray(eventos) || !eventos.length) {
        return inbox;
    }
    let lista = inbox.map((item) => ({ ...item, mensagens: [...(item.mensagens || [])] }));
    eventos.forEach((ev) => {
        const chave = telefoneChave(ev.phone);
        if (!chave || !ev.texto) {
            return;
        }
        let conv = lista.find((item) => telefoneChave(item.telefone) === chave);
        if (!conv) {
            conv = {
                id: `zapi-${chave}`,
                contatoId: null,
                nome: ev.nome || ev.phone,
                telefone: ev.phone,
                canal: "whatsapp",
                status: "aberta",
                naoLidas: 0,
                email: "",
                cidade: "",
                tags: ["WhatsApp"],
                pedidos: [],
                observacao: "",
                favorita: false,
                digitando: false,
                iniciais: String(ev.nome || "WA").slice(0, 2).toUpperCase(),
                mensagens: []
            };
            lista = [conv, ...lista];
        }
        const jaTem = conv.mensagens.some((m) => m.id === ev.id || (m.texto === ev.texto && m.em === ev.em));
        if (jaTem) {
            return;
        }
        conv.mensagens.push({
            id: ev.id,
            de: ev.deLoja ? "loja" : "cliente",
            texto: ev.texto,
            em: ev.em
        });
        if (!ev.deLoja) {
            conv.naoLidas = (conv.naoLidas || 0) + 1;
        }
    });
    return lista;
}
