import type { Dictionary } from "./en";

// Português do Brasil. Mesmo formato do en.ts; o TypeScript acusa qualquer chave faltando.
const ptBr: Dictionary = {
  meta: {
    title: "Weider · Desenvolvedor web para correções, landing pages e pequenas aplicações",
    description:
      "Desenvolvedor independente. Correções de sites, landing pages, pequenas aplicações web, frontend criativo e protótipos de jogos em Godot e Blender.",
    ogAlt: "W. — logo de Weider com gato e marcas de garra",
  },
  a11y: {
    skip: "Pular para o conteúdo",
    home: "Weider, início",
    primaryNav: "Principal",
    language: "Idioma",
    switchTo: "Mudar o idioma para inglês",
    openMenu: "Abrir menu",
    closeMenu: "Fechar menu",
    newTab: "abre em nova aba",
  },
  nav: {
    services: "Serviços",
    work: "Projetos",
    lab: "Lab",
    about: "Sobre",
    contact: "Contato",
  },
  hero: {
    eyebrow: "Weider · desenvolvedor independente",
    title: "Feito para funcionar. Criado para surpreender.",
    lead:
      "Corrijo interfaces quebradas, crio landing pages e pequenas aplicações web e transformo ideias interativas em protótipos, do CSS responsivo ao Godot.",
    ctaPrimary: "Conheça meus projetos",
    ctaSecondary: "Vamos conversar sobre seu projeto",
    stageLabel: "Gato de partículas",
    stageStatus: "Versão 3D interativa em desenvolvimento",
    stageAlt: "A logo W.: um W desenhado com marcas de garra e a cabeça de um gato, em marfim com bordas laranja.",
  },
  services: {
    kicker: "Serviços e habilidades",
    title: "O que posso construir para você.",
    items: [
      {
        name: "Correções de interface",
        points: ["Ajustes de layout responsivo", "Correções de CSS", "Navegação quebrada", "Pequenos bugs de JavaScript"],
      },
      {
        name: "Landing pages",
        points: ["Sites responsivos para empresas", "Páginas de produtos e serviços", "Formulários e seções interativas"],
      },
      {
        name: "Pequenas aplicações web",
        points: ["Ferramentas de busca", "Filtros", "Painéis", "Utilitários internos"],
      },
      {
        name: "Frontend criativo",
        points: ["Sistemas visuais interativos", "Animações sob medida", "Experiências em tempo real"],
      },
      {
        name: "Protótipos de jogos",
        points: ["Godot", "Mecânicas de jogo", "Modelos no Blender", "Protótipos interativos"],
      },
    ],
    stackLabel: "Ferramentas que uso",
  },
  work: {
    kicker: "Projetos em destaque",
    title: "Demonstrações que funcionam, com status honesto.",
    intro:
      "Três demonstrações feitas para mostrar os serviços que ofereço. Usam dados fictícios e serão lançadas uma de cada vez, cada uma com seu estudo de caso.",
    stackLabel: "Tecnologias",
    statusLabel: "Status",
    problemLabel: "Problema",
    status: { building: "Em desenvolvimento", planned: "Planejado", live: "No ar" },
    projects: [
      {
        id: "interface-repair-lab",
        name: "Interface Repair Lab",
        kind: "Correções de interface",
        summary:
          "Um laboratório de antes e depois com layouts quebrados e suas correções: transbordamento, contraste, navegação e bugs de interação, vistos no computador, tablet e celular.",
        problem: "O cliente vê a página quebrada, mas não sabe o que está errado nem quanto custa corrigir.",
        status: "building",
      },
      {
        id: "fieldline-parts",
        name: "Fieldline Parts",
        kind: "Landing page",
        summary:
          "Uma landing page para uma empresa fictícia de peças agrícolas: produtos, serviços, formulário de contato com validação e navegação acessível.",
        problem: "Uma pequena empresa precisa de uma página clara e rápida que transforme visitas em pedidos de orçamento.",
        status: "planned",
      },
      {
        id: "parts-finder",
        name: "Parts Finder",
        kind: "Pequena aplicação web",
        summary:
          "Um catálogo de peças com busca por nome e código, filtros, ordenação, disponibilidade e estados claros para lista vazia e erro.",
        problem: "A equipe perde tempo procurando a peça certa em planilhas.",
        status: "planned",
      },
    ],
  },
  lab: {
    kicker: "Laboratório criativo",
    title: "Experimentos que provam a técnica.",
    intro: "Peças pequenas e autorais. Cada uma mostra uma habilidade específica, explicada em uma linha.",
    experiments: [
      {
        name: "Gravity · Experimento 001",
        what:
          "Milhares de partículas num canvas 2D com física em passo fixo: um pato no skate que se desfaz ao bater, se reconstrói, cai com gravidade e reage ao cursor.",
        tags: ["Canvas 2D", "Física", "Controle de desempenho"],
        cta: "Abrir o experimento",
        imageAlt: "Um pato feito de partículas andando de skate sobre fundo escuro.",
      },
    ],
  },
  icf: {
    kicker: "Projeto pessoal de jogo — Em desenvolvimento",
    title: "ICF: Justa Causa",
    body:
      "Um jogo 3D que estou criando por conta própria, com a jogabilidade no Godot e os modelos no Blender. Iracir é um dos personagens.",
    tech: ["Godot", "Blender"],
    nextLabel: "Em breve nesta página",
    next: ["Um visualizador 3D interativo de Iracir", "Uma minidemo jogável no navegador"],
  },
  about: {
    kicker: "Sobre",
    title: "Das operações comerciais ao software.",
    body: [
      "Sou Weider, desenvolvedor independente no Brasil. Venho de operações comerciais e gestão de vendas, então começo pelo problema do negócio: o que a página ou a ferramenta precisa alcançar, para quem e até quando.",
      "Construo software prático e sigo aprendendo. No lado criativo, exploro gráficos em tempo real, partículas e protótipos de jogos no Godot e no Blender.",
    ],
    strengthsLabel: "Como trabalho",
    strengths: ["Comunicação clara", "Entregas organizadas", "Visão de processos de negócio", "Desenvolvimento prático", "Aprendizado contínuo"],
  },
  contact: {
    kicker: "Contato",
    title: "Vamos conversar sobre seu projeto.",
    body: "Conte o que está quebrado ou o que você precisa construir. Respondo em português ou inglês.",
    pending: "Os canais de contato estão sendo configurados. Eles aparecerão aqui em breve.",
    upworkNote:
      "Me encontrou na Upwork? Vamos manter a conversa na própria Upwork até o contrato começar, como a plataforma exige.",
    github: "GitHub",
    upwork: "Perfil na Upwork",
    email: "E-mail",
  },
  footer: {
    rights: "Weider. Feito com Next.js e TypeScript.",
    top: "Voltar ao topo",
  },
};

export default ptBr;
