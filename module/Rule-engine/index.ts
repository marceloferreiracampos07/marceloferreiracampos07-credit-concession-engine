import 'dotenv/config'; 
import { redisClient } from './infra/cache/redis.config.js';
import express from 'express'; 

const app = express(); 


const PORT = Number(process.env.PORT); 

async function bootstrap() {
  try {
    
    await redisClient.connect();
    
    
    app.listen(PORT, () => {
      console.log(` Servidor HTTP rodando com sucesso na porta ${PORT}`);
    });
    
  } catch (error) {
    console.error('Falha ao iniciar a aplicação:', error);
    process.exit(1);
  }
}

bootstrap();