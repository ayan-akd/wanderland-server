const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;

//middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
    ],
    credentials: true,
  })
);
app.use(express.json());

//  MONGODB DATABASE USER PASSWORD

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.udorxk7.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const blogCollection = client.db("wanderlandDB").collection("blogs");
    const wishlistCollection = client.db("wanderlandDB").collection("wishlists");
    const commentsCollection = client.db("wanderlandDB").collection("comments");

    //get operation
    app.get("/blogs", async (req, res) => {
      try {
        const result = await blogCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    app.get("/blogs/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await blogCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    })

    app.get("/wishlists", async (req, res) => {
      try {
        let query = {};
        if (req.query?.email) {
          query = { email: req.query.email };
        }
        const result = await wishlistCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/comments/:blogId", async (req, res) => {
      try {
        const blogId = req.params.blogId;
        const query = { blogId };
        const comments = await commentsCollection.find(query).toArray();
        res.send(comments);
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
    
    app.get("/update/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await blogCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    })

    app.get("/featured", async (req, res) => {
      try {
        const result = await blogCollection
          .aggregate([
            {
              $addFields: {
                longDisLength: { $strLenCP: "$longDis" }
              }
            },
            {
              $sort: { longDisLength: -1 }
            },
            {
              $limit: 10
            }
          ])
          .toArray();
    
        res.send(result);
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
    
    
    

    //post operation
    app.post("/blogs", async (req, res) => {
      try{
        const newBlog = req.body;
        const result = await blogCollection.insertOne(newBlog);
        res.send(result);
      console.log(result);
        }
        catch(error){
          console.log(error);
        }
     
    });

    app.post("/wishlists", async (req, res) => {
      try {
        const newWishlist = req.body;
        const existingWishlist = await wishlistCollection.findOne({
          email: newWishlist.email,
          blogId: newWishlist.blogId
        });
    
        if (existingWishlist) {
          // A document with the same email and blogId already exists
          res.status(409).json({ message: "Duplicate entry" });
        } else {
          // Insert the new document
          const result = await wishlistCollection.insertOne(newWishlist);
          res.status(201).json({ insertedId: result.insertedId });
        }
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
    
    app.post("/comments", async (req, res) => {
      try {
        const newComment = req.body;
        const result = await commentsCollection.insertOne(newComment);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    })
    

    //Delete operation
    app.delete("/wishlists/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await wishlistCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    //Update operation
    app.put("/update/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const data = req.body;
        const filter = {_id: new ObjectId(id)}
        const updatedBlog = {
          $set: {
            name: data.name,
            category: data.category,
            shortDis: data.shortDis,
            longDis: data.longDis,
            photo: data.photo,
            userPhoto: data.userPhoto,
          }
        }
        const result = await blogCollection.updateOne(filter, updatedBlog);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Crud is running...");
});

app.listen(port, () => {
  console.log(`Simple Crud is Running on port ${port}`);
});