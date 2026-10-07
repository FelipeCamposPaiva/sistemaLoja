# Carga das planilhas exportadas do Bling/Olist para o MySQL temdetudo_db.
# Idempotente: contato por tiny_id, produto por SKU, pedido/OS/proposta por número,
# contas e caixa pelo id da planilha.
from __future__ import annotations

import json
import re
import sys
import unicodedata
from datetime import datetime
from pathlib import Path

import pymysql
import xlrd

BASE = Path(r"D:\ITENS_AREA_TRABALHO\Downloads\b310f7e55ef406bdaed39e75b56750ba")
PROPS = Path(r"C:\Projetos\ERP-TemDeTudo\backend\config\local.properties")
LOTE = 250


def chave(valor) -> str:
    texto = unicodedata.normalize("NFD", str(valor or ""))
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    return "".join(c for c in texto.lower() if c.isalnum())


def clip(valor, tamanho: int):
    if valor is None:
        return None
    if isinstance(valor, float) and valor == int(valor):
        texto = str(int(valor))
    else:
        texto = str(valor).strip()
    if not texto:
        return None
    return texto[:tamanho]


def texto(valor) -> str:
    if valor is None:
        return ""
    if isinstance(valor, float) and valor == int(valor):
        return str(int(valor))
    return str(valor).strip()


def money(valor) -> float:
    if isinstance(valor, (int, float)):
        numero = float(valor)
    else:
        bruto = texto(valor)
        if not bruto:
            return 0.0
        if "," in bruto and "." in bruto:
            bruto = bruto.replace(".", "").replace(",", ".")
        elif "," in bruto:
            bruto = bruto.replace(",", ".")
        try:
            numero = float(bruto)
        except ValueError:
            return 0.0
    if numero > 99999999.99:
        numero = 99999999.99
    if numero < -99999999.99:
        numero = -99999999.99
    return round(numero, 2)


def inteiro(valor):
    if isinstance(valor, bool) or valor is None or valor == "":
        return None
    try:
        numero = int(float(valor))
    except (TypeError, ValueError):
        digitos = re.sub(r"\D", "", texto(valor))
        if not digitos:
            return None
        numero = int(digitos)
    if numero <= 0 or numero > 2147483647:
        return None
    return numero


def data_sql(valor):
    if isinstance(valor, datetime):
        return valor.strftime("%Y-%m-%d")
    bruto = texto(valor)
    casamento = re.match(r"(\d{1,2})/(\d{1,2})/(\d{4})", bruto)
    if casamento:
        dia, mes, ano = int(casamento.group(1)), int(casamento.group(2)), int(casamento.group(3))
        if 1 <= mes <= 12 and 1 <= dia <= 31 and 1900 <= ano <= 2100:
            return f"{ano:04d}-{mes:02d}-{dia:02d}"
        return None
    if re.match(r"\d{4}-\d{2}-\d{2}", bruto):
        return bruto[:10]
    return None


def pick(linha: dict, *chaves):
    for nome in chaves:
        if nome in linha and linha[nome] not in ("", None):
            return linha[nome]
    return ""


def digitos(valor) -> str:
    return re.sub(r"\D", "", texto(valor))


def arquivos(prefixo: str) -> list[Path]:
    encontrados = list(BASE.glob(f"{prefixo}_*.xls"))

    def ordem(caminho: Path) -> int:
        achado = re.search(r"(\d+)", caminho.name)
        return int(achado.group(1)) if achado else 0

    return sorted(encontrados, key=ordem)


def ler_planilha(caminho: Path) -> list[dict]:
    livro = xlrd.open_workbook(str(caminho), ignore_workbook_corruption=True)
    folha = livro.sheet_by_index(0)
    cabecalhos = [chave(folha.cell_value(0, coluna)) for coluna in range(folha.ncols)]
    linhas = []
    for indice in range(1, folha.nrows):
        registro = {}
        vazio = True
        for coluna, cabecalho in enumerate(cabecalhos):
            if not cabecalho:
                continue
            tipo = folha.cell_type(indice, coluna)
            valor = folha.cell_value(indice, coluna)
            if tipo == xlrd.XL_CELL_DATE and valor:
                valor = xlrd.xldate_as_datetime(valor, livro.datemode)
            elif tipo == xlrd.XL_CELL_NUMBER and isinstance(valor, float) and valor == int(valor) and abs(valor) < 1e15:
                valor = int(valor)
            elif isinstance(valor, str):
                valor = valor.strip()
            if valor not in ("", None):
                vazio = False
            registro[cabecalho] = valor
        if not vazio:
            linhas.append(registro)
    return linhas


def ler_grupo(prefixo: str) -> list[dict]:
    tudo = []
    for caminho in arquivos(prefixo):
        linhas = ler_planilha(caminho)
        print(f"  {caminho.name}: {len(linhas)} linhas", flush=True)
        tudo.extend(linhas)
    return tudo


def conectar():
    props = {}
    for linha in PROPS.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        nome, valor = linha.split("=", 1)
        props[nome.strip()] = valor.strip()
    return pymysql.connect(
        host="127.0.0.1",
        port=3306,
        user=props["DB_USERNAME"],
        password=props["DB_PASSWORD"],
        database="temdetudo_db",
        charset="utf8mb4",
        autocommit=False,
    )


def executar_lotes(cur, sql: str, linhas: list[tuple], rotulo: str):
    total = 0
    for inicio in range(0, len(linhas), LOTE):
        parte = linhas[inicio:inicio + LOTE]
        cur.executemany(sql, parte)
        total += len(parte)
        if total % 2000 == 0 or total == len(linhas):
            print(f"    {rotulo}: {total}/{len(linhas)}", flush=True)
    return total


def contar(cur, tabela: str) -> int:
    cur.execute(f"SELECT COUNT(*) FROM {tabela}")
    return int(cur.fetchone()[0])


