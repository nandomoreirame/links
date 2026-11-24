# links

Página de links (estilo linktree) de Fernando Moreira: redes, canal, artigos e currículo. HTML e CSS estáticos, sem build, com um script mínimo para o efeito do mouse, no tema Terminal Noir.

## Rodar

```bash
npm run dev    # http://localhost:4173
npm test       # valida estrutura, links, acessibilidade e paleta
```

## Terminal: `curl | sh`

Os links no terminal, vindos do mesmo repositório:

```bash
curl -fsSL links.nandomoreira.dev | sh                  # imprime os links
curl -fsSL links.nandomoreira.dev | sh -s -- --open     # abre os links no browser
```

O script é o [`about.sh`](about.sh), POSIX sh. Flags: `--open`, `-n/--dry-run`, `--lang pt|en` (padrão pelo `LANG`), `--no-color`, `-h`, `-V`. Os links dele precisam ser os mesmos de `index.html`; o teste `tests/about.test.mjs` confere.

### Como a home vira script

O Firebase Hosting não decide pela requisição, então quem escolhe é a borda (Cloudflare). Uma regra de Transform, URL Rewrite, reescreve `/` para `/about` quando o cliente não pede HTML (o curl manda `Accept: */*`, o navegador manda `text/html`):

```
Quando:  http.host eq "links.nandomoreira.dev" and http.request.uri.path eq "/"
         and not any(http.request.headers["accept"][*] contains "text/html")
Então:   Rewrite path para /about   (estático)
```

`/about` continua servindo o script como texto puro (`firebase.json`: rewrite para `about.sh`, `Content-Type: text/plain`), então dá para ler o fonte no navegador. Sem a regra, `curl links.nandomoreira.dev | sh` tenta executar o HTML e falha; o comando `curl -fsSL links.nandomoreira.dev/about | sh` funciona sempre.

## Editar

O card do comando fica no fim de `index.html` e `en/index.html` (o botão Copiar é revelado pelo `city.js`). Os links ficam em `index.html` (uma `<li>` cada). A versão em inglês é `en/index.html` (servida em `/en/`): mantenha os dois arquivos com os mesmos destinos, e o teste `tests/i18n.test.mjs` confere isso. As cores são variáveis em `style.css`.

## Segurança

Publique a pasta como site estático (Firebase Hosting, Caddy). A página não coleta dados, carrega só um script local de 30 linhas (o brilho que segue o mouse) e nenhum recurso de terceiros; links externos usam `rel="noopener noreferrer"`.

### O script `about.sh`

- Não faz chamada de rede, não grava arquivo e não pergunta nada; só imprime e, com `--open`, chama `xdg-open`, `open` ou `wslview` uma vez por link.
- Sem `--open` nada abre. `--open --dry-run` lista as URLs sem abrir.
- Sem `eval`, sem `sudo`, sem baixar outro script. Use `curl -fsSL` (falha em erro HTTP) e leia o arquivo antes de rodar, se quiser.
- Saída sem cor quando não é um terminal, com `NO_COLOR` ou `--no-color`.
