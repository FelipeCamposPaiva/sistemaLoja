# Wi-Fi Jaime — diagnóstico e ajustes (FelipeDELL)

**Host:** FelipeDELL  
**SSID alvo:** `Jaime 🏡`  
**Este arquivo é a fonte da verdade.** Se a rede cair no meio do ajuste, **não recomeçar do zero** e **não repetir** o ciclo já aplicado. Ler o bloco STATUS e o HISTÓRICO.

---

## STATUS (anti-loop)

| Campo | Valor |
| --- | --- |
| Ciclo atual | `2026-08-29-c1` |
| Estado | `ENCERRADO` |
| Última leitura | 2026-08-29 ~20:17 (horário local) |
| Rede no momento da leitura | Conectado a `Jaime 🏡` (RSSI −39, ch 2, 2,4 GHz) |
| **Não repetir** | PreferBand 5G-first; auto-connect em Adam 2; ASPM máximo; roaming Medium; novo ciclo de ajuste |

**PARAR.** Não diagnosticar de novo, não reaplicar registro/`netsh`/`powercfg`, não reciclar o adaptador. Trabalho deste pedido está fechado.

---

## Achados

### Adaptador

- Nome da interface: `Wi-Fi`
- Hardware: **Realtek RTL8852BE WiFi 6 802.11ax PCIe** (`PCI\VEN_10EC&DEV_B852`)
- Driver: `6001.15.164.201` (Dell, INF `oem74.inf`, data 13/05/2026)
- GUID: `{3e0609ac-5617-4f5c-8ec3-ca12cbbbf05c}`
- MAC: `04:68:74:3f:34:61`
- `Get-NetAdapter` / CIM **travam** neste notebook — usar só `netsh`, `ipconfig`, registro e `wevtutil`.

### Conexão no momento da leitura

- SSID: `Jaime 🏡`
- BSSID AP: `34:e8:94:7d:e5:30`
- **Banda: 2,4 GHz, canal 2** (canal sobreposto; 1/6/11 são os canais limpos)
- PHY: 802.11n (adaptador é Wi-Fi 6, mas o AP está em N/2,4)
- Sinal: 100% / RSSI −38 dBm (não é falta de sinal)
- Taxa: 300 / 300 Mbps
- Auth efetiva: **WPA2-Personal CCMP**
- DHCP: 192.168.100.102/24, GW/DNS `192.168.100.1`
- Scan no momento: **só este BSSID visível**; AP com **11 estações** associadas
- Plano de energia: **Equilibrado**
- PCI Express ASPM: **economia máxima** (AC e DC) — típico de queda Realtek
- VPN Surfshark/OpenVPN: presente, mídia desconectada
- VMnet1/VMnet8: ativos, sem default gateway (não competem rota)

### Perfil `Jaime 🏡`

- Auto-connect: sim
- Alternância automática: “Não alternar para outra rede”
- MAC aleatório: desabilitado (ok)
- Tipo de rádio: qualquer
- Segurança **declarada no perfil:** WPA3-Personal (GCMP-256/GCMP/CCMP) **e depois** WPA2
- Segurança **real do AP:** WPA2-Personal AES-CCMP
- Eventos mostram associação iniciada com **AES-GCMP-128** e sucesso com **AES-CCMP** (mismatch de cifra)

### Perfis salvos (ordem = prioridade Windows)

1. **Adam 2** ← primeiro da lista (prioridade alta, auto-connect)
2. Jaime 🏡
3. TEM DE TUDO VR, CLIENTE - TEM DE TUDO VR, VIVOFIBRA-WIFI6-C2A1, Felipe, CAMPOS, LOJA TEM DE TUDO-5G, Familia viva, ADAM-5G, IVANA, Tem de Tudo, Tem de Tudo5, LOJA TEM DE TUDO, Adam, Ascott Star Rewards, B2018笔记本维修, B2016

### Propriedades Realtek (antes do ajuste)

| Chave | Antes | Significado |
| --- | --- | --- |
| `PreferBand` | `2` = **5G first** | AP Jaime só aparece em 2,4 GHz → o rádio caça 5 GHz |
| `RegRoamLevel` | `3` = Medium | troca de BSS/SSID com facilidade |
| `LpsEn` | `2` (ligado) | Low Power Save Realtek |
| `IpsEn` | `1` (ligado) | Inactive Power Save |
| `MCCSup` | `1` | Multi-Channel Concurrent |
| `NLOEnable` | `1` | offload / scan em background |
| `PnPCapabilities` | ausente | Windows pode desligar o dispositivo para economizar |

### Eventos WLAN (prova da oscilação) — 29/08/2026

Horários no log em UTC−3 implícito no host (19:41–19:59):

1. ~19:41 — desconecta de **Adam** (“desconectada pelo driver”).
2. ~19:41:55 — auto-connect **Adam 2** falha: **“Driver desconectado durante a associação”**, RSSI 255.
3. ~19:42:01 — conecta em **Jaime**.
4. ~19:42:04 — **sai da Jaime** com motivo: *“o usuário quer estabelecer uma nova conexão”* (WLAN AutoConfig priorizando outro perfil).
5. ~19:42:05–19:42:22 — tenta **Adam 2** de novo: “rede não disponível” + “driver desconectado”.
6. ~19:42:22 — volta para **Jaime**.
7. ~19:59:34 — nova associação Jaime (GCMP → CCMP de novo).