def tipos_contato(valor) -> str:
    mapa = []
    for parte in re.split(r"[|,;/]+", texto(valor)):
        token = chave(parte)
        if "fornec" in token:
            mapa.append("fornecedor")
        elif "transp" in token:
            mapa.append("transportador")
        elif "func" in token:
            mapa.append("funcionario")
        elif "client" in token:
            mapa.append("cliente")
        elif token:
            mapa.append("outro")
    if not mapa:
        mapa = ["cliente"]
    return clip(",".join(dict.fromkeys(mapa)), 80)


def tipo_pessoa(valor) -> str:
    token = chave(valor)
    if token in ("j", "juridica", "pessoajuridica"):
        return "juridica"
    return "fisica"


def contribuinte(valor) -> str:
    token = texto(valor)
    if token in ("1", "1.0"):
        return "1"
    if token in ("2", "2.0"):
        return "2"
    return "9"


def ativo_de(valor) -> int:
    token = chave(valor)
    if token in ("inativo", "inativa", "excluido", "nao", "0", "false"):
        return 0
    return 1


def cep(valor):
    digitos_cep = digitos(valor)
    if len(digitos_cep) == 8:
        return f"{digitos_cep[:5]}-{digitos_cep[5:]}"
    return clip(valor, 10)


def uf(valor):
    letras = re.sub(r"[^A-Za-z]", "", texto(valor)).upper()
    return letras[:2] or None


def codigo_status_pedido(situacao: str) -> str:
    mapa = {
        "orcamento": "ORCAMENTO",
        "emaberto": "EM_ABERTO",
        "aberto": "EM_ABERTO",
        "aprovado": "APROVADO",
        "preparandoenvio": "PRODUCAO",
        "producao": "PRODUCAO",
        "faturado": "FATURADO",
        "prontoparaenvio": "PRONTO",
        "pronto": "PRONTO",
        "enviado": "FATURADO",
        "entregue": "ENTREGUE",
        "naoentregue": "NAO_ENTREGUE",
        "cancelado": "CANCELADO",
        "dadosincompletos": "EM_ABERTO",
    }
    return mapa.get(chave(situacao), "APROVADO")


def flags_pedido(situacao: str, status: str) -> dict:
    bruto = chave(situacao)
    entregue = status == "ENTREGUE" or bruto == "entregue"
    enviado = bruto == "enviado"
    faturado = status == "FATURADO" or bruto == "faturado"
    pronto = status == "PRONTO" or bruto in ("prontoparaenvio", "pronto")
    preparando = bruto == "preparandoenvio" or status == "PRODUCAO"
    return {
        "estoque": 1 if entregue or enviado or faturado or pronto else 0,
        "contas": 1 if entregue else 0,
        "separacao": "SEPARADO" if entregue or enviado or faturado or pronto else ("SEPARANDO" if preparando else "PENDENTE"),
        "expedicao": "DESPACHADO" if entregue or enviado else "PENDENTE",
    }


def codigo_status_os(situacao: str) -> str:
    bruto = unicodedata.normalize("NFD", texto(situacao) or "EM_ABERTO")
    bruto = "".join(c for c in bruto if unicodedata.category(c) != "Mn").upper().strip()
    bruto = re.sub(r"\s+", "_", bruto)
    mapa = {
        "EM_ABERTO": "EM_ABERTO",
        "ABERTA": "EM_ABERTO",
        "ABERTO": "EM_ABERTO",
        "ORCAMENTO": "ORCAMENTO",
        "APROVADA": "APROVADO",
        "APROVADO": "APROVADO",
        "NAO_APROVADA": "NAO_APROVADA",
        "EM_ANDAMENTO": "EM_ANDAMENTO",
        "CANCELADA": "CANCELADA",
        "CANCELADO": "CANCELADA",
        "FINALIZADA": "FINALIZADA",
        "ENTREGUE": "ENTREGUE",
        "PRONTO": "PRONTO",
    }
    return mapa.get(bruto, bruto or "EM_ABERTO")[:40]


def tipo_produto(valor) -> str:
    token = texto(valor).upper()
    if token in ("K", "KIT", "KITS"):
        return "kits"
    if token in ("F", "FABRICADO"):
        return "fabricado"
    if token in ("M", "MP") or "MATERIA" in token:
        return "materia-prima"
    if token == "V" or "VARIAC" in token:
        return "variacoes"
    if token in ("S", "SIMPLES"):
        return "simples"
    return clip(token, 50) or "simples"


def status_financeiro(situacao, valor, pago, receber: bool) -> str:
    token = chave(situacao)
    if "cancel" in token:
        return "CANCELADO"
    if "agrup" in token:
        return "AGRUPADO"
    if pago > 0 and valor - pago > 0.009:
        return "PARCIAL"
    quitado = token in ("pago", "recebido", "liquidado", "quitado") or (valor > 0 and pago >= valor - 0.009 and "aberto" not in token)
    if quitado:
        return "RECEBIDO" if receber else "PAGO"
    if "parcial" in token:
        return "PARCIAL"
    if "atras" in token:
        return "ATRASADO"
    return "ABERTO"


