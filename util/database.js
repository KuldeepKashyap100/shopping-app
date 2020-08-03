const mongodb = require("mongodb");

const MongoClient = mongodb.MongoClient;

let _db;
const mongoConnect = (cb) => {
  // if the database is not present mongodb will create it on the fly.
  MongoClient.connect(
    "mongodb+srv://root:38AzamslJAZXJ5Tx@cluster0.zgpxi.mongodb.net/shopping-app?retryWrites=true"
  )
    .then((client) => {
      console.log("Connected!!!");
      //we can change the data base also by passing new db name
      // _db = client.db('shopping-app');
      _db = client.db();

      cb();
    })
    .catch((err) => {
      console.log(err);
    });
};

const getDb = ()=>{
  if(_db) {
    return _db;
  }
}
exports.mongoConnect = mongoConnect;
exports.getDb = getDb;

/**
 * Used Sequelize for Database operations
 */
// const Sequelize = require("sequelize");

// const sequelize = new Sequelize("shopping-app", "root", "27922004", {
//   dialect: "mysql",
//   host: "localhost",
// });

// module.exports = sequelize;

// const mysql = require('mysql2');

// const pool =  mysql.createPool({
//     host: "localhost",
//     user: "root",
//     database: "shopping-app",
//     password: "27922004"
// });

// module.exports = pool.promise();
