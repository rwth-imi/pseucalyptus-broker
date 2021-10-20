import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableVersioning();

  const config = new DocumentBuilder()
    .setTitle('Pseucalyptus Broker API')
    .setDescription('Data brokerage')
    .setVersion('0.0.1')
    .addApiKey(
      { type: 'apiKey', in: 'header', name: 'x-client-id' },
      'Client-ID',
    )
    .addApiKey(
      { type: 'apiKey', in: 'header', name: 'x-client-domain' },
      'Client-Domain',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(3000);
}

bootstrap();
