from PIL import Image
from pathlib import Path

lista = Image.open(r"C:\Users\Administrador\.cursor\projects\c-Projetos-ERP-TemDeTudo\assets\c__Users_Administrador_AppData_Roaming_Cursor_User_workspaceStorage_f76d4a72ccc77f0a25577ebadf2c9e88_images_image-ee5033b1-0f5c-4b35-8228-9205cdcb70f3.jpg")
out = Path(r"C:\Projetos\ERP-TemDeTudo\frontend\public\images\moveis")
x0, y1, y2 = 178, 252, 462
pw, ph, gap = 149, 70, 10
for i in range(5):
    x = x0 + i * (pw + gap)
    lista.crop((x, y1, x + pw, y1 + ph)).save(out / f"movel-0{i + 1}.jpg", quality=92)
for i in range(3):
    x = x0 + i * (pw + gap)
    lista.crop((x, y2, x + pw, y2 + ph)).save(out / f"movel-0{i + 6}.jpg", quality=92)
lista.crop((x0 + 3 * (pw + gap), y1, x0 + 4 * (pw + gap), y1 + ph)).save(out / "movel-09.jpg", quality=92)
lista.crop((x0 + 4 * (pw + gap), y1, x0 + 5 * (pw + gap), y1 + ph)).save(out / "movel-10.jpg", quality=92)
lista.crop((x0 + 1 * (pw + gap), y2, x0 + 2 * (pw + gap), y2 + ph)).save(out / "movel-11.jpg", quality=92)
lista.crop((x0 + 2 * (pw + gap), y2, x0 + 3 * (pw + gap), y2 + ph)).save(out / "movel-12.jpg", quality=92)
print("ok")
