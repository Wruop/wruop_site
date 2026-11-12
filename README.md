# Wruop · site institucional V1

Site da Wruop em [w-3f.com](https://w-3f.com): estúdio criativo independente de design, desenvolvimento e experiências digitais. Ideias em Movimento.

HTML, CSS e JavaScript puro. Sem build, sem dependências, sem backend. Publicado pelo GitHub Pages a partir da branch `main`.

## Estrutura

```
index.html                  homepage: hero com partículas, projetos, serviços, processo, sobre, contato
assets/css/site.css         tokens (cores, tipos, grade, movimento) e componentes da homepage
assets/js/config.js         canais de contato (e-mail, WhatsApp, endpoint do formulário)  ← configurar
assets/js/i18n.js           textos gerados por JavaScript, por idioma
assets/js/field.js          campo de partículas do hero (o W da logo), derivado do Wruop Gravity
assets/js/site.js           barra, menu no celular, seção atual e formulário de contato
assets/work/                imagens reais dos projetos (capturas de tela, com origem em .json)
lab/gravity/index.html      Wruop Gravity · Experiment 001, o experimento que antes ocupava a home
assets/css/lab.css          estilos do experimento
assets/js/gravity.js        física e modos do experimento
assets/brand/               logos oficiais
assets/fonts/               Sora e Inter, hospedadas no próprio site
```

## Contato: configuração pendente

Nenhum canal está configurado ainda. Enquanto isso, a seção de contato mostra o aviso "Canais de contato em configuração" e o formulário fica desativado: nada finge que foi enviado.

Abra `assets/js/config.js` e preencha:

- `email`: aparece como link na seção de contato. Sem `formEndpoint`, o botão do formulário abre o app de e-mail do visitante com a mensagem pronta.
- `whatsapp`: número só com dígitos, com DDI e DDD (ex.: `5511999999999`). Vira um link wa.me.
- `formEndpoint`: URL que recebe POST com FormData (Formspree, Basin, Getform ou backend próprio). O site só mostra "Mensagem recebida" quando o endpoint responde 2xx; em erro, mostra o problema e o e-mail como alternativa.

Depois de editar, aumente o `?v=` dos arquivos em `index.html` para os navegadores baixarem a versão nova.

## Projetos

Cada projeto é um `<li class="project">` em `index.html`, com imagem em `assets/work/` (versões 800 e 1600 px, `.webp`) e status `status--done` (Concluído), `status--prototype` (Protótipo) ou `status--concept` (Conceito). Só entram projetos reais. Para alternar o lado da imagem, use `project--flip`.

## Tradução para inglês

Todo o conteúdo está no HTML; os textos gerados por JavaScript estão em `assets/js/i18n.js`, escolhidos pelo `lang` da página. Para uma versão em inglês: copie `index.html` para `en/index.html`, ajuste os caminhos (`../assets/`), traduza, defina `<html lang="en">`, adicione `"en"` em `i18n.js` e os `<link rel="alternate" hreflang>` nas duas páginas.

## Rodar localmente

```bash
npx -y http-server@14.1.1 . -p 5173 -c-1
```

Abra http://localhost:5173. Com `?debug`, o console expõe `wruopField` (homepage) e `wruopGravity` (lab).

## Publicar

Publicar = fazer merge em `main` (o GitHub Pages atualiza em 1 ou 2 minutos). Só com autorização.

## Pontos de restauração

- Experimento Gravity como home: branch `backup/gravity-experiment-2026-11-12` e tag `gravity-experiment-001` (commit `9cc3356`).
- Primeira versão institucional: branch `backup/institucional-2026-10-30` e tag `institucional-v1` (commit `f5aadc5`).

---

# Wruop Gravity · Experiment 001 (lab/gravity/)

Experiência interativa da Wruop, em [w-3f.com/lab/gravity/](https://w-3f.com/lab/gravity/). Foi a home do domínio enquanto o site estava em construção. Um pato feito de partículas anda de skate de uma borda à outra, se desfaz ao bater na parede e se reconstrói virado para o outro lado; com um botão, as partículas viram a logo da Wruop. Elas reagem ao cursor e ao toque, caem com gravidade, explodem e se reconstroem.

HTML, CSS e JavaScript puro, com Canvas 2D. Sem build, sem dependências, sem backend.

## Como funciona

- **Formas.** Cada forma é desenhada num canvas fora da tela e seus pixels são amostrados uma única vez numa grade com leve variação, mais uma faixa mais densa ao longo do contorno. Cada partícula guarda o mesmo ponto da figura até a próxima mudança de tamanho da tela, o que evita tremores.
  - *Pato no skate* (padrão): silhueta vetorial desenhada em código, em pose fixa (asa levantada, olho e asa recortados, pés sobre o shape). As duas rodas são amostradas como partes separadas, com aro, cubo e três raios, e giram em torno do próprio eixo.  - *WRUOP W*: os caminhos do arquivo oficial `assets/brand/wruop-logo-white.svg` (caminho no atributo `data-logo` do canvas), lidos com `fetch` e desenhados com `Path2D`. Sem o arquivo (por exemplo, abrindo direto do disco), o botão fica desativado.
- **Física.** Cada partícula tem posição, velocidade e aceleração, guardadas em `Float32Array`. A simulação roda em **passo fixo de 1/120 s** com acumulador: um monitor de 60 Hz executa dois passos por quadro, um de 120 Hz executa um, e o movimento é o mesmo. Intervalos acima de 0,1 s são limitados, então uma travada ou volta de aba não causa saltos.
- **Skate e colisões.** Uma máquina de estados controla o percurso: `ride` → `impact` → `rebuild` → `ride`.
  - *ride*: o conjunto desliza a uma velocidade proporcional à largura da tela (70 a 140 px/s). As rodas giram com `ω = v / r`. As partículas do corpo amortecem em relação ao movimento do skate, então a figura fica nítida; cerca de 8% de grãos soltos ficam presos a uma mola fraca e formam o rastro.
  - *impact*: quando a extremidade da figura alcança o limite calculado pela largura real do conjunto, ele bate na parede. Cada partícula mantém o impulso em direção à parede, e as mais próximas do ponto de impacto recebem um rebote para dentro, mais forte quanto mais perto. As paredes da tela devolvem quem ainda chega até elas.
  - *rebuild*: depois de 0,5 s, os alvos passam a ser a figura espelhada (escala horizontal −1, sem achatamento) encostada na parede, e a mola reconstrói o conjunto em onda. Concluída a reconstrução, ele volta a deslizar no sentido oposto, e as rodas giram no sentido certo.
  - As colisões só acontecem enquanto o pato está na tela e nenhum outro modo está ativo. Qualquer comando encerra uma colisão em andamento. Se a janela mudar de tamanho durante o impacto, os limites e os alvos são recalculados e a reconstrução continua.
- **Modos.**
  - *Reconstruct* (inicial): uma mola com amortecimento puxa cada partícula para seu lugar na forma escolhida (pato ou logo), com atraso escalonado para a forma se montar em onda. Parada, ela "respira" em duas ondas lentas.
  - *Gravity*: gravidade, atrito do ar, chão logo acima dos controles e paredes com perda de energia. As partículas colidem entre si (grade espacial), formando um monte.
  - *Chaos*: impulso aleatório a partir do centro da forma; a nuvem flutua numa corrente suave sem se recompor.
- **Interação.** O cursor ou o dedo repele as partículas num raio proporcional à tela, com força que cresce perto do centro. Clique ou toque gera uma onda radial. Atalhos de teclado: **G**, **C**, **R** e **W**. O botão **WRUOP W** alterna entre a logo e o pato.
- **Desempenho.**
  - Quantidade inicial por aparelho: até 3.000 partículas no computador e 1.100 no celular, menos com pouca memória ou poucos núcleos.
  - Resolução do canvas limitada a 2× (1,5× no celular).
  - Desenho em três lotes, um por tom, sem sombras.
  - O loop para com a aba oculta.
  - Um controlador reduz as partículas em 25% só depois de **3 segundos seguidos** de sobrecarga, com 6 s de espera entre cortes, no máximo 4 cortes e sem nunca aumentar de volta, para a densidade não oscilar.
- **Movimento reduzido.** Com `prefers-reduced-motion`, o pato fica parado no centro, sem colisões, a forma não respira, a explosão é suave, a montagem é imediata e o loop dorme quando tudo para.
- **Acessibilidade.** Os controles são botões com `aria-pressed` e foco visível; mudanças de modo são anunciadas por uma região `aria-live`; o canvas é decorativo e a página traz o título e uma descrição em texto.

## Como validar o experimento

1. Ao abrir, a poeira se reúne e forma o pato no skate, que começa a deslizar com as rodas girando; o selo "Site da Wruop · Lab" no canto superior direito leva de volta à home.
2. Na borda, o conjunto bate, se desfaz, ricocheteia e se reconstrói virado para o outro lado; o ciclo se repete na outra borda.
3. Passe o cursor sobre o pato: as partículas se afastam e voltam.
4. **Gravity** (ou G): tudo cai e se acumula acima dos controles.
5. **Chaos** (ou C): explosão em direções e velocidades diferentes.
6. **Reconstruct** (ou R): a forma atual se recompõe.
7. **WRUOP W** (ou W): as partículas formam a logo; de novo, voltam ao pato.
8. O botão do modo ativo fica aceso e sublinhado.
9. No celular: toque e arraste sobre as partículas.
