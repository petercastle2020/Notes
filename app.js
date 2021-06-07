require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
/////////////////////////////////////////////////////////////////////////////////////////
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

///////////////////////////////////////////////////////////////////////////////////////////////

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
  email: String,
  password: String,
  notes: [{ title: String, content: String }],
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// const user = new User({
//   email: "test2@gmail.com.com",
//   password: "qwert",
//   notes: { title: "AAAAAAAAA", content: "BBBBBBBBBBBBBBBBBBBB" },
// });

// user.save();

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
  Worry.deleteOne({ _id: req.body.delete }, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("worry deleted!");
      res.redirect("/worries");
    }
  });
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

  //   User.find({ _id: userID }).elemMatch(
  //     { notes: { _id: editNote } },
  //     function (err, foundData) {
  //       if (err) {
  //         console.log(err);
  //       } else {
  //         console.log(foundData);
  //       }
  //     }
  //   );
  // });

  // User.find({ _id: userID }).elemMatch(
  //   { notes: { _id: editNote } },
  //   function (foundData) {
  //     console.log(foundData);
  //   }
  // );

  // User.find()
  //   .where(User.notes)
  //   .elemMatch({ _id: editNote }, function (err, foundData) {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       console.log(foundData);
  //     }
  //   });
});

app.post("/save", function (req, res) {
  const newTitle = req.body.title;
  const newContent = req.body.content;
  const idNote = req.body._id;

  const userID = req.user._id;

  User.findById({ _id: userID }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      const notesArray = foundUser.notes;

      const note = findNote(idNote, notesArray);

      function findNote(idNote, notesArray) {
        for (i = 0; i < notesArray.length; i++) {
          if (notesArray[i]._id == idNote) {
            notesArray.splice(i, 1);
            // return notesArray[i];
            return notesArray;
          } else {
            console.log("note found");
          }
        }
      }

      // function findNote(idNote, notesArray) {
      //   for (i = 0; i < notesArray.length; i++) {
      //     if (notesArray[i]._id == idNote) {
      //       return notesArray[i];
      //     } else {
      //       console.log("note found");
      //     }
      //   }
      // }

      console.log(note);
    }
  });

  // User.findByIdAndUpdate(
  //   idNote,
  //   { title: newTitle, content: newContent },
  //   function (err, worry) {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       console.log("successfully Updated the document.");
  //     }
  //   }
  // );

  res.redirect("/worries");
});

app.post("/register", function (req, res) {
  // const user = new User({
  //   email: req.body.username,
  //   password: req.body.password,
  //   notes: [],
  // });

  // res.send("thanks for it");

  // console.log(req.body.username);
  // console.log(req.body.password);

  // // user.save();
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
  // const loginUsername = req.body.username;
  // const loginPassword = req.body.password;
  // User.findOne({ email: loginUsername }, function (err, userdata) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     if (userdata) {
  //       if (userdata.password === loginPassword) {
  //         const userNotes = userdata.notes;

  //         res.render("worries", {
  //           pageTitle: "Worries",
  //           userNotes: userNotes,
  //         });
  //       }
  //     }
  //   }
  // });
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

// const userID = "60b38ce3576daa18245f0df1";

//   User.findById({ _id: userID }, function (err, userdata) {
//     if (err) {
//       console.log(err);
//     } else {
//       // mongoose.connection.close();

//       const userNotes = userdata.notes;

//       res.render("worries", {
//         userNotes: userNotes,
//         pageTitle: "Worries",
//       });

//////////////////////////////////////  LOGIN SECTION //////////////////////////////////////

app.get("/", function (req, res) {
  res.render("home", { pageTitle: "Worries Notes" });
});

app.get("/connect", function (req, res) {
  res.render("connect", { pageTitle: "Conect with social media" });
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
