#!/bin/bash
set -e

GIT_EMAIL="Homelab@lucafchala.com"
GIT_NAME="Luca"

cd ~/t-embed-cc1101-suite

git config --global user.email "$GIT_EMAIL"
git config --global user.name "$GIT_NAME"

echo "== Removendo conteúdo vendorizado (Matt's feedback) =="
git rm -r Launcher/*.bin 2>/dev/null || echo "  (nenhum .bin encontrado em Launcher/, ok se já não existir)"
git rm -r Bibliotecas_Dev 2>/dev/null || echo "  (Bibliotecas_Dev já não existe)"
git rm -r Documentacao 2>/dev/null || echo "  (Documentacao já não existe)"
git rm -r Drivers_Windows 2>/dev/null || echo "  (Drivers_Windows já não existe)"
git rm -r Ferramentas_Flash 2>/dev/null || echo "  (Ferramentas_Flash já não existe)"

echo "== Commit e push (READMEs devem ser editados separadamente - ver mensagem anterior) =="
git add -A
git commit -m "v2: remover conteudo vendorizado (Launcher bin, libs, docs, drivers, esptool)"
git push

echo "== Feito. Pendente: editar README.md/README.en.md, remover wifi_portals/ e Bruce-Scripts-Heaven_BAD/ =="
