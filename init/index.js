const mongoose = require('mongoose');
const initData = require("./data.js");
const Listing = require('../models/listing.js');

const mongo_url = 'mongodb://localhost:27017/WANDERLUST';

main()
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(mongo_url);
}

const initDB = async () => {
  await Listing.deleteMany({});
  await Listing.insertMany(initData.data);
  console.log("Database Initialized with sample data");
};

initDB();
