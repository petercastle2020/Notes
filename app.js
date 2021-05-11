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

//////////////////////////////////////////////////////////////////////////////////////////////////

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

app.get("/worries", function (req, res) {
  Worry.find(function (err, worries) {
    if (err) {
      console.log(err);
    } else {
      // mongoose.connection.close();
      res.render("partials/worries", {
        worryList: worries,
      });
    }
  });
});

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/compose.html");
});

app.get("/compose", function (req, res) {
  res.render("partials/compose");
});

app.post("/compose", function (req, res) {
  const worry = new Worry({
    title: req.body.title,
    content: req.body.content,
  });

  worry.save();
  res.redirect("/worries");
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
      res.render("partials/edit", { editWorry: worry });
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

app.listen(3000, function () {
  console.log("Server running on port 3000");
});
