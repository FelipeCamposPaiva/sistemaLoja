@echo off
setlocal
set "PATH=C:\Program Files\nodejs;C:\Windows\System32;C:\Windows;%PATH%"
cd /d C:\Projetos\ERP-TemDeTudo\frontend
echo START %DATE% %TIME% > C:\Projetos\ERP-TemDeTudo\ops\vite-dev.log
where node >> C:\Projetos\ERP-TemDeTudo\ops\vite-dev.log 2>&1
where npm >> C:\Projetos\ERP-TemDeTudo\ops\vite-dev.log 2>&1
call npm run dev >> C:\Projetos\ERP-TemDeTudo\ops\vite-dev.log 2>&1
