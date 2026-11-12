// Wruop · configuração do site.
// Os canais de contato vivem só aqui. Preencha quando estiverem prontos; o site se adapta sozinho.
//
// email         Endereço que recebe contatos. Ex.: "contato@w-3f.com"
//               Sem formEndpoint, o formulário abre o app de e-mail do visitante com a mensagem pronta.
// whatsapp      Número com DDI e DDD, só dígitos. Ex.: "5511999999999". Vira um link wa.me.
// formEndpoint  URL que recebe POST do formulário (Formspree, Basin, Getform ou backend próprio).
//               Deve aceitar FormData e responder 2xx quando a mensagem for recebida.
//               Só com resposta 2xx o site mostra "mensagem enviada".
window.WRUOP_CONFIG = {
  contact: {
    email: "",
    whatsapp: "",
    formEndpoint: "",
  },
};