def importar_contatos(cur) -> dict:
    print("Contatos", flush=True)
    linhas = ler_grupo("contatos")
    cur.execute("SELECT id, tiny_id, cpf_cnpj FROM clientes")
    por_tiny = {}
    por_doc = {}
    for ident, tiny, documento in cur.fetchall():
        if tiny:
            por_tiny[int(tiny)] = ident
        doc = texto(documento).lower()
        if doc:
            por_doc[doc] = ident
            so_digitos = digitos(doc)
            if so_digitos:
                por_doc[so_digitos] = ident

    novos = []
    atualizar = []
    vistos = set()
    reservados = set()
    for linha in linhas:
        nome = clip(pick(linha, "nome"), 150)
        if not nome:
            continue
        tiny = inteiro(pick(linha, "id"))
        documento = clip(pick(linha, "cnpjcpf", "cpfcnpj"), 20)
        doc_chave = texto(documento).lower()
        doc_digitos = digitos(documento)
        if tiny and tiny in vistos:
            continue
        if tiny:
            vistos.add(tiny)
        dono = por_doc.get(doc_chave) or (por_doc.get(doc_digitos) if doc_digitos else None)
        existente = por_tiny.get(tiny) if tiny else None
        if existente is None and dono:
            existente = dono
        elif existente and dono and dono != existente:
            documento = None
            doc_digitos = ""
        if not existente and doc_digitos:
            if doc_digitos in reservados:
                documento = None
            else:
                reservados.add(doc_digitos)
        endereco = ", ".join(
            parte for parte in (
                texto(pick(linha, "endereco")),
                f"nº {texto(pick(linha, 'numero'))}" if texto(pick(linha, "numero")) else "",
                texto(pick(linha, "complemento")),
                texto(pick(linha, "bairro")),
            ) if parte
        )
        fone = clip(pick(linha, "celular") or pick(linha, "fone"), 20)
        obs = "\n".join(parte for parte in (texto(pick(linha, "observacoes")), texto(pick(linha, "observacoesdocontato"))) if parte)
        pessoa = tipo_pessoa(pick(linha, "tipopessoa"))
        contrib = contribuinte(pick(linha, "contribuinte"))
        registro = (
            nome,
            documento,
            fone,
            clip(pick(linha, "email"), 150),
            endereco or None,
            tipos_contato(pick(linha, "tiposdecontatos")),
            clip(pick(linha, "fantasia"), 255),
            clip(pick(linha, "cidade"), 100),
            uf(pick(linha, "estado")),
            cep(pick(linha, "cep")),
            obs or None,
            ativo_de(pick(linha, "situacao")),
            tiny,
            pessoa,
            contrib,
            clip(pick(linha, "ierg"), 30),
            clip(pick(linha, "vendedor"), 150),
            0 if contrib == "1" else 1,
            clip(pick(linha, "codigoderegimetributario"), 30),
        )
        if existente:
            atualizar.append(registro + (existente,))
        else:
            novos.append(registro)

    sql_novo = """
        INSERT INTO clientes (
            nome, cpf_cnpj, telefone, email, endereco, tipo, nome_fantasia,
            cidade, estado, cep, observacoes, ativo, tiny_id, tipo_pessoa,
            contribuinte, ie, vendedor, consumidor_final, regime_tributario, limite_credito
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,0)
    """
    sql_upd = """
        UPDATE clientes SET
            nome=%s, cpf_cnpj=COALESCE(%s, cpf_cnpj), telefone=%s, email=%s, endereco=%s, tipo=%s, nome_fantasia=%s,
            cidade=%s, estado=%s, cep=%s, observacoes=%s, ativo=%s, tiny_id=%s, tipo_pessoa=%s,
            contribuinte=%s, ie=%s, vendedor=%s, consumidor_final=%s, regime_tributario=%s
        WHERE id=%s
    """
    executar_lotes(cur, sql_novo, novos, "clientes novos")
    executar_lotes(cur, sql_upd, atualizar, "clientes atualizados")
    por_tiny_contato, por_nome_contato = espelhar_contatos(cur, linhas)
    cur.connection.commit()
    print(f"  clientes: {len(novos)} novos, {len(atualizar)} atualizados", flush=True)
    return {"novos": len(novos), "atualizados": len(atualizar)}, por_tiny_contato, por_nome_contato


def espelhar_contatos(cur, linhas):
    cur.execute("SELECT id, nome, cpf_cnpj FROM contatos")
    por_doc = {}
    por_nome = {}
    for ident, nome, documento in cur.fetchall():
        doc = digitos(documento)
        if doc and doc not in por_doc:
            por_doc[doc] = ident
        token = chave(nome)
        if token and token not in por_nome:
            por_nome[token] = ident
    novos = []
    atualizar = []
    pendentes = []
    por_tiny = {}
    for linha in linhas:
        nome = clip(pick(linha, "nome"), 150)
        if not nome:
            continue
        tiny = inteiro(pick(linha, "id"))
        documento = clip(pick(linha, "cnpjcpf", "cpfcnpj"), 20)
        doc = digitos(documento)
        tipo = clip((tipos_contato(pick(linha, "tiposdecontatos")) or "cliente").split(",")[0], 30)
        registro = (
            tipo,
            nome,
            clip(pick(linha, "fantasia"), 150),
            documento,
            clip(pick(linha, "celular") or pick(linha, "fone"), 30),
            clip(pick(linha, "email"), 150),
            clip(pick(linha, "cidade"), 100),
        )
        existente = por_doc.get(doc) if doc else None
        if existente is None:
            existente = por_nome.get(chave(nome))
        if existente and existente > 0:
            atualizar.append(registro + (existente,))
            if tiny:
                por_tiny[tiny] = existente
        else:
            novos.append(registro)
            pendentes.append((tiny, doc, chave(nome)))
            if doc:
                por_doc[doc] = -1
            por_nome[chave(nome)] = -1
    executar_lotes(cur, """
        INSERT INTO contatos (tipo, nome, fantasia, cpf_cnpj, telefone, email, cidade)
        VALUES (%s,%s,%s,%s,%s,%s,%s)
    """, novos, "contatos novos")
    executar_lotes(cur, """
        UPDATE contatos SET tipo=%s, nome=%s, fantasia=%s, cpf_cnpj=%s, telefone=%s, email=%s, cidade=%s
        WHERE id=%s
    """, atualizar, "contatos atualizados")
    cur.execute("SELECT id, nome, cpf_cnpj FROM contatos")
    por_doc = {}
    por_nome = {}
    for ident, nome, documento in cur.fetchall():
        doc = digitos(documento)
        if doc and doc not in por_doc:
            por_doc[doc] = ident
        token = chave(nome)
        if token and token not in por_nome:
            por_nome[token] = ident
    for tiny, doc, nome_chave in pendentes:
        ident = por_doc.get(doc) if doc else None
        if ident is None:
            ident = por_nome.get(nome_chave)
        if tiny and ident:
            por_tiny[tiny] = ident
    print(f"  espelho contatos: {len(novos)} novos, {len(atualizar)} atualizados", flush=True)
    return por_tiny, por_nome


