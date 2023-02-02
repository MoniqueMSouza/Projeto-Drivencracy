import express from "express";
import cors from "cors";
import chalk from "chalk"
import { MongoClient } from "mongodb";
import dotenv from 'dotenv'


dotenv.config()

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

try {
  mongoClient.connect()
  db = mongoClient.db();
  console.log('Conectou com o mongodb!')
} catch (error) {
  console.log('Deu erro no banco de dados!')
}

const app = express();
app.use(cors());
app.use(express.json());






app.listen(process.env.PORT, () => {
  console.log(chalk.blue('Servidor Funcionando na porta ' + process.env.PORT));
})