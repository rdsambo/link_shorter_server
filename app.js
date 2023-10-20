const express = require('express')
var bodyParser = require('body-parser')
const app = express()
const cors = require('cors');
const port = 3000
// create application/json parser
var jsonParser = bodyParser.json()

const fs = require("fs");
const sqlite3 = require('sqlite3').verbose()
const filepath = "./links.db";

app.use(cors({
  origin: '*'
}));

function createDbConnection() {
  if (fs.existsSync(filepath)) {
    return new sqlite3.Database(filepath);
  } else {
    const db = new sqlite3.Database(filepath, (error) => {
      if (error) {
        return console.error(error.message);
      }
      createTable(db);
    });
    console.log("Connection with SQLite has been established");
    return db;
  }
}
function createTable(db) {
  db.exec(`
  CREATE TABLE links
  (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    original_link   VARCHAR(255) NOT NULL,
    shorter_link   VARCHAR(50) NOT NULL
  );
  `);
}
const db = createDbConnection();
function insertRow(original_link, shorter_link) {
  const [name, color, weight] = process.argv.slice(2);
  db.run(
    `INSERT INTO links (original_link, shorter_link) VALUES (?, ?)`,
    [original_link, shorter_link],
    function (error) {
      if (error) {
        console.error(error.message);
      }
      console.log(`Inserted a row with the ID: ${this.lastID}`);
    }
  );
}
function selectOriginals(shorter) {  
  db.each(`SELECT original_link FROM links WHERE shorter_link = ?`, [shorter], (error, row) => {
    if (error) {
      throw new Error(error.message);
    }
    console.log(row);
  });
}
function selectShorter(original) {
  db.each(`SELECT shorter_link FROM links WHERE original_link = ?`, [original], (error, row) => {
    if (error) {
      throw new Error(error.message);
    }
    console.log(row);
  });
}
function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

// POST /api/users gets JSON bodies
app.post('/original', jsonParser, (req, res) => {
  console.log(req.body.shorter)
  res.json(selectOriginals(req.body.shorter))
})
app.post('/new_link',  jsonParser, (req, res) => {
  const original_link = req.body.original
  // console.log(original_link)
  let shorter_link = selectShorter(original_link);
  if(shorter_link){
    // console.log(shorter_link)
    res.json(shorter_link)
  } else {
    shorter_link = makeid(10)
    // console.log(shorter_link)
    insertRow(original_link, shorter_link)
    res.json({shorter_link: shorter_link})
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})