from PIL import Image
from pathlib import Path

lista = Path(r"C:\Users\Administrador\.cursor\projects\c-Projetos-ERP-TemDeTudo\assets\c__Users_Administrador_AppData_Roaming_Cursor_User_workspaceStorage_f76d4a72ccc77f0a25577ebadf2c9e88_images_image-ee5033b1-0f5c-4b35-8228-9205cdcb70f3.jpg")
edit = Path(r"C:\Users\Administrador\.cursor\projects\c-Projetos-ERP-TemDeTudo\assets\c__Users_Administrador_AppData_Roaming_Cursor_User_workspaceStorage_f76d4a72ccc77f0a25577ebadf2c9e88_images_image-ece7fac9-8620-488d-937a-5cb50b880c76.jpg")
out = Path(r"C:\Projetos\ERP-TemDeTudo\frontend\public\images\moveis")
out.mkdir(parents=True, exist_ok=True)

for p in (lista, edit):
    im = Image.open(p)
    print(p.name, im.size, im.mode)
