const mysql = require("mysql2/promise");
const { MongoClient } = require("mongodb");
import { Pigeon } from "./pigeon";

const env = process.env.ENVIRONMENT === "dev" ? process.env : Pigeon.settings

let MySQL: any;
let MongoDB: any;

export const database = async function () {
  // initialize all databases that are enabled
  if (env.DATABASE_MYSQL_ENABLED === true)
    MySQL = await MySQLConnection();
  if (env.DATABASE_MONGODB_ENABLED === true)
    MongoDB = await MongoDBConnection();
};

export const MySQLConnection = async function () {
  if (env.DATABASE_MYSQL_ENABLED !== true) return
  if (MySQL) {
    return MySQL;
  }
  const conn = await mysql.createConnection({
    host: env.DATABASE_MYSQL_HOST,
    user: env.DATABASE_MYSQL_USER,
    password: env.DATABASE.MYSQL_PASSWORD,
    database: env.DATABASE.MYSQL_DATABASE,
  });
  MySQL = conn;
  return MySQL;
};

export const MongoDBConnection = async function () {
  if (env.DATABASE_MONGODB_ENABLED !== true) return
  if (MongoDB) {
    return MongoDB;
  }
  const client = new MongoClient(env.DATABASE_MONGODB_URL);
  await client.connect();
  const collection = await client
    .db(env.DATABASE_MONGODB_DB)
    .collection(env.DATABASE_MONGODB_COLLECTION);
  MongoDB = collection;
  return MongoDB;
};

export { MySQL, MongoDB };
