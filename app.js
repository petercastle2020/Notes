require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
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
    store: MongoStore.create({
      mongoUrl: process.env.DATA_BASE_URL,
      ttl: 14 * 24 * 60 * 60, // = 14 days. Default
    }),
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.DATA_BASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

const userSchema = new mongoose.Schema({
  googleId: String,
  username: String,
  email: String,
  password: String,
  notes: [
    {
      title: String,
      content: String,
      alarm: { type: String, default: "" },
      formattedTimeNote: { type: String, default: "" },
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

app.get("/notes", function (req, res) {
  if (req.isAuthenticated()) {
    const userID = req.user._id;

    User.findById({ _id: userID }, function (err, foundUser) {
      if (err) {
        console.log(err);
      } else {
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
  if (req.isAuthenticated()) {
    const newTitle = req.body.title;
    const newContent = req.body.content;
    const userID = req.user._id;
    let newAlarm = req.body.alarm;

    if (newAlarm === "") {
      newAlarm = new Date();
    }

    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    let current_datetime = new Date(newAlarm);

    let formattedTimeNote =
      current_datetime.getDate() +
      "-" +
      months[current_datetime.getMonth()] +
      "-" +
      current_datetime.getFullYear() +
      " " +
      current_datetime.getHours() +
      ":" +
      current_datetime.getMinutes();

    User.findByIdAndUpdate(
      { _id: userID },
      {
        $push: {
          notes: {
            title: newTitle,
            content: newContent,
            alarm: newAlarm,
            formattedTimeNote: formattedTimeNote,
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
  } else {
    res.redirect("/connect");
  }
});

app.post("/delete", function (req, res) {
  if (req.isAuthenticated()) {
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
  } else {
    res.redirect("/connect");
  }
});

app.get("/edit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("edit", { pageTitle: "Edit" });
  } else {
    res.redirect("/connect");
  }
});

app.post("/edit", function (req, res) {
  if (req.isAuthenticated()) {
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
  } else {
    res.redirect("/connect");
  }
});

app.post("/save", function (req, res) {
  if (req.isAuthenticated()) {
    const newTitle = req.body.title;
    const newContent = req.body.content;
    const idNote = req.body._id;
    const userID = req.user._id;
    let newAlarm = req.body.alarm;

    if (newAlarm === "") {
      newAlarm = new Date();
    }

    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    let current_datetime = new Date(newAlarm);

    let formattedTimeNote =
      current_datetime.getDate() +
      "-" +
      months[current_datetime.getMonth()] +
      "-" +
      current_datetime.getFullYear() +
      " " +
      current_datetime.getHours() +
      ":" +
      current_datetime.getMinutes();

    User.updateOne(
      { _id: userID, "notes._id": idNote },
      {
        $set: {
          "notes.$.title": newTitle,
          "notes.$.content": newContent,
          "notes.$.alarm": newAlarm,
          "notes.$.formattedTimeNote": formattedTimeNote,
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
  } else {
    res.redirect("/connect");
  }
});

app.post("/register", function (req, res) {
  if (req.body.password !== req.body.confirmPassword) {
    res.redirect("/register");
  } else {
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
  }
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

const port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log("Server running on port 3000");
});
