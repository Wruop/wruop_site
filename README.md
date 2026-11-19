# Weider · W. — portfólio pessoal

Portfólio bilíngue (inglês e português do Brasil) de Weider, desenvolvedor independente. Publicado em [w-3f.com](https://w-3f.com) pelo GitHub Pages.

Next.js (App Router) + TypeScript + CSS Modules, exportado como site estático. Sem backend e sem serviços pagos.

## Estado

| Sprint | Conteúdo | Situação |
|---|---|---|
| 01 Foundation | Identidade, header, idiomas, hero comercial, 7 seções, navegação, contato, layout responsivo | Pronto: build no PC ok; 37 testes passando em desktop, tablet e celular (19/11/2026) |
| 02 Interface Repair Lab | Comparador antes/depois | Próxima |
| 03 Particle Cat | Gato 3D de partículas com Chaos, Gravity e Reset | Planejada |
| 04 Commercial Projects | Fieldline Parts, Parts Finder | Planejada |
| 05 ICF | Visualizador de Iracir e minidemo | Planejada |
| 06 Polish & Release | Testes finais, SEO, publicação | Planejada |

O site no ar (`main`) continua sendo o Wruop Gravity até a aprovação deste portfólio.

## Rodar no computador

Precisa de Node.js 20 ou mais novo.

```bash
npm install
npm run dev          # http://localhost:3000/en/
```

## Build e testes

```bash
npm run build                    # gera o site estático em out/
npx playwright install chromium  # uma vez só
npm test                         # testes em desktop, tablet e celular
npm start                        # serve out/ em http://localhost:4173, como o GitHub Pages
```

Os testes ficam em `tests/` e cobrem idiomas (URL, `lang`, título, descrição, `hreflang`, troca sem recarregar, persistência, botão voltar), links, as 7 seções, status honesto dos projetos, contato pendente, teclado, menu móvel, transbordamento horizontal, movimento reduzido e erros no console. As capturas vão para `test-results/shots/`.

## Estrutura

```
src/app/[lang]/layout.tsx   html lang, metadados, hreflang e fontes por idioma
src/app/[lang]/page.tsx     a home: header + 7 seções + rodapé
src/app/globals.css         tokens de design (cores, tipos, espaçamento, movimento)
src/i18n/                   en.ts e pt-br.ts (mesmo formato, conferido pelo TypeScript) e config
src/components/             cada seção com seu CSS Module; LocaleProvider troca o idioma
src/content/site.ts         dados reais: contatos, stack, URL do site
public/index.html           a raiz /: manda para /en/ ou para o idioma salvo
public/lab/gravity/         Wruop Gravity · Experiment 001, preservado como experimento do Lab
public/brand/               logo oficial sem fundo, favicons e imagem de compartilhamento
assets/brand/               imagem original da logo, como foi aprovada
scripts/serve-out.mjs       servidor estático dos testes, sem dependências
docs/                       documentação do experimento Gravity
```

## Idiomas

- Inglês é o padrão para quem chega pela primeira vez. A escolha fica salva no navegador (`weider.locale`).
- Cada idioma tem sua URL (`/en/`, `/pt-br/`), com título, descrição, `lang` e `hreflang` próprios.
- Trocar de idioma não recarrega a página: o texto muda no lugar e a URL é trocada pelo History API. Assim, a cena 3D da Sprint 03 não reinicia.
- Para um novo idioma: crie `src/i18n/<codigo>.ts` no formato de `en.ts`, adicione o código em `src/i18n/config.ts` e em `src/i18n/index.ts`.

## Contatos

Edite `src/content/site.ts`. Cada canal (`github`, `upwork`, `email`) só aparece quando recebe um valor real. Enquanto todos estão vazios, a seção mostra o aviso "being set up" e nenhum botão.

## Publicar (Sprint 06)

O Next.js precisa de build, então a publicação passa a usar o GitHub Actions: em Settings › Pages, a fonte muda de "Deploy from a branch" para "GitHub Actions", com um workflow que roda `npm ci && npm run build` e publica `out/`. O domínio continua em `public/CNAME`. Isso só será feito quando você aprovar a troca.

## O que foi preservado

- `main`: Wruop Gravity · Experiment 001, ainda no ar.
- `claude/project-thread-u2hvyn`: Site V1 da Wruop.
- `backup/institucional-2026-10-30`, `backup/gravity-experiment-2026-11-12` e a tag `institucional-v1`.
