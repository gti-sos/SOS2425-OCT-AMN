import express from "express";
import { handler } from './front/build/handler.js';
import cors from "cors";
import helmet from "helmet";
import * as dotenv from 'dotenv';
const app = express();
//app.disable('x-powered-by'); -solución alternativa-
const PORT = process.env.PORT || 16078;


/*
Helmet no solo elimina el encabezado X-Powered-By, 
sino que también añade otras protecciones importantes 
contra ataques comunes como XSS, clickjacking y sniffing MIME.
*/
// Añadir Helmet para mejorar la seguridad
app.use(helmet());

//app.use("/", express.static("public"));
app.use(express.json());
app.use(cors());

dotenv.config(); //Manejar API keys externas


import { loadBackend as loadBackendA } from "./back/index-AMN.js";
loadBackendA(app);


app.use(handler);


app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto :${PORT}`);
});


