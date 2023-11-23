const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require("express");
const app = express()
const port = process.env.PORT || 5000;
const cors = require("cors")
app.use(cors())
app.use(express.json())
require("dotenv").config()
const jwt = require("jsonwebtoken")


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1u9t2.mongodb.net/test?retryWrites=true&w=majority`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


const verifyToken = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: "Unauthorized access" })
    }
    const token = authorization.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
        if (error) {
            return res.status(403).send({ error: true, message: "forbidden access" })
        }
        req.decoded = decoded;
        next()
    })
}


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const kidsCollection = client.db("kidsZoneDb").collection("products");
        const myToys = client.db("myToys").collection("toys")

        // app.get("/products", verifyToken, async (req, res) => {
        //     const decoded = req.decoded;

        //     const email = req.query?.email;


        //     if (decoded?.email !== email) {
        //         res.status(403).send({ error: true, message: "forbiden access." })
        //     }

        //     const result = await kidsCollection.find().toArray()
        //     res.send(result)
        // })
        app.get("/products", verifyToken, async (req, res) => {
            try {
                const decoded = req.decoded;
                const email = req.query?.email;
                const search = req.query?.search
                if (decoded?.email?.email !== email) {
                    return res.status(403).send({ error: true, message: "forbidden access." });
                }
                const query = { ToyName: { $regex: new RegExp(search, 'i') } };

                const result = await kidsCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: true, message: "Internal Server Error" });
            }
        });

        //add toy the db



        app.post("/jwt", async (req, res) => {
            const email = req.body;
            const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: "1hr" })
            res.send({ token })
        })


        app.post("/addtoy", async (req, res) => {
            const toyInfo = req.body;

            const result = await myToys.insertOne(toyInfo);
            res.send(result)
        })


        app.get("/mytoys", async (req, res) => {
            const result = await myToys.find().toArray();
            res.send(result)
        })

        app.delete("/mytoys/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await myToys.deleteOne(query);
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get("/", (req, res) => {
    res.send("Welcome to kids zone")
})

app.listen(port, () => {
    console.log("server is running.");
})