import express from "express";
import cors from "cors";
import chalk from "chalk"
import { MongoClient } from "mongodb";
import dotenv from 'dotenv'
import dayjs from 'dayjs'

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
const Formato = ('YYYY/MM/DD HH:mm');

app.use(cors());
app.use(express.json());

app.post("/poll", async (req, res) => {
  try {
  const {title, expireAt} = req.body;
  let data = expireAt;

  if (!title) return res.status(422).send('Insira um título!')
  if (!expireAt) return data = dayjs().add(30, 'day').format(Formato);

 
    await db.collection("poll").insertOne({
      title: title,
      expireAt: data
    })

  } catch {
    return res.status(500).send("Erro!")
  }

})
app.get("/poll",async (req,res) => {
  try {
      const poll = await db.collection("poll").find({}).toArray();
      res.status(200).send(poll);
  } catch (error) {
      console.log(error.message);
  }
})


app.listen(process.env.PORT, () => {
  console.log(chalk.blue('Servidor Funcionando na porta ' + process.env.PORT));
})