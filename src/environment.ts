export const environment = {
  production: false,
  //apiUrl: 'http://localhost:3000/api',
  apiUrl: 'https://vayo-solutions-backend.onrender.com/api',
  siteUrl: 'http://localhost:4200',
  chatbot: {
    enabled: false,
    provider: 'botpress',
    scriptUrl: 'https://cdn.botpress.cloud/webchat/v3.2/inject.js',
    hostUrl: 'https://cdn.botpress.cloud/webchat/v3.2',
    messagingUrl: 'https://messaging.botpress.cloud',
    botId: '',
    clientId: '',
    useSessionStorage: true,
    configuration: {
      botName: 'Asistente VAYO',
      botDescription: 'Te ayudo con productos, stock y cotizaciones.',
      color: '#f59e0b',
      variant: 'solid',
      themeMode: 'light',
      radius: 4,
    },
  },
};
