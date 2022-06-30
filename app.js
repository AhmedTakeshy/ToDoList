const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const _ = require("lodash");
const mongoose = require('mongoose');
const path = require("path")

const app = express();

app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://admin-takeshy:test25797@cluster0.2bfhgp8.mongodb.net/toDoList')
    .then(() => {
    console.log("The connection open!!!")
    })
    .catch((err) => {
        console.log("It failed!!!!");
        console.log(err);
        
    })

const itemsSchema = new mongoose.Schema({
  name: String
})

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
 
})

const Item = mongoose.model("Item", itemsSchema)
const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your toDoList!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];
const currentDay = date.getDate(); 



app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems){
    if (foundItems.length === 0) {

      Item.insertMany(defaultItems)
      res.redirect("/");
    } else {
        console.log(foundItems);
        res.render("list", {listTitle: currentDay, items: foundItems});
    }
  });
});

app.post("/", async (req, res) => {
  const listName = req.body.list;
  const itemName = req.body.name;

  const item = new Item({
    name: itemName
  });

    if (listName === currentDay) {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, function (err, foundList) {
            console.log(foundList.items);
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});




app.get("/:customList", async (req, res) => {
  const customList = _.capitalize(req.params.customList);
  List.findOne({ name: customList }, function (err, found) {
    if (!err) {
      if (!found) {
          const list = new List({
            name: customList,
            items: defaultItems
          });
          list.save()
          res.redirect(`/${customList}`);
      } else {
            res.render("list", { listTitle: found.name, items: found.items });
    }
    }
  })
})

app.post("/", async (req, res) => {
  
  const listName = req.body.list;
  const itemName = req.body.name;
  
  const newItem = new List({ name: itemName });
  
  if (listName) {
    List.findOne({ name: listName }, function (err, foundList) {
      if (err) {
        console.log(err)
      } else {
        console.log(foundList.items)
        foundList.items.push(newItem)
        foundList.save();
        res.redirect(`/${listName}`);
      }
      
    })
  }
  
})


app.post('/delete',  (req, res) => {
    const checkedId = req.body.checkbox;
    const listName = req.body.listName;

    console.log(req.body.checkbox);
    if (listName === currentDay) {
        Item.findByIdAndDelete(checkedId, function (err, result) {
            if (!err) {
            console.log("Successfully deleted checked item.");
            res.redirect("/");
      }
        });
        
    }  else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }
})




app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000");
});
