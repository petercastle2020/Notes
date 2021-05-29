const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

///////////////////////////////////////////////////////////////////////////////////////////////

mongoose.connect("mongodb://localhost:27017/worriesList", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const worrySchema = new mongoose.Schema({
  title: String,
  content: String,
});

const Worry = mongoose.model("Worry", worrySchema);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  notes: [{ title: String, content: String }],
});

const User = mongoose.model("User", userSchema);

const user = new User({
  email: "test2@gmail.com.com",
  password: "qwert",
  notes: [{ title: "test title 2", content: "test content 2" }],
});

// user.save();

//////////////////////////////////////////////////////////////////////////////////////////////////

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

app.get("/worries", function (req, res) {
  const userID = "60af8e8b9a2dfb2ceccbf253";

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
});

app.get("/compose", function (req, res) {
  res.render("compose", { pageTitle: "Compose" });
});

app.post("/compose", function (req, res) {
  const newTitle = req.body.title;
  const newContent = req.body.content;

  // NEED TO CATCH THE USER ID TO MAKE CHANGES <<<
  const userID = "60af8e8b9a2dfb2ceccbf253";

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
  const user = new User({
    email: req.body.username,
    password: req.body.password,
    notes: [],
  });

  res.send("thanks for it");

  console.log(req.body.username);
  console.log(req.body.password);

  // user.save();
});

app.post("/login", function (req, res) {
  const loginUsername = req.body.username;
  const loginPassword = req.body.password;
  User.findOne({ email: loginUsername }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        if (foundUser.password === loginPassword) {
          res.render("worries", { pageTitle: "Worries" });
        }
      }
    }
  });
});
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

app.listen(3000, function () {
  console.log("Server running on port 3000");
});
