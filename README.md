# links

Página de links (estilo linktree) de Fernando Moreira: redes, canal, artigos e currículo. HTML e CSS estáticos, sem build, com um script mínimo para o efeito do mouse, no tema Terminal Noir.

## Rodar

```bash
npm run dev    # http://localhost:4173
npm test       # valida estrutura, links, acessibilidade e paleta
```

## Editar

Os links ficam em `index.html` (uma `<li>` cada). A versão em inglês é `en/index.html` (servida em `/en/`): mantenha os dois arquivos com os mesmos destinos, e o teste `tests/i18n.test.mjs` confere isso. As cores são variáveis em `style.css`.

## Segurança

Publique a pasta como site estático (Firebase Hosting, Caddy). A página não coleta dados, carrega só um script local de 30 linhas (o brilho que segue o mouse) e nenhum recurso de terceiros; links externos usam `rel="noopener noreferrer"`.
