const Sequelize = require("sequelize");

const sequelize = new Sequelize("shopping-app", "root", "27922004", {
  dialect: "mysql",
  host: "localhost",
});

module.exports = sequelize;

// const mysql = require('mysql2');

// const pool =  mysql.createPool({
//     host: "localhost",
//     user: "root",
//     database: "shopping-app",
//     password: "27922004"
// });

// module.exports = pool.promise();
