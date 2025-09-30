export default () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    issuer: process.env.JWT_ISS || 'dvcc-app',
    audience: process.env.JWT_AUD || 'dvcc-users',
  },

  // Database
  database: {
    url: process.env.DATABASE_URL,
  },

  // AWS Configuration
  aws: {
    region: process.env.AWS_REGION || 'us-west-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3BucketName: process.env.AWS_S3_BUCKET_NAME,
  },

  // Email Configuration
  email: {
    fromEmail: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Twilio SMS Configuration
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
  },

  // App Configuration
  app: {
    name: process.env.APP_NAME || 'DVCC',
    nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
});
