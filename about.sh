#!/bin/sh
# about.sh: print Fernando Moreira's about-me card in the terminal.
# Source: https://github.com/nandomoreirame/links (file about.sh)
# Run:    curl -fsSL links.nandomoreira.dev | sh
# It makes no network call, writes no file and asks nothing.
# Links open in the browser only with: sh -s -- --open

VERSION="0.1.0"

usage() {
  cat <<'USAGE'
Usage: about [--open] [--dry-run] [--lang pt|en] [--no-color]

Print Fernando Moreira's about-me card. Opens nothing unless --open is given.

Options:
  --open         open every link in your browser
  -n, --dry-run  with --open, list the links instead of opening them
  --lang LANG    pt or en (default: from LC_ALL, LC_MESSAGES or LANG)
  --no-color     no ANSI colors (also: NO_COLOR, or output not a terminal)
  -h, --help     show this help
  -V, --version  show the version

Examples:
  curl -fsSL links.nandomoreira.dev | sh
  curl -fsSL links.nandomoreira.dev | sh -s -- --open
USAGE
}

fail_usage() {
  printf 'error: %s\n' "$1" >&2
  usage >&2
  exit 2
}

OPEN=0
DRY=0
LANG_CHOICE=""
COLOR=1

while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    -V|--version) printf 'about %s\n' "$VERSION"; exit 0 ;;
    --open) OPEN=1 ;;
    -n|--dry-run) DRY=1 ;;
    --no-color) COLOR=0 ;;
    --lang=*) LANG_CHOICE="${1#--lang=}" ;;
    --lang)
      [ $# -ge 2 ] || fail_usage "--lang needs a value (pt or en)"
      LANG_CHOICE="$2"
      shift
      ;;
    --) shift; break ;;
    -*) fail_usage "unknown option: $1" ;;
    *) fail_usage "unexpected argument: $1" ;;
  esac
  shift
done

if [ -n "$LANG_CHOICE" ]; then
  case "$LANG_CHOICE" in
    pt|en) L="$LANG_CHOICE" ;;
    *) fail_usage "invalid --lang value: $LANG_CHOICE (use pt or en)" ;;
  esac
else
  L=en
  for v in "$LC_ALL" "$LC_MESSAGES" "$LANG"; do
    if [ -n "$v" ]; then
      case "$v" in
        pt|pt_*|pt-*|pt.*) L=pt ;;
      esac
      break
    fi
  done
fi

if [ "$COLOR" = 1 ] && { [ ! -t 1 ] || [ -n "$NO_COLOR" ] || [ "$TERM" = dumb ]; }; then
  COLOR=0
fi
if [ "$COLOR" = 1 ]; then
  B=$(printf '\033[1m'); A=$(printf '\033[33m'); D=$(printf '\033[2m'); R=$(printf '\033[0m')
else
  B=""; A=""; D=""; R=""
fi

# label|url|hint (pt)|hint (en)
links() {
  cat <<'LINKS'
Sobre mim|https://nandomoreira.dev/sobre|quem sou e o que faço|who I am and what I do
Artigos|https://nandomoreira.dev/posts|blog|articles
YouTube|https://www.youtube.com/@nandomoreiradev|vídeos e lives|videos and livestreams
GitHub|https://github.com/nandomoreirame|código aberto|open source
/dev/null|https://dev-null.sh/@nandomoreirame|commits sem filtro|unfiltered commits
X|https://x.com/oseunando|notas curtas|short notes
Instagram|https://www.instagram.com/nandomoreira.dev|bastidores|behind the scenes
LinkedIn|https://www.linkedin.com/in/nandomoreirame/|carreira|career
Currículo|https://nandomoreira.dev/curriculo|ver online|view online
LINKS
}

card() {
  if [ "$L" = pt ]; then
    bio="Engenheiro de software em São Paulo. Ferramentas de código aberto, IA e Linux."
  else
    bio="Software engineer in São Paulo, Brazil. Open source tools, AI and Linux."
  fi
  printf '\n%sFernando Moreira%s\n%s%s%s\n\n' "$B" "$R" "$D" "$bio" "$R"
  links | while IFS='|' read -r label url hp he; do
    if [ "$L" = pt ]; then hint=$hp; else hint=$he; fi
    printf '  %s%-10s%s %s %s(%s)%s\n' "$A" "$label" "$R" "$url" "$D" "$hint" "$R"
  done
  printf '\n'
}

open_links() {
  opener=""
  for c in xdg-open open wslview; do
    if command -v "$c" >/dev/null 2>&1; then
      opener=$c
      break
    fi
  done
  if [ "$DRY" = 0 ] && [ -z "$opener" ]; then
    printf 'error: no browser opener found (tried xdg-open, open, wslview); open the links above by hand\n' >&2
    return 1
  fi
  links | while IFS='|' read -r label url hp he; do
    if [ "$DRY" = 1 ]; then
      printf 'would open: %s\n' "$url"
    else
      printf 'opening %s\n' "$label" >&2
      "$opener" "$url" >/dev/null 2>&1 || printf 'warning: could not open %s\n' "$url" >&2
    fi
  done
}

card
if [ "$OPEN" = 1 ]; then
  open_links || exit 1
fi
