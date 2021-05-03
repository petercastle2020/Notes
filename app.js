const express = require("express");
const bodyParser = require("body-parser");

const worries = [
  {
    title: "test",
    content: "test contente",
  },
  { title: "test2", content: "test contente2" },
  { title: "test3", content: "test contente3" },
  { title: "test4", content: "test contente4" },
  { title: "test5", content: "test contente5" },
  { title: "test6", content: "test contente6" },
  { title: "test7", content: "test contente7" },
  { title: "test8", content: "test contente8" },
  { title: "test9", content: "test contente9" },
];

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

app.get("/worries", function (req, res) {
  res.render("partials/worries", {
    worryList: worries,
  });
});

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/compose.html");
});

app.get("/compose", function (req, res) {
  res.sendFile(__dirname + "/compose.html");
});

app.post("/compose", function (req, res) {
  const worry = {
    title: req.body.title,
    content: req.body.content,
  };
  worries.push(worry);
  res.redirect("/worries");
});

app.listen(3000, function () {
  console.log("Server running on port 3000");
});

// testing ejs

// <% for (i = 0; i < worryList.length; i++) { %>
//   <h1><%=worryList[i].title%></h1>
//   <h2><%=worryList[i].content%></h2>
//   <% } %>
