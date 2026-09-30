# Convert Gestor empresa_14225 CSVs into compact JSON for the ERP frontend.
from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path

SRC = Path(r"d:\ITENS_AREA_TRABALHO\Downloads\exportacao\exportacoes\empresa_14225")
OUT = Path(r"C:\Projetos\ERP-TemDeTudo\frontend\public\data\gestor")


def open_csv(name: str):
    path = SRC / name
    raw = path.read_bytes()
    for enc in ("utf-8-sig", "cp1252", "latin-1"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            text = None
    if text is None:
        text = raw.decode("utf-8", errors="replace")
    return csv.DictReader(text.splitlines(), delimiter=";")


def num(val) -> float:
    try:
        return float(str(val or "0").replace(",", "."))
    except ValueError:
        return 0.0


def limpo(val) -> str:
    return str(val or "").strip().strip('"')


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    grupos = []
    for row in open_csv("grupos.csv"):
        nome = limpo(row.get("nome"))
        if not nome or set(nome) <= {".", " "}:
            continue
        if str(row.get("ativo")) not in ("1", "true", "True", ""):
            if str(row.get("ativo")) in ("-1", "0"):
                continue
        grupos.append({"id": limpo(row.get("id")), "nome": nome})

    marcas = []
    for row in open_csv("marcas.csv"):
        nome = limpo(row.get("nome")).lstrip("*").strip()
        if not nome or nome == ".":
            continue
        marcas.append({"id": limpo(row.get("id")), "nome": nome})

    formas = []
    for row in open_csv("forma_pagamento.csv"):
        if str(row.get("ativo")) in ("-1", "0"):
            continue
        nome = limpo(row.get("nome"))
        if not nome:
            continue
        pix = str(row.get("pix")) == "1"
        dinheiro = str(row.get("dinheiro")) == "1"
        formas.append({
            "id": limpo(row.get("id")),
            "nome": nome,
            "taxa": num(row.get("taxa")),
            "pix": pix,
            "dinheiro": dinheiro,
            "conta": limpo(row.get("contas_caixa_gerencial_nome"))
        })

    produtos = []
    for row in open_csv("produtos.csv"):
        nome = limpo(row.get("descricao"))
        if not nome:
            continue
        produtos.append({
            "id": limpo(row.get("id")),
            "sku": limpo(row.get("codigo_barras")),
            "gtin": limpo(row.get("codigo_barras")),
            "nome": nome,
            "unidade": limpo(row.get("unid")) or "UN",
            "custo": round(num(row.get("preco_compra")), 2),
            "preco": round(num(row.get("preco_venda")), 2),
            "preco2": round(num(row.get("preco_venda_2")), 2),
            "estoque": round(num(row.get("estoque")), 3),
            "grupo": limpo(row.get("grupo")),
            "fornecedor": limpo(row.get("fornecedor")),
            "marca": limpo(row.get("marca")).lstrip("*").strip()
        })

    clientes = []
    for row in open_csv("clientes.csv"):
        nome = limpo(row.get("nome"))
        if not nome or nome == ".":
            continue
        pessoa = limpo(row.get("pessoa")).upper()
        cpf = limpo(row.get("cpf"))
        cnpj = limpo(row.get("cnpj"))
        clientes.append({
            "id": int(num(row.get("id")) or 0),
            "nome": nome,
            "tipoPessoa": "juridica" if pessoa == "J" or (cnpj and len(cnpj) > 11) else "fisica",
            "cpfCnpj": cnpj or cpf,
            "celular": limpo(row.get("celular")),
            "telefone": limpo(row.get("telefone")),
            "email": limpo(row.get("email")),
            "cep": limpo(row.get("cep")),
            "endereco": limpo(row.get("endereco")),
            "bairro": limpo(row.get("bairro")),
            "municipio": limpo(row.get("cidade")) or "Volta Redonda",
            "uf": limpo(row.get("uf")) or "RJ",
            "complemento": limpo(row.get("complemento")),
            "nascimento": limpo(row.get("data_nascimento")),
            "limiteCredito": str(num(row.get("limite_credito_venda_aprazo"))),
            "tipos": ["cliente"],
            "ativo": True
        })

    fornecedores = []
    for row in open_csv("fornecedores.csv"):
        if str(row.get("ativo")) in ("0", "-1"):
            continue
        nome = limpo(row.get("nome")) or limpo(row.get("razao_social"))
        if not nome:
            continue
        fornecedores.append({
            "id": int(num(row.get("id")) or 0),
            "nome": nome,
            "fantasia": limpo(row.get("nome")),
            "tipoPessoa": "juridica",
            "cpfCnpj": limpo(row.get("cpf_cnpj")),
            "cep": limpo(row.get("cep")),
            "endereco": limpo(row.get("endereco")),
            "bairro": limpo(row.get("bairro")),
            "municipio": limpo(row.get("cidade")) or "",
            "uf": limpo(row.get("uf")) or "",
            "telefone": limpo(row.get("telefone")),
            "celular": limpo(row.get("celular")),
            "email": limpo(row.get("email")),
            "ie": limpo(row.get("inscricao_estadual")),
            "tipos": ["fornecedor"],
            "ativo": True
        })

    por_ano = defaultdict(lambda: {"qtd": 0, "total": 0.0})
    vendas_n = 0
    vendas_total = 0.0
    for row in open_csv("vendas.csv"):
        if str(row.get("ativo")) == "0":
            continue
        dt = limpo(row.get("datahora"))
        ano = dt[:4] if len(dt) >= 4 else "s/d"
        valor = num(row.get("valor_total"))
        por_ano[ano]["qtd"] += 1
        por_ano[ano]["total"] += valor
        vendas_n += 1
        vendas_total += valor

    resumo = {
        "empresa": "14225",
        "produtos": len(produtos),
        "clientes": len(clientes),
        "fornecedores": len(fornecedores),
        "grupos": len(grupos),
        "marcas": len(marcas),
        "formas": len(formas),
        "vendas": vendas_n,
        "faturamento": round(vendas_total, 2),
        "porAno": [
            {"ano": k, "qtd": v["qtd"], "total": round(v["total"], 2)}
            for k, v in sorted(por_ano.items())
        ]
    }

    def dump(name: str, data) -> None:
        dest = OUT / name
        dest.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(name, dest.stat().st_size, "bytes", len(data) if hasattr(data, "__len__") else "")

    dump("grupos.json", grupos)
    dump("marcas.json", marcas)
    dump("formas.json", formas)
    dump("produtos.json", produtos)
    dump("clientes.json", clientes)
    dump("fornecedores.json", fornecedores)
    dump("resumo.json", resumo)
    print("OK", resumo)


if __name__ == "__main__":
    main()
