const mysql = require("mysql2/promise");
const { MongoClient } = require("mongodb");
import { Pigeon } from "./pigeon";

let MySQL: any;
let MongoDB: any;

export const initializeDatabase = async function () {
  // initialize all databases that are enabled
  if (Pigeon.settings.db.mysql.enabled === "true") {
    MySQL = await MySQLConnection();
  }
  if (Pigeon.settings.db.mongodb.enabled === "true") {
    MongoDB = await MongoDBConnection();
  }
};

const testMySQLConnection = async function (conn: any) {
  try {
    await conn.query("SELECT 1"); // Test the connection
  } catch (error: any) {
    throw new Error("Failed to establish MySQL connection: " + error.message);
  }
};

export const MySQLConnection = async function () {
  if (Pigeon.settings.db.mysql.enabled !== "true") return;
  if (MySQL) return MySQL;
  const conn = await mysql.createPool({
    host: Pigeon.settings.db.mysql.host,
    user: Pigeon.settings.db.mysql.user,
    password: Pigeon.settings.db.mysql.password,
    database: Pigeon.settings.db.mysql.database,
    port: Pigeon.settings.db.mysql.port ?? "3306",
  });
  await testMySQLConnection(conn);
  MySQL = conn;
  return MySQL;
};

export const MongoDBConnection = async function () {
  if (Pigeon.settings.db.mongodb.enabled !== "true") return;
  if (MongoDB) return MongoDB;
  const client = new MongoClient(Pigeon.settings.db.mongodb.url);
  await client.connect();
  const collection = await client
    .db(Pigeon.settings.db.mongodb.db)
    .collection(Pigeon.settings.db.mongodb.collection);
  MongoDB = collection;
  return MongoDB;
};

export { MySQL, MongoDB };
