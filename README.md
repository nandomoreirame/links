# links

Página de links (estilo linktree) de Fernando Moreira: redes, canal, artigos e currículo. HTML e CSS estáticos, sem build, com um script mínimo para o efeito do mouse, no tema Terminal Noir.

## Rodar

```bash
npm run dev    # http://localhost:4173
npm test       # valida estrutura, links, acessibilidade e paleta
```

## Terminal: `curl | sh`

Um cartão de visita para quem vive no terminal, vindo do mesmo repositório:

```bash
curl -fsSL links.nandomoreira.dev/about | sh                  # imprime o cartão
curl -fsSL links.nandomoreira.dev/about | sh -s -- --open     # abre os links no browser
```

O script é o [`about.sh`](about.sh), POSIX sh, servido em `/about` como texto puro: abra `links.nandomoreira.dev/about` no browser para ler antes de rodar. Flags: `--open`, `-n/--dry-run`, `--lang pt|en` (padrão pelo `LANG`), `--no-color`, `-h`, `-V`. Os links dele precisam ser os mesmos de `index.html`; o teste `tests/about.test.mjs` confere.

## Editar

O cartão do comando fica no fim de `index.html` e `en/index.html` (o botão Copiar é revelado pelo `city.js`). Os links ficam em `index.html` (uma `<li>` cada). A versão em inglês é `en/index.html` (servida em `/en/`): mantenha os dois arquivos com os mesmos destinos, e o teste `tests/i18n.test.mjs` confere isso. As cores são variáveis em `style.css`.

## Segurança

Publique a pasta como site estático (Firebase Hosting, Caddy). A página não coleta dados, carrega só um script local de 30 linhas (o brilho que segue o mouse) e nenhum recurso de terceiros; links externos usam `rel="noopener noreferrer"`.

### O script `about.sh`

- Não faz chamada de rede, não grava arquivo e não pergunta nada; só imprime e, com `--open`, chama `xdg-open`, `open` ou `wslview` uma vez por link.
- Sem `--open` nada abre. `--open --dry-run` lista as URLs sem abrir.
- Sem `eval`, sem `sudo`, sem baixar outro script. Use `curl -fsSL` (falha em erro HTTP) e leia o arquivo antes de rodar, se quiser.
- Saída sem cor quando não é um terminal, com `NO_COLOR` ou `--no-color`.
