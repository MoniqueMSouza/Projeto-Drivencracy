import express from "express";
import cors from "cors";
import chalk from "chalk"



const app = express();
app.use(cors());
app.use(express.json());



app.listen(5000, () => {
  console.log(chalk.blue('Servidor Funcionando na porta 5000'));
})