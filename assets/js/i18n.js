// Wruop · textos gerados por JavaScript, por idioma.
// O conteúdo da página está no HTML. Para uma versão em inglês: copie index.html para /en/index.html,
// traduza o texto, defina <html lang="en"> e adicione os hreflang. Este arquivo já escolhe o idioma pelo lang.
(() => {
  const STRINGS = {
    "pt-BR": {
      menuOpen: "Menu",
      menuClose: "Fechar",
      pending: "<strong>Canais de contato em configuração.</strong> O formulário ainda não envia mensagens. Assim que o e-mail da Wruop estiver ativo, ele aparece aqui.",
      mailOnly: "O botão abre o seu app de e-mail com a mensagem pronta para a Wruop.",
      channelEmail: "E-mail",
      channelWhatsapp: "WhatsApp",
      submit: "Enviar mensagem",
      submitMail: "Abrir no meu e-mail",
      sending: "Enviando…",
      sent: "Mensagem recebida. Vamos responder no e-mail que você informou.",
      mailOpened: "Seu app de e-mail deve abrir com a mensagem pronta. Se nada abrir, escreva para {email}.",
      failed: "Não conseguimos enviar agora. Verifique sua conexão e tente de novo.",
      failedWithEmail: "Não conseguimos enviar agora. Tente de novo ou escreva para {email}.",
      errRequired: "Preencha este campo.",
      errEmail: "Confira o e-mail. Ele precisa ter o formato nome@dominio.com.",
      errShort: "Conte um pouco mais, pelo menos uma frase.",
      mailSubject: "Projeto: {tipo}",
      mailBody: "Nome: {nome}\nE-mail: {email}\nTipo de projeto: {tipo}\n\n{mensagem}",
    },
  };
  const lang = document.documentElement.lang in STRINGS ? document.documentElement.lang : "pt-BR";
  const dict = STRINGS[lang];
  window.wruopT = (key, vars) =>
    (dict[key] || STRINGS["pt-BR"][key] || key).replace(/\{(\w+)\}/g, (_, k) => (vars && k in vars ? vars[k] : ""));
})();