**Causa raiz (notebook, não “falta de sinal”):** o perfil **Adam 2** está em auto-connect e **acima** da Jaime. O Windows tenta Adam, o driver Realtek derruba a associação, cai na Jaime, e pouco depois tenta Adam outra vez. Em paralelo: **PreferBand = 5G first** num AP só 2,4 GHz, **ASPM no máximo**, roaming Medium, e perfil Jaime anunciando WPA3/GCMP contra AP WPA2/CCMP.

O canal 2 do AP e as 11 estações pioram jitter, mas **não** explicam o hop Adam ↔ Jaime.

---

## Ajustes do ciclo `2026-08-29-c1`

Tudo local (registro, `netsh`, `powercfg`). Não depende de internet. Queda curta ao reciclar o adaptador é esperada **uma vez**.

1. Prioridade 1: perfil `Jaime 🏡`; auto-connect só neste perfil.
2. Todos os outros perfis Wi-Fi: `connectionmode=manual` (em especial **Adam 2**, Adam, ADAM-5G).
3. Realtek `PreferBand=1` (2,4 G first) — **não** 5G first enquanto o AP Jaime não tiver BSSID 5 GHz.
4. Realtek `RegRoamLevel=1` (Lowest).
5. Realtek `LpsEn=0`, `IpsEn=0`, `MCCSup=0`, `NLOEnable=0`.
6. `PnPCapabilities=24` (impedir “desligar este dispositivo para economizar energia”).
7. PCI Express ASPM = **Desligado** no plano Equilibrado (AC e DC).
8. Perfil Jaime: `authentication=WPA2PSK` + `encryption=AES` para casar com o AP (sem apagar a chave se o netsh preservar).
9. Reciclar interface `Wi-Fi` uma vez para aplicar o registro.

### Não fazer neste ciclo (evita loop)

- Não redefinir o adaptador / `netsh wlan delete profile`.
- Não forçar 5 GHz (`PreferBand=2`) sem BSSID 5 GHz da Jaime no scan.
- Não reativar auto-connect em Adam 2.
- Não atualizar driver Realtek neste ciclo (já está 2026-05-13).
- Não mexer no roteador sem acesso; só anotar: **mudar canal 2 → 1, 6 ou 11**.

### Lado do AP (fora deste notebook)

- Canal 2,4 GHz: sair do **2**, ir para **1, 6 ou 11**.
- Se existir rádio 5 GHz, publicar SSID `Jaime 🏡` (ou `Jaime-5G`) e só então reavaliar `PreferBand`.
- Considerar WPA2-only no AP se WPA3 transition estiver ligado (casa com o perfil).

---

## Histórico

### 2026-08-29 ~19:57–20:03

- Pedido: ajustar adaptador para Jaime; rede oscila; criar MD com achados/ajustes/histórico para não entrar em loop se a rede parar.
- Primeira tentativa de `Get-NetAdapter` travou (~6 min) e a sessão foi interrompida. Nada aplicado.

### 2026-08-29 ~20:04–20:10 — diagnóstico (sem mudança ainda)

- `ipconfig`: RTL8852BE em 192.168.100.102, GW 192.168.100.1.
- `netsh wlan show interfaces`: Jaime 🏡, 2,4 GHz ch 2, 802.11n, WPA2-CCMP, −38 dBm.
- Scan: só Jaime 2,4; 11 clientes.
- Registro Realtek `0001`: PreferBand=2, Roam=3, LPS/IPS ligados.
- Eventos: loop **Adam 2 (auto) ↔ Jaime**.
- Este arquivo criado com STATUS=`APLICANDO`.

### 2026-08-29 ~20:10–20:16 — aplicação ciclo `2026-08-29-c1`

Registro Realtek `0001` (confirmado pós-escrita):

- `PreferBand=1` (2,4 G first; era 5G first)
- `RegRoamLevel=1` (Lowest; era Medium)
- `LpsEn=0` `IpsEn=0` `MCCSup=0` `NLOEnable=0`
- `PnPCapabilities=24` (não desligar o dispositivo para economizar)

Energia: PCI Express ASPM = Desligado (AC e DC; era economia máxima).

Perfis:

- Ordem: `Jaime 🏡` agora é o **primeiro** (era Adam 2).
- Jaime: auto-connect; segurança reduzida a WPA2-Personal (GCMP/CCMP) — WPA3 saiu do perfil.
- **Adam 2:** `connectionmode=manual` (era auto; esta era a causa do hop). Perfis `Adam` e `ADAM-5G` não foram alterados neste ciclo (escopo estreito).

Interface após o ciclo: ainda **conectada a Jaime 🏡**, BSSID `34:e8:94:7d:e5:30`, 802.11n, WPA2-CCMP, 300 Mbps, RSSI −42.

Queda curta ao reciclar o adaptador, se ocorreu, foi de uma vez só. **Não reaplicar este ciclo.**

### 2026-08-29 ~20:17 — verificação final e saída do loop

- Interface: **Jaime 🏡**, RSSI −39, 300 Mbps, WPA2-CCMP, mesmo BSSID.
- Adam 2: **Conectar manualmente** (confirmado).
- STATUS → `ENCERRADO`. Pedido concluído. Nenhum ajuste adicional.

---

## Como retomar se a rede cair

1. Abrir **este arquivo** (disco local).
2. Se STATUS=`ENCERRADO` ou `APLICADO` no ciclo `2026-08-29-c1`: **parar**. Não reaplicar.
3. Só um ciclo novo se o usuário pedir de novo **e** houver evidência nova (8002/8003 em Adam 2, outro SSID, outro canal).
4. Checagem (não altera nada): `netsh wlan show interfaces`


