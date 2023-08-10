const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config();
// Work on this, not ready yet
exports.up = async function () {
  const db = await mysql.createConnection({
    host: env.DATABASE_MYSQL_HOST,
    user: env.DATABASE_MYSQL_USER,
    password: env.DATABASE_MYSQL_PASSWORD,
  });

  // Create the database if it doesn't exist
  await db.query(`CREATE DATABASE IF NOT EXISTS ${env.DATABASE_MYSQL_DATABASE}`);

  // Use the newly created database
  await db.query(`USE ${env.DATABASE_MYSQL_DATABASE}`);

  // Create tables if they don't exist
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INT,
      role VARCHAR(255),
      PRIMARY KEY (user_id, role)
    );
  `);
};

exports.down = async function () {
  const db = await mysql.createConnection({
    host: env.DATABASE_MYSQL_HOST,
    user: env.DATABASE_MYSQL_USER,
    password: env.DATABASE_MYSQL_PASSWORD,
    database: env.DATABASE_MYSQL_DATABASE,
  });

  // Drop the tables
  await db.query("DROP TABLE IF EXISTS users;");
  await db.query("DROP TABLE IF EXISTS user_roles;");

  // Drop the database
  await db.query(`DROP DATABASE IF EXISTS ${env.DATABASE_MYSQL_DATABASE}`);
};
