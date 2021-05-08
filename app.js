const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/worriesList", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const worrySchema = new mongoose.Schema({
  title: String,
  content: String,
});

const Worry = mongoose.model("Worry", worrySchema);

// const worry = new Worry({
//   title: "testing database",
//   content: "anything just testing to see what's happen.",
// });

// worry.save();

Worry.find(function (err, worries) {
  if (err) {
    console.log(err);
  } else {
    console.log(worries);
  }
});

// const worries = [
//   {
//     title: "test",
//     content: "test contente",
//   },
//   { title: "test2", content: "test contente2" },
//   { title: "test3", content: "test contente3" },
//   { title: "test4", content: "test contente4" },
//   { title: "test5", content: "test contente5" },
//   { title: "test6", content: "test contente6" },
//   { title: "test7", content: "test contente7" },
//   { title: "test8", content: "test contente8" },
//   { title: "test9", content: "test contente9" },
// ];

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

app.get("/worries", function (req, res) {
  Worry.find(function (err, worries) {
    if (err) {
      console.log(err);
    } else {
      mongoose.connection.close();
      console.log(worries);
      res.render("partials/worries", {
        worryList: worries,
      });
    }
  });
  // res.render("partials/worries", {
  //   worryList: worries,
  // });
});

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/compose.html");
});

app.get("/compose", function (req, res) {
  res.render("partials/compose");
});

app.post("/compose", function (req, res) {
  // const worry = {
  //   title: req.body.title,
  //   content: req.body.content,
  // };
  // worries.push(worry);
  // res.redirect("/worries");

  const worry = new Worry({
    title: req.body.title,
    content: req.body.content,
  });

  worry.save();
  res.redirect("/worries");
});

app.post("/delete", function (req, res) {
  if (req.body.btn === "delete") {
    console.log("delete btn clicked.");
  } else if (req.body.btn === "edit") {
    console.log("edit btn clicked.");
  } else {
    console.log("error");
  }
});

app.listen(3000, function () {
  console.log("Server running on port 3000");
});

// console.log(worries);
// testing ejs

// <% for (i = 0; i < worryList.length; i++) { %>
//   <h1><%=worryList[i].title%></h1>
//   <h2><%=worryList[i].content%></h2>
//   <% } %>
