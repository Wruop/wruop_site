# Wruop Gravity · Experiment 001

Experiência interativa da Wruop publicada em [w-3f.com](https://w-3f.com) enquanto o site principal está em construção. Um pato feito de partículas caminha pelo centro da tela; com um botão, as partículas viram a logo da Wruop. Elas reagem ao cursor e ao toque, caem com gravidade, explodem e se reconstroem.

HTML, CSS e JavaScript puro, com Canvas 2D. Sem build, sem dependências, sem backend.

## Estrutura

```
index.html              página única do experimento
assets/css/lab.css      layout em tela cheia, interface, selo de construção, responsivo
assets/js/gravity.js    partículas, física, modos, entrada e controle de desempenho
assets/fonts/           Sora (títulos) e Inter (interface), hospedadas no próprio site
assets/brand/           logos e ícone da Wruop; wruop-logo-white.svg também é a fonte da forma WRUOP W
CNAME                   domínio personalizado do GitHub Pages (w-3f.com)
.nojekyll               serve os arquivos como estão
```

`assets/css/site.css` e `assets/js/site.js` pertencem à versão institucional anterior e não são carregados pelo experimento.

## Como funciona

- **Formas.** Cada forma é desenhada num canvas fora da tela e seus pixels são amostrados numa grade com leve variação, sempre com exatamente o mesmo número de pontos que há partículas:
  - *Pato* (padrão): silhueta vetorial desenhada em código, com olho e asa recortados. O corpo e as duas pernas são amostrados como partes separadas; a cada passo da física o pato anda de um lado para o outro do centro, gira ao mudar de direção, balança e alterna as pernas em torno do quadril.
  - *WRUOP W*: os caminhos do arquivo oficial `assets/brand/wruop-logo-white.svg`, lidos com `fetch` e desenhados com `Path2D`. Sem o arquivo (por exemplo, abrindo direto do disco), o botão fica desativado.
- **Física.** Cada partícula tem posição, velocidade e aceleração, guardadas em `Float32Array`. A simulação roda em **passo fixo de 1/120 s** com acumulador: um monitor de 60 Hz executa dois passos por quadro, um de 120 Hz executa um, e o movimento é o mesmo. Intervalos acima de 0,1 s são limitados, então uma travada ou volta de aba não causa saltos.
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
- **Movimento reduzido.** Com `prefers-reduced-motion`, o pato fica parado, a forma não respira, a explosão é suave, a montagem é imediata e o loop dorme quando tudo para.
- **Acessibilidade.** Os controles são botões com `aria-pressed` e foco visível; mudanças de modo são anunciadas por uma região `aria-live`; o canvas é decorativo e a página traz o título e uma descrição em texto.

## Rodar localmente

Qualquer servidor estático na raiz do projeto. Por exemplo:

```bash
npx -y http-server@14.1.1 . -p 5173 -c-1
```

Abra http://localhost:5173. Para ver os números internos (partículas, orçamento, cortes, modo e forma) no console, use http://localhost:5173/?debug e consulte `wruopGravity`.

## Como validar

1. Ao abrir, a poeira se reúne e forma o pato, que começa a caminhar; o selo "Site em construção" aparece no canto superior direito e os textos ficam no canto inferior esquerdo.
2. Passe o cursor sobre o pato: as partículas se afastam e voltam.
3. **Gravity** (ou G): tudo cai e se acumula acima dos controles.
4. **Chaos** (ou C): explosão em direções e velocidades diferentes.
5. **Reconstruct** (ou R): a forma atual se recompõe.
6. **WRUOP W** (ou W): as partículas formam a logo; de novo, voltam ao pato.
7. O botão do modo ativo fica aceso e sublinhado.
8. No celular: toque e arraste sobre as partículas.

## Publicar

O GitHub Pages publica a branch `main`, na raiz, com o domínio do arquivo `CNAME`. Para publicar este experimento, faça o merge de `feature/wruop-gravity` em `main` e envie. O Pages atualiza em 1 ou 2 minutos.

```bash
git switch main
git merge --no-ff feature/wruop-gravity
git push origin main
```

Ao mudar CSS ou JS, aumente o número de versão em `index.html` (`?v=3`, `?v=4`…) para os navegadores baixarem os arquivos novos.

## Versão institucional anterior

Preservada na branch `backup/institucional-2026-10-30` e na tag `institucional-v1` (commit `f5aadc5`). Para voltar a ela:

```bash
git switch main
git reset --hard institucional-v1
git push --force-with-lease origin main
```
