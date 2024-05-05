const { AsyncDatabase } = require("promised-sqlite3");
const sqlite3 = require("sqlite3");

//Kinda cursed but it has the promise of better code.
let unpromisedDB = new sqlite3.Database("./users.db");
let db = new AsyncDatabase(unpromisedDB);
module.exports.db =db; 
