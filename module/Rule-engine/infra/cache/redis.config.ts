import {createClient} from "redis"

const redisClient = createClient({
    url: process.env.REDIS_URL 
})
redisClient.on('connect',() =>{
    console.log("redis conectado com sucesso ");
    
})
redisClient.on('error',(err)=>{
    console.log(`não foi possivel conectar ao redis : ${err}`);
    
})
export {redisClient}