def garantir_contato(cur, nome, tipo, por_nome):
    token = chave(nome)
    if not token:
        return None
    if token in por_nome and por_nome[token]:
        return por_nome[token]
    cur.execute(
        "INSERT INTO contatos (tipo, nome) VALUES (%s, %s)",
        (clip(tipo, 30) or "cliente", clip(nome, 150)),
    )
    por_nome[token] = cur.lastrowid
    return por_nome[token]


def mapa_clientes(cur):
    cur.execute("SELECT id, tiny_id, nome FROM clientes")
    por_tiny = {}
    por_nome = {}
    for ident, tiny, nome in cur.fetchall():
        if tiny:
            por_tiny[int(tiny)] = ident
        token = chave(nome)
        if token and token not in por_nome:
            por_nome[token] = ident
    return por_tiny, por_nome


def importar_produtos(cur) -> dict:
    print("Produtos", flush=True)
    linhas = ler_grupo("produtos")
    cur.execute("SELECT id, sku FROM produtos")
    por_sku = {}
    for ident, sku in cur.fetchall():
        token = texto(sku).lower()
        if token and token not in por_sku:
            por_sku[token] = ident
    cur.execute("SELECT id, nome FROM produtos WHERE sku IS NULL OR sku=''")
    por_nome = {}
    for ident, nome in cur.fetchall():
        token = chave(nome)
        if token and token not in por_nome:
            por_nome[token] = ident
    cur.execute("SELECT id, codigo_barras FROM produtos WHERE codigo_barras IS NOT NULL AND codigo_barras <> ''")
    dono_barra = {}
    for ident, barra in cur.fetchall():
        token = texto(barra)
        if token and token not in dono_barra:
            dono_barra[token] = ident

    novos = []
    atualizar = []
    vistos = set()
    for linha in linhas:
        nome = clip(pick(linha, "descricao", "nome"), 255)
        if not nome:
            continue
        sku = clip(pick(linha, "codigosku", "sku"), 50)
        gtin = clip(pick(linha, "gtinean"), 50)
        if not gtin and sku and sku.isdigit() and len(sku) >= 8:
            gtin = sku
        chave_sku = texto(sku).lower()
        chave_item = f"sku:{chave_sku}" if chave_sku else f"nome:{chave(nome)}"
        if chave_item in vistos:
            continue
        vistos.add(chave_item)
        existente = por_sku.get(chave_sku) if chave_sku else por_nome.get(chave(nome))
        if gtin and dono_barra.get(gtin) not in (None, existente):
            gtin = None
        elif gtin:
            dono_barra[gtin] = existente or -1
        ncm = digitos(pick(linha, "classificacaofiscal"))[:20] or None
        cest = digitos(pick(linha, "cest"))[:20] or None
        tipo = tipo_produto(pick(linha, "tipodoproduto"))
        registro = (
            sku,
            gtin,
            nome,
            clip(pick(linha, "categoria"), 100),
            clip(pick(linha, "unidade"), 10) or "UN",
            money(pick(linha, "preodecusto")),
            money(pick(linha, "preodecusto")),
            money(pick(linha, "preco")),
            money(pick(linha, "precopromocional")) or None,
            money(pick(linha, "estoque")),
            money(pick(linha, "estoqueminimo")),
            money(pick(linha, "estoquemaximo")) or None,
            money(pick(linha, "pesoliquidokg")) or None,
            ativo_de(pick(linha, "situacao")),
            texto(pick(linha, "observacoes")) or None,
            ncm,
            cest,
            clip(pick(linha, "localizacao"), 255),
            tipo,
            clip(pick(linha, "marca"), 255),
            1 if tipo == "fabricado" else 0,
        )
        if existente:
            atualizar.append(registro + (existente,))
        else:
            novos.append(registro)

    sql_novo = """
        INSERT INTO produtos (
            sku, codigo_barras, nome, categoria, unidade, custo, custo_compra, preco,
            preco_promocional, estoque, estoque_minimo, estoque_maximo, peso, ativo,
            observacoes, ncm, cest, localizacao, tipo_produto, fabricante, produto_producao
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """
    sql_upd = """
        UPDATE produtos SET
            sku=COALESCE(%s, sku), codigo_barras=COALESCE(%s, codigo_barras), nome=%s, categoria=%s, unidade=%s, custo=%s, custo_compra=%s,
            preco=%s, preco_promocional=%s, estoque=%s, estoque_minimo=%s, estoque_maximo=%s,
            peso=%s, ativo=%s, observacoes=%s, ncm=%s, cest=%s, localizacao=%s, tipo_produto=%s,
            fabricante=%s, produto_producao=%s
        WHERE id=%s
    """
    executar_lotes(cur, sql_novo, novos, "produtos novos")
    executar_lotes(cur, sql_upd, atualizar, "produtos atualizados")
    cur.connection.commit()
    print(f"  produtos: {len(novos)} novos, {len(atualizar)} atualizados", flush=True)
    return {"novos": len(novos), "atualizados": len(atualizar)}


def mapa_sku(cur):
    cur.execute("SELECT id, sku FROM produtos")
    mapa = {}
    for ident, sku in cur.fetchall():
        token = texto(sku).lower()
        if token and token not in mapa:
            mapa[token] = ident
    return mapa


