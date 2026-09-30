import json
import shutil
import os

marcas_path = r"C:\Projetos\ERP-TemDeTudo\frontend\public\data\gestor\marcas.json"
marcas = json.load(open(marcas_path, encoding="utf-8"))
if not any(str(m.get("nome", "")).lower() == "natura" for m in marcas):
    marcas.append({"id": "natura", "nome": "Natura"})
    json.dump(marcas, open(marcas_path, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("marca Natura adicionada")
else:
    print("marca Natura ja existia")

src = r"d:\ITENS_AREA_TRABALHO\Downloads\31260871673990001904550010492420911208598360-nfe.xml"
dst_dir = r"C:\Projetos\ERP-TemDeTudo\frontend\public\data\nfe"
os.makedirs(dst_dir, exist_ok=True)
dst = os.path.join(dst_dir, os.path.basename(src))
shutil.copy2(src, dst)
print("xml copiado", dst, os.path.getsize(dst))
