const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const credentials = require('./credentials.js');
const username = credentials.username;
const password = credentials.password;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

mongoose.connect(`mongodb+srv://${username}:${password}@cluster70613.wjqii0e.mongodb.net/todolistDB`);

const itemsSchema = {
    name: String
};

const Item = mongoose.model("item", itemsSchema);

const listSchema = {
    name: String,
    items: [itemsSchema] 
};

const List = mongoose.model("list", listSchema);

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

function initializeDatabase() {
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

function renderList(res, listName, items) {
    res.render("list", {
        listTitle: listName,
        newListItems: items
    });
}

app.get("/", function (req, res) {
  Item.find().then(function (foundItems) {
    if (foundItems.length === 0) {
      initializeDatabase()
        .then(function () {
          Item.find().then(function (items) {
            renderList(res, "Today", items);
          });
        })
        .catch(function (err) {
          console.log(err);
          res.status(500).send("Error initializing database");
        });
    } else {
      renderList(res, "Today", foundItems);
    }
  }).catch(function (err) {
    console.log(err);
    res.status(500).send("Error retrieving items from the database");
  });
});

app.post("/", function (req, res) {
    const listName = req.body.list;
    const itemName = req.body.newItem;
    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save().then(function(savedDocument) {
            console.log('Document saved successfully:', savedDocument);
            res.redirect("/");
        }).catch(function(error) {
            console.error(error);
        }); 
    } else {
        List.findOne({name: listName}).then(function (foundList) {
            foundList.items.push(item);
            foundList.save().then(function (savedDocument) {
                console.log(`The item was succesfully save to ${listName} list`);
                res.redirect("/" + listName);
            }).catch(function (err) {
                console.error(err);
            });
        });
    }
});

app.post("/delete", function (req, res) {
    const listName = req.body.listName;
    const checkedItemId = req.body.checkbox;
  
    if (listName === "Today") {
      Item.findByIdAndRemove(checkedItemId)
        .then(function (item) {
          if (item) {
            console.log("Item removed successfully:", item);
            res.redirect("/");
          } else {
            // Item not found
            res.status(404).send("Item not found");
          }
        })
        .catch(function (error) {
          console.error(error);
          // Handle error gracefully
          res.status(500).send("Error occurred while removing item");
        });
    } else {
      List.findOne({ name: listName })
        .then(function (foundList) {
          if (foundList) {
            const listId = foundList._id;
  
            List.findByIdAndUpdate(
              listId, 
              { $pull: { items: { _id: checkedItemId } } }
            )
              .then(function (foundList) {
                if (foundList) {
                  console.log(`Item removed successfully from ${listName}`);
                  res.redirect("/" + listName);
                } else {
                  // List not found
                  res.status(404).send("List not found");
                }
              })
              .catch(function (error) {
                console.error(error);
                // Handle error gracefully
                res.status(500).send("Error occurred while removing item from list");
              });
          } else {
            console.log("List not found");
            res.status(404).send("List not found");
          }
        })
        .catch(function (error) {
          console.error(error);
          // Handle error gracefully
          res.status(500).send("Error occurred while finding list");
        });
    }
  });  

app.get("/:customListName", function (req, res) {
    const listName = _.capitalize(req.params.customListName);

    List.findOne({ name: listName })
    .then(function (foundList) {
      if (foundList) {
        // List already exists
        renderList(res, listName, foundList.items)
      } else {
        // List does not exist
        const list = new List({
            name: listName,
            items: defaultItems
        });

        list.save();
        res.redirect("/" + listName);
      }
    })
    .catch(function (error) {
      console.error("Error occurred:", error);
    });
});

app.get("/about", function (req, res) {
    res.render("about")
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});