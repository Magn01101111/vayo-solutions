export const environment = {
  production: true,
  apiUrl: 'https://vayo-solutions-backend.onrender.com/api',
  siteUrl: 'https://vayo-solutions.onrender.com',
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
