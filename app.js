const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = {
    name: String
};

const Item = mongoose.model("item", itemsSchema);

function initializeDatabase() {
    const item1 = new Item({
      name: "Welcome to your todolist!",
    });
  
    const item2 = new Item({
      name: "Hit the + button to add a new item.",
    });
  
    const item3 = new Item({
      name: "<-- hit this to delete an item.",
    });
  
    const defaultItems = [item1, item2, item3];
  
    return new Promise((resolve, reject) => {
      Item.insertMany(defaultItems)
        .then(() => {
          console.log("Successfully saved default items to DB");
          resolve();
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  }  

function renderList(res, items) {
    res.render("list", {
        listTitle: "Today",
        newListItems: items
    });
}

// Define a variable to keep track of whether the database has been initialized
let isDatabaseInitialized = false;

app.get("/", function (req, res) {
  Item.find().then(function (foundItems) {
    if (!isDatabaseInitialized || foundItems.length === 0) {
      initializeDatabase()
        .then(function () {
          // Update the flag to indicate that the database has been initialized
          isDatabaseInitialized = true;
          Item.find().then(function (items) {
            renderList(res, items);
          });
        })
        .catch(function (err) {
          console.log(err);
          res.status(500).send("Error initializing database");
        });
    } else {
      renderList(res, foundItems);
    }
  }).catch(function (err) {
    console.log(err);
    res.status(500).send("Error retrieving items from the database");
  });
});


app.post("/", function (req, res) {
    let item = req.body.newItem;
    if (req.body.list === "Work") {
        workItems.push(item);
        res.redirect("/work");
    } else {
        items.push(item);
        res.redirect("/");
    }

});

app.get("/work", function (req, res) {
    res.render("list", {
        listTitle: "Work List",
        newListItems: workItems
    });
});

app.post("/work", function (req, res) {
    let item = req.body.newItem;
    workItems.push(item);

    res.redirect("/work");
});

app.get("/about", function (req, res) {
    res.render("about")
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});