def detalhes_pedido(pedido: dict) -> str:
    return json.dumps({
        "itens": pedido["itens"],
        "vendedores": [],
        "poolPct": 0,
        "previsto": pedido["previsto"] or "",
        "dataLimiteDespacho": "",
        "rastreio": pedido["rastreio"] or "",
        "marcadores": "",
        "numeroPedido": pedido["numero"],
        "uf": pedido["uf"] or "",
        "cidade": pedido["cidade"] or "",
        "pagamento": "",
        "formaPagamento": "",
        "formaEnvio": "",
        "notaFiscal": "",
        "fantasia": "",
        "documento": pedido["documento"] or "",
        "contatoOlistId": pedido["contato"] or "",
        "olistId": pedido["olist"] or "",
        "embalagem": "",
    }, ensure_ascii=False)


def importar_pedidos(cur, por_tiny, skus) -> dict:
    print("Pedidos de venda", flush=True)
    agrupados = {}
    for caminho in arquivos("pedidos_venda"):
        for linha in ler_planilha(caminho):
            numero = texto(pick(linha, "numerodopedido"))
            cliente = texto(pick(linha, "nomedocontato"))
            if not numero and not cliente:
                continue
            if not numero:
                numero = f"OL-{inteiro(pick(linha, 'id')) or cliente}"
            pedido = agrupados.get(numero)
            if pedido is None:
                pedido = {
                    "numero": numero[:20],
                    "olist": texto(pick(linha, "id")),
                    "contato": texto(pick(linha, "idcontato")),
                    "cliente": cliente,
                    "documento": texto(pick(linha, "cpfcnpj")),
                    "cidade": texto(pick(linha, "municipio")),
                    "uf": uf(pick(linha, "uf")) or "",
                    "obs": texto(pick(linha, "observacoes")),
                    "data": data_sql(pick(linha, "data")),
                    "previsto": data_sql(pick(linha, "dataprevista")) or "",
                    "situacao": texto(pick(linha, "situacao")),
                    "vendedor": texto(pick(linha, "vendedor")),
                    "rastreio": texto(pick(linha, "codigoderastreamento")),
                    "frete": money(pick(linha, "fretepedido")),
                    "desconto": money(pick(linha, "descontodopedidoouvalor")),
                    "itens": [],
                }
                agrupados[numero] = pedido
            descricao = texto(pick(linha, "descricao"))
            sku = texto(pick(linha, "codigosku"))
            if descricao or sku:
                qtd = money(pick(linha, "quantidade")) or 1
                preco = money(pick(linha, "valorunitario"))
                desconto = money(pick(linha, "descontoitem"))
                pedido["itens"].append({
                    "sku": sku,
                    "descricao": descricao or sku,
                    "quantidade": qtd,
                    "valorUnitario": preco,
                    "desconto": desconto,
                    "produtoOlistId": texto(pick(linha, "idproduto")),
                    "produtoId": skus.get(sku.lower()) if sku else None,
                })
        print(f"  {caminho.name}: acumulado {len(agrupados)} pedidos", flush=True)

    cur.execute("SELECT id, numero FROM pedidos_venda")
    existentes = {texto(numero): ident for ident, numero in cur.fetchall() if texto(numero)}
    novos = []
    atualizar = []
    itens_por_numero = {}
    for pedido in agrupados.values():
        bruto = sum(max(0.0, item["quantidade"] * item["valorUnitario"] - item["desconto"]) for item in pedido["itens"])
        total = money(bruto + pedido["frete"] - pedido["desconto"])
        status = codigo_status_pedido(pedido["situacao"])
        flags = flags_pedido(pedido["situacao"], status)
        contato_id = inteiro(pedido["contato"])
        cliente_id = por_tiny.get(contato_id) if contato_id else None
        registro = (
            pedido["numero"],
            cliente_id,
            clip(pedido["cliente"], 255),
            f"{pedido['data']} 12:00:00" if pedido["data"] else None,
            total,
            status,
            pedido["obs"] or None,
            clip(pedido["vendedor"], 500),
            "Olist",
            flags["estoque"],
            flags["contas"],
            flags["separacao"],
            flags["expedicao"],
            detalhes_pedido(pedido),
        )
        itens_por_numero[pedido["numero"]] = pedido["itens"]
        if pedido["numero"] in existentes:
            atualizar.append(registro + (existentes[pedido["numero"]],))
        else:
            novos.append(registro)

    sql_novo = """
        INSERT INTO pedidos_venda (
            numero, cliente_id, cliente_nome, data_pedido, valor_total, status, observacoes,
            vendedor, origem, estoque_lancado, contas_lancadas, separacao, expedicao, detalhes
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """
    sql_upd = """
        UPDATE pedidos_venda SET
            numero=%s, cliente_id=%s, cliente_nome=%s, data_pedido=%s, valor_total=%s, status=%s,
            observacoes=%s, vendedor=%s, origem=%s, estoque_lancado=%s, contas_lancadas=%s,
            separacao=%s, expedicao=%s, detalhes=%s
        WHERE id=%s
    """
    executar_lotes(cur, sql_novo, novos, "pedidos novos")
    executar_lotes(cur, sql_upd, atualizar, "pedidos atualizados")
    cur.connection.commit()

    cur.execute("SELECT id, numero FROM pedidos_venda")
    ids = {texto(numero): ident for ident, numero in cur.fetchall() if texto(numero)}
    alvos = [ids[numero] for numero in itens_por_numero if numero in ids]
    for inicio in range(0, len(alvos), 500):
        parte = alvos[inicio:inicio + 500]
        marcadores = ",".join(["%s"] * len(parte))
        cur.execute(f"DELETE FROM pedidos_venda_itens WHERE pedido_id IN ({marcadores})", parte)
    itens_sql = []
    for numero, itens in itens_por_numero.items():
        pedido_id = ids.get(numero)
        if not pedido_id:
            continue
        for item in itens:
            qtd = item["quantidade"]
            preco = item["valorUnitario"]
            total = money(max(0.0, qtd * preco - item["desconto"]))
            itens_sql.append((
                pedido_id,
                item["produtoId"],
                clip(item["descricao"], 255),
                qtd,
                preco,
                total,
            ))
    executar_lotes(cur, """
        INSERT INTO pedidos_venda_itens (pedido_id, produto_id, descricao, quantidade, valor_unitario, valor_total)
        VALUES (%s,%s,%s,%s,%s,%s)
    """, itens_sql, "itens de pedido")
    cur.connection.commit()
    print(f"  pedidos: {len(novos)} novos, {len(atualizar)} atualizados, {len(itens_sql)} itens", flush=True)
    return {"novos": len(novos), "atualizados": len(atualizar), "itens": len(itens_sql)}


