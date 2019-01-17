const express = require('express')
const app = express()
const bodyParser = require('body-parser')
require('dotenv').config();
const user = require("./model/username");

const cors = require('cors')

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MLAB_URI, { useMongoClient: true });

app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', async (req, res, next) => {
  try {
    await user.findOne({ username: req.body.username }, (err, checkUser) => {
      if (err) console.log(err);
      if (checkUser) res.json({ message: "user already exist" });
      let newUser = new user({ username: req.body.username });
      newUser.save((err, data) => {
        if (err) return console.log("savedUserError", err.message);
        console.log(data)
        return res.json({ "Your userID": data._id, "Your username": data.username });
      });
    });
  } catch (err) {
    return next(err);
  }
});

app.post('/api/exercise/add', async (req, res, next) => {
  try {
    if (!req.body.userId || !req.body.description
      || !req.body.duration || !req.body.date) {
      res.json({ Message: "All fields are required!" });
    } else if (parseInt(req.body.duration) == NaN) {
      res.json({ Message: "Enter an integer" });
    } else if (/^[0-9]{4}-[0-9]{0,2}-[0-9]{0,2}$/.test(req.body.date) == false) {
      res.json({ Message: "Enter the required date format!" });
    } else {

      let newExercise = {
        description: req.body.description,
        duration: req.body.duration,
        date: req.body.date
      };

      let userId = req.body.userId;
      await user.findByIdAndUpdate(userId.toString(),
        { $push: { "exercise": newExercise } },
        { new: true },
        (err, foundUser) => {
          if (err) {
            return res.json({ Message: err.message });
          } else {
            return res.json(foundUser);
          }
        });
    }
  } catch (err) {
    return next(err);
  }
});


// Log out the exercise of a particuler user
app.get('/api/exercise/log', async (req, res, next) => {
  // GET /api/exercise/log?{userId}[&from][&to][&limit]
  const userId = req.query.userId;
  const from = new Date(req.query.from);
  const to = new Date(req.query.to);
  const limit = req.query.limit;
  console.log(req.query);
  if (!userId || !from || !to) {
    res.json({ Message: "Enter the required query fields!" });
  } else {
    await user.findOne({_id: userId}, (err, foundUser) => {
      let results = foundUser.exercise;
      if (err) {
        res.json({message: err.message});
      } else {
        if (foundUser) {
          results = results.filter((item) => {
            return item.date >= from && item.date <= to;
          });
        }
        if (!isNaN(limit)) {
          results = results.splice(0, limit);
        }
      } 
      res.json(results);
    });
  }
});


// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: 'not found' })
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode)
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
