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
    const { title, expireAt } = req.body;
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
app.get("/poll", async (req, res) => {
  try {
    const poll = await db.collection("poll").find({}).toArray();
    res.status(200).send(poll);
  } catch (error) {
    console.log(error.message);
  }
})
app.post("/choice", async (req, res) => {
  const { title, pollId } = req.body;

  try {
    const enqueteExiste = await db.collection("poll").find({ _id: ObjectId(pollId) }).toArray();

    //Uma opção de voto não pode ser inserida sem uma enquete existente
    if (!enqueteExiste) return res.status(404).send("Enquete não existente!")

    //Título não pode ser vazio
    if (!title) return res.status(422).send('Insira um título!')

    const existeTitulo = await db.collection("choice").findOne({ title: title, pollId: ObjectId(pollId) });

    //Título não pode ser repetido
    if (existeTitulo) return res.status(409).send("Título já existente, insira outro");

    //Enquete expirada
    if (enqueteExiste.expireAt < dayjs().format(Formato)) return res.status(403).send("Enquete expirada!")

    await db.collection("choice").insertOne({
      title: title,
      pollId: ObjectId(pollId)
    })
    return res.status(201).send("Opção cadastrada");

  } catch {
    return res.status(500).send("Erro!")
  }

})
app.get("/poll/:id/choice", async (req, res) => {
  const { id } = req.params
  // Se a enquete não existir
  if (!id) return res.status(404).send("Enquete inexistente!")

  try {
    const opcoes = await db.collection("choice").find({ pollId: ObjectId(id) }).toArray();
    return res.status(200).send(opcoes);

  } catch {
    return res.status(500).send("Erro!")
  }

})

app.listen(process.env.PORT, () => {
  console.log(chalk.blue('Servidor Funcionando na porta ' + process.env.PORT));
})