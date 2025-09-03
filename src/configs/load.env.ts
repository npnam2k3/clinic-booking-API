export default () => ({
  app: {
    port: process.env.PORT,
  },
  database: {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT
      ? parseInt(process.env.DATABASE_PORT, 10)
      : 3306,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    type: process.env.DATABASE_TYPE || 'mysql',
    name: process.env.DATABASE_NAME,
  },
  client_url: process.env.CLIENT_URL,
});
