#!/usr/bin/env bash
# setup-myst.sh
# Setup interaktif node Mysterium (MystNodes) untuk Ubuntu/Debian.
# Mengemas langkah yang terverifikasi jalan di VPS Ubuntu 20.04 pada 23 Okt 2026:
# install node resmi, kunci rentang port UDP, restart service, verifikasi lokal.
#
# Cara pakai:
#   sudo bash setup-myst.sh
#   curl -fsSL <url-script-ini> | sudo bash
#
# Catatan penting dari pengalaman nyata (jangan diubah):
# - Rentang port WAJIB ditulis ke seksi [udp] di config-mainnet.toml.
#   JANGAN menaruh --udp.ports di SERVICE_OPTS /etc/default/mysterium-node:
#   flag itu global, sedangkan SERVICE_OPTS dibaca sesudah kata "service",
#   jadi daemon crash loop dengan error "flag provided but not defined".
# - Port di rentang itu tidak diikat saat idle; port baru diikat per kanal P2P.
#   Jadi "ss kosong di rentang itu" bukan tanda gagal. Bukti yang sah:
#   nilai udp.ports di API /config dan status layanan Running.
#
# Aman dijalankan ulang: install dilewati bila myst sudah terpasang,
# konfigurasi dicadangkan dulu, dan seksi [udp] ditulis ulang, tidak digandakan.

set -euo pipefail

NODE_API="http://127.0.0.1:4050"
CONF_FILE="/etc/mysterium-node/config-mainnet.toml"
INSTALL_URL="https://raw.githubusercontent.com/mysteriumnetwork/node/master/install.sh"

say()  { printf '%s\n' "$*"; }
info() { printf '[..] %s\n' "$*"; }
ok()   { printf '[OK] %s\n' "$*"; }
warn() { printf '[!] %s\n' "$*"; }
die()  { printf '[X] %s\n' "$*" >&2; exit 1; }

# Baca jawaban dari /dev/tty, bukan stdin, supaya prompt tetap jalan
# walau script dialirkan lewat pipe (curl | bash). Tanpa tty, pakai bawaan.
ask() {
  local q="$1" def="$2" ans=""
  if [ -r /dev/tty ]; then
    printf '%s [%s]: ' "$q" "$def" > /dev/tty
    read -r ans < /dev/tty || ans=""
  fi
  printf '%s' "${ans:-$def}"
}

ask_yn() {
  local q="$1" def="$2" ans=""
  if [ -r /dev/tty ]; then
    printf '%s (y/n) [%s]: ' "$q" "$def" > /dev/tty
    read -r ans < /dev/tty || ans=""
  fi
  case "$(printf '%s' "${ans:-$def}" | tr '[:upper:]' '[:lower:]')" in
    y|ya|yes) return 0 ;;
    *) return 1 ;;
  esac
}

is_port() {
  case "$1" in
    ''|*[!0-9]*) return 1 ;;
    *) [ "$1" -ge 1 ] && [ "$1" -le 65535 ] ;;
  esac
}

# --- Hak akses -------------------------------------------------------------
if [ "$(id -u)" -ne 0 ]; then
  if [ -f "$0" ]; then
    exec sudo -E bash "$0" "$@"
  fi
  die "Jalankan dengan sudo: curl -fsSL <url-script-ini> | sudo bash"
fi

say "=============================================================="
say " Setup Node Mysterium (MystNodes) - interaktif"
say "=============================================================="

# --- Pertanyaan ------------------------------------------------------------
PORT_START="$(ask 'Port UDP awal' '20492')"
PORT_END="$(ask 'Port UDP akhir' '20500')"
is_port "$PORT_START" || die "Port awal tidak sah: $PORT_START"
is_port "$PORT_END"   || die "Port akhir tidak sah: $PORT_END"
[ "$PORT_START" -le "$PORT_END" ] || die "Port awal harus <= port akhir."

DO_UPGRADE=0
if ask_yn 'Jalankan apt upgrade juga (lebih lama)?' 'n'; then
  DO_UPGRADE=1
fi

say ""
say "Ringkasan:"
say "  Rentang port UDP node : ${PORT_START}:${PORT_END}"
say "  apt upgrade           : $([ "$DO_UPGRADE" = 1 ] && echo ya || echo tidak)"
say "  Firewall ufw          : SSH + UDP ${PORT_START}:${PORT_END} dibuka bila ufw ada"
say "  Konfigurasi           : seksi [udp] di $CONF_FILE (dicadangkan dulu)"
say ""
ask_yn 'Lanjut?' 'y' || die "Dibatalkan."

# --- Sistem dan dependensi -------------------------------------------------
export DEBIAN_FRONTEND=noninteractive
info "apt update..."
apt-get update -y
if [ "$DO_UPGRADE" = 1 ]; then
  info "apt upgrade..."
  apt-get upgrade -y
fi
apt-get install -y curl software-properties-common python3
ok "Sistem siap."

# --- Firewall mesin ----------------------------------------------------------
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH >/dev/null 2>&1 || true
  ufw allow "${PORT_START}:${PORT_END}/udp" >/dev/null 2>&1 || true
  ufw --force enable >/dev/null 2>&1 || true
  ok "ufw: OpenSSH dan UDP ${PORT_START}:${PORT_END} dibuka."
