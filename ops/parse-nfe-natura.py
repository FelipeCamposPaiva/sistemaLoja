import json
import os
import xml.etree.ElementTree as ET

PATH = r"d:\ITENS_AREA_TRABALHO\Downloads\31260871673990001904550010492420911208598360-nfe.xml"
NS = {"n": "http://www.portalfiscal.inf.br/nfe"}
OUT = r"C:\Projetos\ERP-TemDeTudo\frontend\public\data\gestor\natura-nfe.json"


def t(el, name):
    if el is None:
        return ""
    n = el.find(f"n:{name}", NS)
    return (n.text or "").strip() if n is not None else ""


def grupo_de(nome, ncm):
    n = (nome or "").upper()
    if "REVISTA" in n or "REV ESP" in n or "GUIA" in n or "CARTA " in n:
        return "PAPELARIA"
    if "SACOLA" in n or "CAIXA DE PRESENTE" in n:
        return "PRESENTE"
    if "SAB " in n or "SABBAR" in n or ncm.startswith("3401"):
        return "UTILIDADES"
    return "MAQUIAGEM"


print("size", os.path.getsize(PATH))
tree = ET.parse(PATH)
root = tree.getroot()
inf = root.find(".//n:infNFe", NS)
emit = inf.find("n:emit", NS)
ide = inf.find("n:ide", NS)
dest = inf.find("n:dest", NS)
tot = inf.find("n:total/n:ICMSTot", NS)
prot = root.find(".//n:infProt", NS)
print("chave", inf.get("Id"))
print("nNF", t(ide, "nNF"), "serie", t(ide, "serie"), "dhEmi", t(ide, "dhEmi"))
print("emit", t(emit, "xNome"), t(emit, "CNPJ"), t(emit.find("n:enderEmit", NS), "UF"))
print("dest", t(dest, "xNome"), t(dest, "CPF") or t(dest, "CNPJ"))
print("vNF", t(tot, "vNF"), "vProd", t(tot, "vProd"), "vST", t(tot, "vST"))
print("natOp", t(ide, "natOp"))
print("prot", t(prot, "cStat"), t(prot, "xMotivo"))

agg = {}
for det in inf.findall("n:det", NS):
    prod = det.find("n:prod", NS)
    ean = t(prod, "cEAN")
    cprod = t(prod, "cProd").lstrip("0") or t(prod, "cProd")
    q = float(t(prod, "qCom") or 0)
    vprod = float(t(prod, "vProd") or 0)
    vitem_el = det.find("n:vItem", NS)
    vitem = float(vitem_el.text) if vitem_el is not None and vitem_el.text else vprod
    key = ean if ean not in ("", "SEM GTIN") else cprod
    if key not in agg:
        nome = t(prod, "xProd")
        ncm = t(prod, "NCM")
        agg[key] = {
            "id": f"nfe-{cprod}",
            "sku": cprod,
            "gtin": ean if ean not in ("", "SEM GTIN") else "",
            "codigoFornecedor": cprod,
            "fornecedor": "Natura Cosméticos S/A",
            "nome": nome,
            "unidade": t(prod, "uCom") or "UN",
            "ncm": ncm,
            "cest": t(prod, "CEST"),
            "grupo": grupo_de(nome, ncm),
            "categoria": grupo_de(nome, ncm),
            "marca": "Natura",
            "preco": 0,
            "custo": 0,
            "estoque": 0,
            "ativo": True,
            "tipo": "simples",
            "qtd": 0.0,
            "custo_total": 0.0,
        }
    a = agg[key]
    a["qtd"] += q
    a["custo_total"] += vitem

produtos = []
for p in sorted(agg.values(), key=lambda x: x["nome"]):
    qtd = p.pop("qtd")
    total = p.pop("custo_total")
    p["estoque"] = int(round(qtd))
    p["custo"] = round(total / qtd, 2) if qtd else 0
    produtos.append(p)
    print(f"{p['estoque']:5d}  {p['gtin'] or '-':14s}  {p['sku']:10s}  {p['ncm']}  R${p['custo']:8.2f}  {p['nome'][:55]}")

os.makedirs(os.path.dirname(OUT), exist_ok=True)
payload = {
    "chave": (inf.get("Id") or "").replace("NFe", ""),
    "numero": t(ide, "nNF"),
    "serie": t(ide, "serie"),
    "dataEmissao": (t(ide, "dhEmi") or "")[:10],
    "remetente": t(emit, "xNome"),
    "cnpj": t(emit, "CNPJ"),
    "uf": t(emit.find("n:enderEmit", NS), "UF"),
    "valor": float(t(tot, "vNF") or 0),
    "natureza": t(ide, "natOp"),
    "pedido": t(inf.find("n:det/n:prod", NS), "xPed"),
    "produtos": produtos,
}
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

gestor_path = r"C:\Projetos\ERP-TemDeTudo\frontend\public\data\gestor\produtos.json"
gestor = json.load(open(gestor_path, encoding="utf-8"))
ids = [int(x["id"]) for x in gestor if str(x.get("id", "")).isdigit()]
print("unicos", len(produtos), "gestor", len(gestor), "max id", max(ids) if ids else 0)
eans = {str(p.get("gtin") or "") for p in gestor}
hit = [p["gtin"] for p in produtos if p["gtin"] and p["gtin"] in eans]
print("ean overlap", hit)
print("wrote", OUT)
