const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vmx0jtd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
     client.connect();
    const toyCollection = client.db('toyPlace').collection('toys');
    // get all toy
    app.get('/alltoys', async (req, res) => {
      const result = await (await toyCollection.find().limit(20).toArray()).reverse();
      res.send(result);
    });
    // search
    const indexKey = { toy: 1 };
    const indexOption = { name: "toySearch" };
    const result = await toyCollection.createIndex(indexKey, indexOption);

    // post single toy
    app.post('/toys', async (req, res) => {
      const toy = req.body;
      const result = await toyCollection.insertOne(toy);
      res.send(result);
    });
    // get filtered data
    app.get('/alltoy', async (req, res) => {
      let query = {};
      if (req.query.category) {
        query = { category: req.query.category }
      }
      const result = await toyCollection.find(query).toArray();
      res.send(result);
    });

    // search
    app.get("/alltoystext/:text", async (req, res) => {
      const text = req.params.text;
      const result = await toyCollection
        .find({
          $or: [
            { toy: { $regex: text, $options: "i" } }
          ],
        })
        .toArray();
      res.send(result);
    });
    // get toy by email
    app.get('/mytoys', async (req, res) => {
      let query = {};
      const sortPrice = req.query.sort === 'desc' ? -1 : 1;
      if (req.query.email) {
        query = { email: req.query.email }
      }
      const result = await (await toyCollection.find(query).sort({ price : sortPrice }).toArray()).reverse();
      res.send(result);
    });
    // get by id
    app.get('/alltoys/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        projection: { sellerName: 1, email: 1, rating: 1, quantity: 1, toy: 1, price: 1, photo: 1, details: 1, category: 1 },
      };
      const result = await toyCollection.findOne(query, options);
      res.send(result);
    });
    // update
    app.put('/updatetoy/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedToy= req.body;
      const toy = {
        $set: {
          price : updatedToy.price,
          quantity : updatedToy.quantity,
          details : updatedToy.details
        },
      };
      const result = await toyCollection.updateOne(filter, toy);
      res.send(result);
    });
    // delete toy
    app.delete('/toys/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.deleteOne(query);
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Toy is running')
})
app.listen(port, () => {
  console.log(`Car Toy Server is running on port: ${port}`);
})