else
  warn "ufw tidak ditemukan, langkah firewall mesin dilewati."
fi
warn "Jangan lupa: rentang UDP yang sama juga harus diteruskan di lapisan"
warn "di depan mesin ini (panel firewall VPS atau router), dari sisi penyedia."

# --- Install node ------------------------------------------------------------
if command -v myst >/dev/null 2>&1; then
  ok "myst sudah terpasang ($(myst --version 2>/dev/null | head -n1 || echo '?')), install dilewati."
else
  info "Mengunduh installer resmi Mysterium..."
  TMP_INST="$(mktemp /tmp/myst-install.XXXXXX.sh)"
  curl -fsSL "$INSTALL_URL" -o "$TMP_INST"
  info "Menjalankan installer..."
  bash "$TMP_INST"
  rm -f "$TMP_INST"
  command -v myst >/dev/null 2>&1 || die "Install selesai tapi perintah myst tidak ditemukan."
  ok "Node terpasang."
fi

# --- Kunci rentang port lewat file konfigurasi -------------------------------
[ -f "$CONF_FILE" ] || die "File konfigurasi tidak ditemukan: $CONF_FILE"
BAK="${CONF_FILE}.bak-$(date +%Y%m%d%H%M%S)"
cp "$CONF_FILE" "$BAK"
info "Cadangan konfigurasi: $BAK"

# Buang seksi [udp] lama bila ada, agar tabel tidak ganda (TOML menolaknya).
awk '
  /^\[udp\][[:space:]]*$/ { skip = 1; next }
  /^\[/                  { skip = 0 }
  !skip                  { print }
' "$CONF_FILE" > "${CONF_FILE}.tmp" && mv "${CONF_FILE}.tmp" "$CONF_FILE"

printf '\n[udp]\n  ports = "%s:%s"\n' "$PORT_START" "$PORT_END" >> "$CONF_FILE"
ok "Seksi [udp] ditulis: ports = \"${PORT_START}:${PORT_END}\""

# --- Restart dan verifikasi ----------------------------------------------------
systemctl enable mysterium-node >/dev/null 2>&1 || true
info "Restart mysterium-node..."
systemctl restart mysterium-node

info "Menunggu healthcheck (maks 60 detik)..."
HEALTHY=0
for _ in $(seq 1 30); do
  if curl -fsS "${NODE_API}/healthcheck" >/dev/null 2>&1; then
    HEALTHY=1
    break
  fi
  sleep 2
done
[ "$HEALTHY" = 1 ] || die "Node tidak sehat. Periksa: journalctl -u mysterium-node -n 50"
ok "Healthcheck OK: $(curl -s "${NODE_API}/healthcheck")"

GOT="$(curl -s "${NODE_API}/config" | grep -o '"udp":{"ports":"[^"]*"}' || true)"
case "$GOT" in
  *"${PORT_START}:${PORT_END}"*) ok "API /config membuktikan rentang termuat: $GOT" ;;
  *) die "Rentang belum termuat di API /config (terbaca: ${GOT:-kosong}). Periksa $CONF_FILE" ;;
esac

IDENT="$(curl -s "${NODE_API}/identities" | grep -oE '0x[0-9a-fA-F]{40}' | head -n1 || true)"
RUNNING="$(curl -s "${NODE_API}/services" | grep -o '"status":"Running"' | wc -l || true)"
say ""
say "Identitas provider : ${IDENT:-belum terbaca}"
say "Layanan Running    : ${RUNNING}"

# --- Catatan NAT -----------------------------------------------------------------
IFACE_IP="$(ip -4 addr show scope global 2>/dev/null | grep -oE 'inet [0-9.]+' | awk '{print $2}' | head -n1 || true)"
case "$IFACE_IP" in
  10.*|192.168.*|172.1[6-9].*|172.2[0-9].*|172.3[01].*)
    warn "IP antarmuka mesin ini privat (${IFACE_IP}): mesin berada di belakang NAT."
    warn "Tipe NAT kemungkinan mentok di Moderate; itu plafon NAT penyedia,"
    warn "bukan kesalahan setup. Open hanya lewat IP publik khusus / NAT 1:1"
    warn "dari penyedia, atau pindah ke VPS ber-IP publik langsung."
    ;;
esac

# --- Selesai ---------------------------------------------------------------------
say ""
say "=============================================================="
say " Selesai. Node berjalan sebagai service systemd dan tetap hidup"
say " walau SSH ditutup; juga menyala otomatis sesudah reboot."
say ""
say " Langkah berikutnya (sekali saja, lewat browser kamu):"
say " 1. Tunnel ke NodeUI:  ssh -L 4449:127.0.0.1:4449 <user>@<ip-server>"
say " 2. Buka http://localhost:4449, setujui syarat, isi alamat payout."
say " 3. Klaim node di my.mystnodes.com memakai API key dari NodeUI."
say " 4. Jalankan Test node dari dashboard. Status Online + sesi tes"
say "    yang masuk adalah bukti forwarding UDP ${PORT_START}:${PORT_END} tembus."
say "=============================================================="
