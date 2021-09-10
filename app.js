require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
/////////////////////////////////////////////////////////////////////////////////////////
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
///////////////////////////////////////////////////////////////////////////////////////////////
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
////////////////////////////////////////////////////////////////////////////////////////////////

mongoose.connect("mongodb://localhost:27017/notesDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

const userSchema = new mongoose.Schema({
  facebookId: String,
  googleId: String,
  username: String,
  email: String,
  password: String,
  notes: [
    {
      title: String,
      content: String,
      alarm: { type: String, default: "" },
    },
  ],
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

// Google

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/notes",
    },
    function (accessToken, refreshToken, profile, done) {
      User.findOrCreate(
        { googleId: profile.id, username: profile.displayName },
        function (err, user) {
          return done(err, user);
        }
      );
    }
  )
);

// Facebook

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "http://localhost:3000/auth/facebook/notes",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate(
        { facebookId: profile.id, username: profile.displayName },
        function (err, user) {
          return cb(err, user);
        }
      );
    }
  )
);

//////////////////////////////////////////////////////////////////////////////////////////////////

// function testing() {
//   x = new Date();
//   console.log(x);
//   x.setSeconds(x.getSeconds() + 5); // x = current seconds + 5
//   console.log(x);
//   var t = new Date(x) - new Date(); // t = current date of (x) - current date;
//   console.log(t);
//   setTimeout(function () {
//     console.log("Hello");
//   }, t);
// }

// testing();

// function alarm(alarmParams) {
//   // Create new Date using the data from database.
//   let setAlarm = new Date(alarmParams);
//   console.log(setAlarm);
//   // Compare the current date - date from database
//   let alarmPlay = new Date(setAlarm) - new Date();
//   console.log(alarmPlay);
//   // Set the time out based on current date - date from database and display notification.
//   setTimeout(function () {
//     console.log("play the sound.");
//   }, alarmPlay);
// }

// alarm("2021-09-07T10:29:00");

//////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/notes", function (req, res) {
  if (req.isAuthenticated()) {
    const userID = req.user._id;

    User.findById({ _id: userID }, function (err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        // mongoose.connection.close();

        const userNotes = foundUser.notes;

        res.render("notes", {
          userNotes: userNotes,
          pageTitle: "Notes",
        });
      }
    });
  } else {
    res.redirect("/connect");
  }
});

app.post("/compose", function (req, res) {
  const newTitle = req.body.title;
  const newContent = req.body.content;
  const userID = req.user._id;
  const newAlarm = req.body.alarm;

  User.findByIdAndUpdate(
    { _id: userID },
    {
      $push: {
        notes: {
          title: newTitle,
          content: newContent,
          alarm: newAlarm,
        },
      },
    },
    function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Note Added");
        res.redirect("/notes");
      }
    }
  );
});

app.post("/delete", function (req, res) {
  const deleteNote = req.body.delete;
  const userID = req.user._id;

  User.updateOne(
    { _id: userID },
    {
      $pull: {
        notes: {
          _id: deleteNote,
        },
      },
    },
    function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted.");
        res.redirect("/notes");
      }
    }
  );
});

app.get("/edit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("edit", { pageTitle: "Edit" });
  } else {
    res.redirect("/connect");
  }
});

app.post("/edit", function (req, res) {
  const editNote = req.body.edit;
  const userID = req.user._id;

  User.findById({ _id: userID }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      const notesArray = foundUser.notes;

      const note = findNote(editNote, notesArray);

      function findNote(editNote, notesArray) {
        for (let i = 0; i < notesArray.length; i++) {
          if (notesArray[i]._id == editNote) {
            return notesArray[i];
          } else {
            console.log("not found!");
          }
        }
      }

      res.render("edit", { note: note, pageTitle: "Edit" });
    }
  });
});

app.post("/save", function (req, res) {
  const newTitle = req.body.title;
  const newContent = req.body.content;
  const idNote = req.body._id;
  const userID = req.user._id;

  User.updateOne(
    { _id: userID, "notes._id": idNote },
    {
      $set: {
        "notes.$.title": newTitle,
        "notes.$.content": newContent,
      },
    },
    function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully updated.");
      }
    }
  );

  res.redirect("/notes");
});

app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/notes");
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/notes");
      });
    }
  });
});

//////////////////////////////////////  LOGIN SECTION //////////////////////////////////////

app.get("/", function (req, res) {
  res.render("home", { pageTitle: "Notes" });
});

// Google
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/notes",
  passport.authenticate("google", { failureRedirect: "/connect" }),
  function (req, res) {
    //Successful authentication, redirect to notes.
    res.redirect("/notes");
  }
);

// Facebook
app.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: ["public_profile"] })
);

app.get(
  "/auth/facebook/notes",
  passport.authenticate("facebook", { failureRedirect: "/connect" }),
  function (req, res) {
    // Successful authentication, redirect notes.
    res.redirect("/notes");
  }
);

app.get("/connect", function (req, res) {
  res.render("connect", { pageTitle: "Connect with social media" });
});

app.get("/login", function (req, res) {
  res.render("login", { pageTitle: "Login" });
});

app.get("/register", function (req, res) {
  res.render("register", { pageTitle: "Register" });
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.listen(3000, function () {
  console.log("Server running on port 3000");
});
