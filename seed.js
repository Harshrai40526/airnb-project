const mongoose = require("mongoose");
const Listing = require("./models/listing");

const mongo_url = "mongodb://localhost:27017/WANDERLUST";

async function seedDB() {
  await mongoose.connect(mongo_url);
  console.log("MongoDB connected");

  
  console.log("Old listings deleted");

  const listings = [
    {
      title: "Cozy Beach House",
      description: "Beautiful beachside house with ocean view",
      image: { filename: "listingimage", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e" },
      price: 4500,
      location: "Goa",
      country: "India"
    },
    {
      title: "Mountain View Cabin",
      description: "Peaceful cabin in the mountains",
      image: { filename: "listingimage", url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e" },
      price: 3200,
      location: "Manali",
      country: "India"
    },
    {
      title: "Luxury Apartment",
      description: "Modern apartment in city center",
      image: { filename: "listingimage", url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688" },
      price: 6000,
      location: "Mumbai",
      country: "India"
    },
    
  ];

  // 🔁 duplicate karke 50 banana
  const finalListings = [];
  for (let i = 0; i < 17; i++) {
    listings.forEach(l => finalListings.push({ ...l }));
  }

  await Listing.insertMany(finalListings);
  console.log("50 listings added ✅");

  mongoose.connection.close();
}

seedDB();
