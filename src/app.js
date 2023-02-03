import express from "express";
import cors from "cors";
import chalk from "chalk"
import { MongoClient, ObjectId } from "mongodb";
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
 
    const { title, expireAt } = req.body;
    let data = expireAt;

    if (!title) return res.status(422).send('Insira um título!')
    if (!expireAt) return data = dayjs().add(30, 'day').format(Formato);

    try {
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
  try {
    const { title, pollId } = req.body;

    const enqueteExiste = await db.collection("poll").find({_id:(pollId)})

    //Uma opção de voto não pode ser inserida sem uma enquete existente
    if (!enqueteExiste) return res.status(404).send("Enquete não existente!")
    
    //Título não pode ser vazio
    if (!title) return res.status(422).send('Insira um título!')

    const existeTitulo = await db.collection("choice").findOne({ title: title, pollId: new ObjectId(pollId) });

    //Título não pode ser repetido
    if (existeTitulo) return res.status(409).send("Título já existente, insira outro");

    //Enquete expirada
    if (enqueteExiste.expireAt < dayjs().format(Formato)) return res.status(403).send("Enquete expirada!")


    await db.collection("choice").insertOne({
      title: title,
      pollId: new ObjectId(pollId)
    })
    return res.status(201).send("Opção cadastrada");

  } catch (err) {
    return res.status(500).send(err.message)
  }

})
app.get("/poll/:id/choice", async (req, res) => {
  const { id } = req.params
  // Se a enquete não existir
  if (!id) return res.status(404).send("Enquete inexistente!")

  try {
    const opcoes = await db.collection("choice").find({ pollId: new ObjectId(id) }).toArray();
    return res.status(200).send(opcoes);

  } catch (err) {
    return res.status(500).send(err.message)
  }

})
app.post("/choice/:id/vote", async (req, res) => {
  try {
    const {id} = req.params;
  
    const opcao = await db.collection("choice").findOne({ _id: new ObjectId(id) })
    //verificar se é uma opção existente
    if (!opcao) return res.status(404).send("Opção não existente")

    const enqueteExpirou = await db.collection("poll").findOne({ _id: new ObjectId(opcao.pollId) });
    //Não pode ser registrado se a enquete já estiver expirado,
    if (enqueteExpirou.expireAt < dayjs().format(Formato)) return res.status(403).send("Enquete expirou")

    //O voto deve armazenar a data e hora que foi criado
    await db.collection("vote").insertOne({
      createdAt: dayjs().format(Formato),
      choiceId: opcao._id
    })

    return res.status(201).send("Voto Registrado")

  } catch (err) {
    return res.status(500).send(err.message)
  }
})
app.get("/poll/:id/result", async (req, res) => {
  const { id } = req.params;

  try {
    const enquete = await db.collection("poll").findOne({ _id:(id) });
    if (!enquete) return res.status(404).send("Enquete inexistente");

    const arrayVotes = await db.collection("vote").aggregate([{$sortByCount: "$choiceId"}]).toArray()

    const opcao = await db.collection("choice").findOne({_id: arrayVotes[0]._id});

    const result = {
      _id: id,
      title: enquete.title,
      expireAt: enquete.expireAt,
      result: {
          title: opcao.title,
          votes: arrayVotes[0].count
      }
  };
  
  return res.status(200).send(result);

  } catch (err){
    return res.status(500).send(err.message)
  }

})


app.listen(process.env.PORT, () => {
  console.log(chalk.blue('Servidor Funcionando na porta ' + process.env.PORT));
})