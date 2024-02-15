
const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const database = require('./database');
const path = require('path');
const mysql = require('mysql2');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

app.use(express.static(path.join(__dirname, 'public')));

var con = mysql.createConnection({
    host: "localhost",
    user: "sqluser",
    password: "password",
    database: "mydb",
  });

// Check if the user is authenticated.
function isAuthenticated(req, res, next) {
    if (req.session.authenticated) {
        return next();
    }
    res.redirect('/');
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Use the authenticateUser function with a callback
    database.authenticateUser(username, password, (authenticated) => {
        if (authenticated) {
            req.session.authenticated = true;
            res.redirect('/dashboard');
        } else {
            // Set the error message as a query parameter and redirect to the login page.
            res.redirect('/?error=Invalid%20credentials.%20Please%20try%20again.');
        }
    });
});

// Route for user registration page.
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const sqlQuery = "SELECT COUNT(*) as count FROM auth WHERE username = ?";
        con.query(sqlQuery, [username], (err, result) => {
            if (err) {
                console.error("Error checking username:", err);
                return res.status(500).send('Internal Server Error');
            }

            const userExists = result[0].count > 0;

            if (userExists) {
                return res.send('Username is already taken.');
            }
            else {database.createUser(username, password);
                res.redirect('/');
            }
    
        })
});

app.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
        }
        res.redirect('/');
    });
});


app.listen(80, () => {
    console.log('Server is running on http://localhost:80');
});
