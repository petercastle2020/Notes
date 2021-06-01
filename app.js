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
//   notes: [{ title: "test title 3", content: "test content 3" }],
// });

// user.save();

//////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/worries", function (req, res) {
  if (req.isAuthenticated()) {
    const userID = req.user._id;

    console.log(req.user._id);

    User.findById({ _id: userID }, function (err, userdata) {
      if (err) {
        console.log(err);
      } else {
        // mongoose.connection.close();

        const userNotes = userdata.notes;

        res.render("worries", {
          userNotes: userNotes,
          pageTitle: "Worries",
        });
      }
    });
  } else {
    res.redirect("/login");
  }
  // const userID = "60b38ce3576daa18245f0df1";

  // User.findById({ _id: userID }, function (err, userdata) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     // mongoose.connection.close();

  //     const userNotes = userdata.notes;

  //     res.render("worries", {
  //       userNotes: userNotes,
  //       pageTitle: "Worries",
  //     });

  //     console.log(req);
  //   }
  // });
});

app.get("/compose", function (req, res) {
  res.render("compose", { pageTitle: "Compose" });
});

app.post("/compose", function (req, res) {
  const newTitle = req.body.title;
  const newContent = req.body.content;

  // NEED TO CATCH THE USER ID TO MAKE CHANGES <<<
  const userID = "60b38ce3576daa18245f0df1";

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
        console.log("pushing complete son!");
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

app.post("/edit", function (req, res) {
  const id = req.body.edit;
  Worry.findById({ _id: id }, function (err, worry) {
    if (err) {
      console.log(err);
    } else {
      res.render("edit", { editWorry: worry, pageTitle: "Edit" });
    }
  });
});

app.post("/save", function (req, res) {
  const newTitle = req.body.title;
  const newContent = req.body.content;
  const Id = req.body._id;

  Worry.findByIdAndUpdate(
    Id,
    { title: newTitle, content: newContent },
    function (err, worry) {
      if (err) {
        console.log(err);
      } else {
        console.log("successfully Updated the document.");
      }
    }
  );

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
