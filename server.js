const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const figlet = require('figlet');
const serveRoute = require('./Routes/serveRoute');
const dbConnect = require('./Services/dbConnection');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const swaggerJsDocs = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const passport = require('passport');
const session = require('express-session');
const User = require('./Models/userModel');
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const JWT = require('jsonwebtoken');

const app = express();

app.use(cors());
require('dotenv').config();

app.use(cookieParser());

// Connect with Database...
dbConnect(process.env.DB_URI);

// Setup view engine...
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares...
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'Public')));

app.use(passport.initialize());
app.use(session(
    {
        secret: 'your_secret_key',
        resave: false,
        saveUninitialized: true
    }
));
passport.use(new GoogleStrategy({
    clientID: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    callbackURL: process.env.OAUTH_CALLBACK || "http://localhost:8000/auth/google/callback"
}, async function (accessToken, refreshToken, profile, cb) {
    try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (!user) {
            user = new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                profileImage: profile.photos[0].value
            });
            await user.save();
        }
        return cb(null, user);
    } catch (error) {
        return cb(error, null);
    }
}));
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Swagger setup
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "EchoWrite with Swagger",
            version: "1.0.0",
            description: "EchoWrite API documentation"
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT}`
            }
        ],
    },
    apis: ["./Routes/*.js"]
};

const swaggerDocs = swaggerJsDocs(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/', serveRoute);

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), async (req, res) => {
    const checkUser = await User.findOne({ email: req.user.email });
    if (!checkUser) {
        return res.render('errorPage', { errorMessage: "Something Went Wrong in OAuth", backUrl: "/login" });
    }
    const payload = {
        _id: checkUser._id,
        username: checkUser.name,
        email: checkUser.email,
        profileimage: checkUser.profileImage
    }
    const token = JWT.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie('usertoken', token).redirect('/');
    // res.redirect('/user/profile');
});

// Connect with server...
app.listen(process.env.PORT, (err) => {
    if (err) {
        console.error("Error connecting to the server:", err);
    } else {
        figlet("Server Connected  .  .  .  .", (err, data) => {
            if (err) {
                console.error("Something went wrong!", err);
                return;
            }
            console.log(data);
        });
        console.log(`Server running on port ${process.env.PORT}`);
    }
});