def importar_os(cur, por_tiny, por_nome) -> dict:
    print("Ordens de serviço", flush=True)
    agrupadas = {}
    for linha in ler_grupo("ordens_servico"):
        numero = inteiro(pick(linha, "numerodaordemdeservico"))
        cliente = texto(pick(linha, "nomedocontato"))
        if not numero and not cliente:
            continue
        chave_os = numero or texto(pick(linha, "id"))
        ordem = agrupadas.get(chave_os)
        if ordem is None:
            ordem = {
                "numero": numero,
                "olist": texto(pick(linha, "id")),
                "contato": texto(pick(linha, "idcontato")),
                "cliente": cliente,
                "situacao": texto(pick(linha, "situacao")),
                "data": data_sql(pick(linha, "data")),
                "prevista": data_sql(pick(linha, "dataprevista")),
                "vendedor": texto(pick(linha, "vendedor")),
                "total": money(pick(linha, "total")),
                "itens": [],
            }
            agrupadas[chave_os] = ordem
        descricao = texto(pick(linha, "descricao"))
        if descricao:
            qtd = money(pick(linha, "quantidade")) or 1
            preco = money(pick(linha, "valorunitario"))
            ordem["itens"].append({
                "descricao": descricao,
                "quantidade": qtd,
                "valorUnitario": preco,
                "sku": "",
                "tipo": texto(pick(linha, "tipo")),
                "total": money(pick(linha, "totalitem")) or money(qtd * preco),
            })
    cur.execute("SELECT id, numero FROM ordens_servico")
    existentes = {int(numero): ident for ident, numero in cur.fetchall() if numero}
    novos = []
    atualizar = []
    for ordem in agrupadas.values():
        if not ordem["numero"]:
            continue
        contato_id = inteiro(ordem["contato"])
        cliente_id = por_tiny.get(contato_id) if contato_id else None
        if cliente_id is None and ordem["cliente"]:
            cliente_id = garantir_contato(cur, ordem["cliente"], "cliente", por_nome)
        descricao = ordem["itens"][0]["descricao"] if ordem["itens"] else None
        detalhes = json.dumps({
            "olistId": ordem["olist"],
            "contatoOlistId": ordem["contato"],
            "itens": ordem["itens"],
            "setorAtual": codigo_status_os(ordem["situacao"]),
        }, ensure_ascii=False)
        registro = (
            ordem["numero"],
            cliente_id,
            clip(ordem["cliente"], 255),
            descricao,
            ordem["total"],
            codigo_status_os(ordem["situacao"]),
            ordem["data"],
            ordem["prevista"],
            clip(ordem["vendedor"], 100),
            None,
            detalhes,
        )
        if ordem["numero"] in existentes:
            atualizar.append(registro + (existentes[ordem["numero"]],))
        else:
            novos.append(registro)
    executar_lotes(cur, """
        INSERT INTO ordens_servico (
            numero, cliente_id, cliente_nome, descricao, valor, status,
            data_abertura, data_previsao, responsavel, observacoes, detalhes
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, novos, "os novas")
    executar_lotes(cur, """
        UPDATE ordens_servico SET
            numero=%s, cliente_id=%s, cliente_nome=%s, descricao=%s, valor=%s, status=%s,
            data_abertura=%s, data_previsao=%s, responsavel=%s, observacoes=%s, detalhes=%s
        WHERE id=%s
    """, atualizar, "os atualizadas")
    cur.connection.commit()
    cur.execute("SELECT id, numero FROM ordens_servico")
    ids = {int(numero): ident for ident, numero in cur.fetchall() if numero}
    alvos = [ids[ordem["numero"]] for ordem in agrupadas.values() if ordem["numero"] in ids]
    for inicio in range(0, len(alvos), 500):
        parte = alvos[inicio:inicio + 500]
        marcadores = ",".join(["%s"] * len(parte))
        cur.execute(f"DELETE FROM os_itens WHERE os_id IN ({marcadores})", parte)
    itens_sql = []
    for ordem in agrupadas.values():
        os_id = ids.get(ordem["numero"]) if ordem["numero"] else None
        if not os_id:
            continue
        for item in ordem["itens"]:
            itens_sql.append((os_id, clip(item["descricao"], 150), item["quantidade"], item["valorUnitario"], item["total"]))
    executar_lotes(cur, """
        INSERT INTO os_itens (os_id, produto, quantidade, valor_unitario, valor_total)
        VALUES (%s,%s,%s,%s,%s)
    """, itens_sql, "itens de os")
    cur.connection.commit()
    print(f"  os: {len(novos)} novas, {len(atualizar)} atualizadas", flush=True)
    return {"novos": len(novos), "atualizados": len(atualizar)}


def importar_contas(cur, prefixo: str, tabela: str, receber: bool, por_nome) -> dict:
    print(tabela, flush=True)
    cur.execute(f"SELECT id, origem_ids FROM {tabela} WHERE origem_ids LIKE 'bling:%%'")
    existentes = {texto(origem).split(":", 1)[-1]: ident for ident, origem in cur.fetchall()}
    novos = []
    atualizar = []
    for linha in ler_grupo(prefixo):
        bling = texto(pick(linha, "id"))
        if not bling:
            continue
        nome = texto(pick(linha, "cliente" if receber else "fornecedor"))
        valor = money(pick(linha, "valordocumento"))
        saldo = money(pick(linha, "saldo"))
        pago_col = money(pick(linha, "recebido" if receber else "pago"))
        pago = pago_col if pago_col else money(max(0.0, valor - saldo))
        historico = texto(pick(linha, "historico"))
        documento = texto(pick(linha, "numerodocumento"))
        descricao = " — ".join(parte for parte in (nome, documento, historico) if parte) or nome or "Conta importada"
        papel = "cliente" if receber else "fornecedor"
        contato_id = garantir_contato(cur, nome, papel, por_nome) if nome else None
        registro = (
            contato_id,
            descricao,
            valor,
            data_sql(pick(linha, "datavencimento")),
            data_sql(pick(linha, "dataliquidacao")) if pago else None,
            status_financeiro(pick(linha, "situacao"), valor, pago, receber),
            pago,
            valor,
            clip(pick(linha, "categoria"), 80),
            f"bling:{bling}",
        )
        if bling in existentes:
            atualizar.append(registro + (existentes[bling],))
        else:
            novos.append(registro)
            existentes[bling] = None
    if receber:
        cols = "cliente_id, descricao, valor, vencimento, data_recebimento, status, valor_pago, valor_original, categoria, origem_ids"
        upd_data = "data_recebimento=%s"
    else:
        cols = "fornecedor_id, observacao, valor, vencimento, data_pagamento, status, valor_pago, valor_original, categoria, origem_ids"
        upd_data = "data_pagamento=%s"
    executar_lotes(cur, f"INSERT INTO {tabela} ({cols}) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", novos, f"{tabela} novos")
    executar_lotes(cur, f"""
        UPDATE {tabela} SET
            {cols.split(',')[0]}=%s, {('descricao' if receber else 'observacao')}=%s, valor=%s, vencimento=%s,
            {upd_data}, status=%s, valor_pago=%s, valor_original=%s, categoria=%s, origem_ids=%s
        WHERE id=%s
    """, atualizar, f"{tabela} atualizados")
    cur.connection.commit()
    print(f"  {tabela}: {len(novos)} novos, {len(atualizar)} atualizados", flush=True)
    return {"novos": len(novos), "atualizados": len(atualizar)}


def importar_caixa(cur) -> dict:
    print("Caixa", flush=True)
    cur.execute("SELECT referencia_id FROM caixa WHERE origem='BLING' AND referencia_id IS NOT NULL")
    existentes = {int(ident) for (ident,) in cur.fetchall() if ident}
    novos = []
    for linha in ler_grupo("caixa_bancos"):
        ident = inteiro(pick(linha, "id"))
        if ident and ident in existentes:
            continue
        tipo_bruto = texto(pick(linha, "tipo")).upper()
        valor = money(pick(linha, "valor"))
        tipo = "SAIDA" if tipo_bruto in ("D", "S", "SAIDA") or valor < 0 else "ENTRADA"
        historico = texto(pick(linha, "historico"))
        contato = texto(pick(linha, "contato"))
        documento = texto(pick(linha, "ndodocumento"))
        descricao = " | ".join(parte for parte in (historico, contato, documento) if parte) or "Movimento de caixa"
        data = data_sql(pick(linha, "data"))
        novos.append((
            tipo,
            descricao,
            abs(valor),
            "BLING",
            ident,
            f"{data} 12:00:00" if data else None,
            clip(pick(linha, "categoria"), 80),
        ))
        if ident:
            existentes.add(ident)
    executar_lotes(cur, """
        INSERT INTO caixa (tipo, descricao, valor, origem, referencia_id, data_movimento, categoria)
        VALUES (%s,%s,%s,%s,%s,%s,%s)
    """, novos, "caixa")
    cur.connection.commit()
    print(f"  caixa: {len(novos)} novos", flush=True)
    return {"novos": len(novos), "atualizados": 0}


def importar_propostas(cur, por_tiny) -> dict:
    print("Propostas", flush=True)
    agrupadas = {}
    for linha in ler_grupo("propostas"):
        numero = texto(pick(linha, "numerodaproposta")) or texto(pick(linha, "id"))
        if not numero:
            continue
        proposta = agrupadas.get(numero)
        if proposta is None:
            proposta = {
                "numero": numero[:20],
                "contato": inteiro(pick(linha, "idcontato")),
                "cliente": texto(pick(linha, "nomedocontato")),
                "data": data_sql(pick(linha, "data")),
                "situacao": texto(pick(linha, "situacao")),
                "obs": texto(pick(linha, "observacoes")),
                "itens": [],
                "total": 0.0,
            }
            agrupadas[numero] = proposta
        descricao = texto(pick(linha, "descricao"))
        if descricao:
            qtd = money(pick(linha, "quantidade")) or 1
            preco = money(pick(linha, "valorunitario"))
            proposta["total"] += qtd * preco
            proposta["itens"].append(f"{qtd:g} x {descricao} ({preco:.2f})")
    cur.execute("SELECT id, numero FROM orcamentos")
    existentes = {texto(numero): ident for ident, numero in cur.fetchall() if texto(numero)}
    novos = []
    atualizar = []
    for proposta in agrupadas.values():
        obs = "\n".join(parte for parte in (proposta["cliente"], proposta["obs"], *proposta["itens"][:30]) if parte).strip()
        registro = (
            proposta["numero"],
            por_tiny.get(proposta["contato"]) if proposta["contato"] else None,
            money(proposta["total"]),
            obs or None,
            clip(proposta["situacao"], 30) or "Em aberto",
            f"{proposta['data']} 12:00:00" if proposta["data"] else None,
        )
        if proposta["numero"] in existentes:
            atualizar.append(registro + (existentes[proposta["numero"]],))
        else:
            novos.append(registro)
    executar_lotes(cur, """
        INSERT INTO orcamentos (numero, cliente_id, valor, observacoes, status, data_orcamento)
        VALUES (%s,%s,%s,%s,%s,%s)
    """, novos, "propostas novas")
    executar_lotes(cur, """
        UPDATE orcamentos SET numero=%s, cliente_id=%s, valor=%s, observacoes=%s, status=%s, data_orcamento=%s
        WHERE id=%s
    """, atualizar, "propostas atualizadas")
    cur.connection.commit()
    print(f"  propostas: {len(novos)} novas, {len(atualizar)} atualizadas", flush=True)
    return {"novos": len(novos), "atualizados": len(atualizar)}


def importar_compras(cur) -> dict:
    print("Pedidos de compra", flush=True)
    agrupados = {}
    for linha in ler_grupo("pedidos_compra"):
        ident = texto(pick(linha, "id"))
        if not ident:
            continue
        pedido = agrupados.get(ident)
        if pedido is None:
            pedido = {
                "id": ident,
                "contato": inteiro(pick(linha, "idcontato")),
                "data": data_sql(pick(linha, "data")),
                "situacao": texto(pick(linha, "situacao")),
                "obs": texto(pick(linha, "observacoes")),
                "itens": [],
            }
            agrupados[ident] = pedido
        descricao = texto(pick(linha, "descricao"))
        qtd = money(pick(linha, "quantidade"))
        preco = money(pick(linha, "valorunitario"))
        if descricao or qtd or preco:
            pedido["itens"].append((descricao or "Item", qtd, preco, money(qtd * preco)))
    cur.execute("SELECT id, observacao FROM ordens_compra WHERE observacao LIKE 'bling:%%'")
    existentes = {}
    for ident, obs in cur.fetchall():
        token = texto(obs).split("|", 1)[0].replace("bling:", "").strip()
        if token:
            existentes[token] = ident
    novos_meta = []
    atualizar = []
    for pedido in agrupados.values():
        total = money(sum(item[3] for item in pedido["itens"]))
        obs = f"bling:{pedido['id']}|contato:{pedido['contato'] or ''}|{pedido['obs']}"
        registro = (None, f"{pedido['data']} 12:00:00" if pedido["data"] else None, clip(pedido["situacao"], 30), obs, total)
        if pedido["id"] in existentes:
            atualizar.append(registro + (existentes[pedido["id"]],))
        else:
            novos_meta.append((pedido, registro))
    if novos_meta:
        cur.executemany("""
            INSERT INTO ordens_compra (fornecedor_id, data_emissao, status, observacao, valor_total)
            VALUES (%s,%s,%s,%s,%s)
        """, [registro for _, registro in novos_meta])
    executar_lotes(cur, """
        UPDATE ordens_compra SET fornecedor_id=%s, data_emissao=%s, status=%s, observacao=%s, valor_total=%s
        WHERE id=%s
    """, atualizar, "compras atualizadas")
    cur.connection.commit()
    cur.execute("SELECT id, observacao FROM ordens_compra WHERE observacao LIKE 'bling:%%'")
    ids = {}
    for ident, obs in cur.fetchall():
        token = texto(obs).split("|", 1)[0].replace("bling:", "").strip()
        if token:
            ids[token] = ident
    alvos = list(ids.values())
    if alvos:
        marcadores = ",".join(["%s"] * len(alvos))
        cur.execute(f"DELETE FROM ordem_compra_itens WHERE ordem_id IN ({marcadores})", alvos)
    itens_sql = []
    for pedido in agrupados.values():
        ordem_id = ids.get(pedido["id"])
        if not ordem_id:
            continue
        for descricao, qtd, preco, total in pedido["itens"]:
            itens_sql.append((ordem_id, None, qtd, preco, total))
    executar_lotes(cur, """
        INSERT INTO ordem_compra_itens (ordem_id, produto_id, quantidade, valor_unitario, valor_total)
        VALUES (%s,%s,%s,%s,%s)
    """, itens_sql, "itens de compra")
    cur.connection.commit()
    print(f"  compras: {len(novos_meta)} novas, {len(atualizar)} atualizadas", flush=True)
    return {"novos": len(novos_meta), "atualizados": len(atualizar)}


def main():
    if not BASE.is_dir():
        print(f"Pasta não encontrada: {BASE}")
        sys.exit(1)
    conn = conectar()
    try:
        with conn.cursor() as cur:
            antes = {nome: contar(cur, nome) for nome in (
                "clientes", "produtos", "pedidos_venda", "pedidos_venda_itens",
                "ordens_servico", "contas_receber", "contas_pagar", "caixa", "orcamentos", "ordens_compra"
            )}
            print("Antes:", antes, flush=True)
            resumo = {}
            resumo["contatos"], por_tiny_contato, por_nome_contato = importar_contatos(cur)
            por_tiny, por_nome = mapa_clientes(cur)
            resumo["produtos"] = importar_produtos(cur)
            skus = mapa_sku(cur)
            resumo["pedidos"] = importar_pedidos(cur, por_tiny, skus)
            resumo["os"] = importar_os(cur, por_tiny_contato, por_nome_contato)
            resumo["receber"] = importar_contas(cur, "contas_receber", "contas_receber", True, por_nome_contato)
            resumo["pagar"] = importar_contas(cur, "contas_pagar", "contas_pagar", False, por_nome_contato)
            resumo["caixa"] = importar_caixa(cur)
            resumo["propostas"] = importar_propostas(cur, por_tiny)
            resumo["compras"] = importar_compras(cur)
            depois = {nome: contar(cur, nome) for nome in antes}
            print("RESUMO", json.dumps({"antes": antes, "depois": depois, "carga": resumo}, ensure_ascii=False), flush=True)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
