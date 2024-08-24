const mongoose = require('mongoose')

mongoose.set('strictQuery', false)


const url = process.env.MONGODB_URI


console.log(`Connecting to mongoDB`)
mongoose.connect(url)
  .then(result => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })

const personSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 3,
    required: true
  },
  number: {
    type: String,
    validate: {
      validator: function(arg) {
        return /^\d{2}-\d{6,}$|^\d{3}-\d{5,}$/.test(arg)
      },
      message: props => `${props.value} is not valid phone number, format: xx-xxxxxx... or xxx-xxxxx... where x=digit(0-9), ...=as many digits as you want`
    },
    required: true
  }
})

personSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})


module.exports = mongoose.model('Person', personSchema)