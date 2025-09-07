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
  jwt_access_token_secret: process.env.JWT_ACCESS_TOKEN_KEY,
  jwt_refresh_token_secret: process.env.JWT_REFRESH_TOKEN_KEY,

  mail_host: process.env.MAIL_HOST,
  mail_name: process.env.EMAIL_NAME,
  mail_pass: process.env.EMAIL_APP_PASSWORD,
  mail_from: process.env.MAIL_FROM,

  client_url: process.env.CLIENT_URL,
});
