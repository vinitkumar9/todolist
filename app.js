const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

const itemsSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const Item = mongoose.model("item", itemsSchema);

const List = mongoose.model("list", listSchema);

const item1 = new Item({
  name: "Welcome to the todo list app."
});

const item2 = new Item({
  name: "Click the + sign to add an item."
});

const item3 = new Item({
  name: "<--Click here to delete the item."
});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {

  // let day = date.getDate();

  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Items added Succesfully.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        kindOfDay: "Today",
        newListItem: foundItems
      });
    }
  });

});

app.get("/:listName", function(req, res) {
  const name = _.capitalize(req.params.listName);

  List.findOne({name: name}, function(err, foundList){
    if(!err){
      if(!foundList){
        const list = new List({
          name: name,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+name);
      } else{
        res.render("list", {
          kindOfDay: name,
          newListItem: foundList.items
        });
      }
    }
  });

});

app.post("/", function(req, res) {
   const itemName = req.body.newItem;
   const listName = req.body.listName;

   const item = new Item({
     name: itemName
   });

   if(listName === "Today"){
     item.save();
     res.redirect("/");
   } else{
     List.findOne({name: listName}, function(err, foundList){
       if(!err){
         foundList.items.push(item);
         foundList.save();
         res.redirect("/" + listName);
       }
     });
   }
});

app.post("/delete", function(req, res){

  const id = req.body.checkbox;
  const name = req.body.listName;

  if(name === "Today"){
  Item.findByIdAndRemove(id, function(err){
    if(err){
      console.log(err);
    } else{
      res.redirect("/");
    }
  });
} else{
  List.findOneAndUpdate({name: name}, {$pull: {items: {_id: id}}}, function(err){
    if(!err){
      res.redirect("/" + name);
    }
  });
}
});


app.listen(3000, function() {
  console.log("Sever Started on port 3000");
});
