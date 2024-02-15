

const fs = require('fs');
const crypto = require('crypto');
const usersFile = 'users.json';
const argon2 = require('argon2');
const dotenv = require('dotenv').config();
const { Buffer } = require('node:buffer');

var mysql = require('mysql2');

var con = mysql.createConnection({
  host: "localhost",
  user: "sqluser",
  password: "password",
  database: "mydb",
});

async function createUser(username, password) {
    const user = username
    const hash = await argon2.hash(password, {secret: Buffer.from(process.env.secret)} )
    let query = `INSERT INTO auth 
        (username, password) VALUES (?, ?);`;
        con.query(query, [user, 
            hash], (err, rows) => {
                if (err) throw err;
                console.log("Row inserted with id = "
                    + rows.insertId);
            });
}

function authenticateUser(username, password, callback) {
    const user = username
    con.query("SELECT * FROM auth WHERE username = ?", [username], function(err, result, field){
        if(result.length === 0){
            console.log("Does not exist");
        } else {  
            console.log("This user exists");
            hash = result[0]['password']
            argon2.verify(hash, password, {secret: Buffer.from(process.env.secret)})
                .then((match) => {
                    if (match) {
                        console.log("Authentication successful");
                        callback(true); // Password matches
                    } else {
                        console.log("Authentication failed");
                        callback(false); // Password does not match
                    }
            })       
        }
    });
    
}

module.exports = {
    createUser,
    authenticateUser,
};
