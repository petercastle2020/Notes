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
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
////////////////////////////////////////////////////////////////////////////////////////////////

mongoose.connect("mongodb://localhost:27017/worriesList", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

const userSchema = new mongoose.Schema({
  googleId: String,
  email: String,
  password: String,
  notes: [{ title: String, content: String }],
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

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/notes",
    },
    function (accessToken, refreshToken, profile, done) {
      console.log(profile);
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return done(err, user);
      });
    }
  )
);
//////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/worries", function (req, res) {
  if (req.isAuthenticated()) {
    const userID = req.user._id;

    User.findById({ _id: userID }, function (err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        // mongoose.connection.close();

        const userNotes = foundUser.notes;

        res.render("worries", {
          userNotes: userNotes,
          pageTitle: "Worries",
        });
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/compose", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("compose", { pageTitle: "Compose" });
  } else {
    res.redirect("/login");
  }
});

app.post("/compose", function (req, res) {
  const newTitle = req.body.title;
  const newContent = req.body.content;
  const userID = req.user._id;

  User.findByIdAndUpdate(
    { _id: userID },
    {
      $push: {
        notes: { title: newTitle, content: newContent },
      },
    },
    function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Note Added");
        res.redirect("/worries");
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
        res.redirect("/worries");
      }
    }
  );
});

app.get("/edit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("edit", { pageTitle: "Edit" });
  } else {
    res.redirect("/login");
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

  res.redirect("/worries");
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
          res.redirect("/worries");
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
        res.redirect("/worries");
      });
    }
  });
});

//////////////////////////////////////  LOGIN SECTION //////////////////////////////////////

app.get("/", function (req, res) {
  res.render("home", { pageTitle: "Worries Notes" });
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/notes",
  passport.authenticate("google", { failureRedirect: "/connect" }),
  function (req, res) {
    //Successful authentication, redirect to notes.
    res.redirect("/worries");
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
