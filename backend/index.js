require('dotenv').config()

const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')

const Person = require('./mongoModels/person')


const morganCustom = (tokens, request, response) => {
  const method = tokens.method(request, response)
  if (method === "POST") {
    return [
      method,
      tokens.url(request, response),
      tokens.status(request, response),
      tokens.res(request, response, 'content-length'),
      "-",
      tokens["response-time"](request, response),
      "ms",
      JSON.stringify(request.body)
    ].join(" ")
  }
  return [
    method,
    tokens.url(request, response),
    tokens.status(request, response),
    tokens.res(request, response, 'content-length'),
    "-",
    tokens["response-time"](request, response),
    "ms"
  ].join(" ")
}


/*
Makes automatically routes for each file in frontend and returns the file.
E.g. 
  GET host/ -> index.html (special case),
  GET host/index.html -> index.html (normal case),
  GET host/script -> script.js (normal case)
  GET host/scripts/script2 -> script2.js (normal case)
*/
app.use(express.static('./frontend'))
/*
Basically response.setHeader('Access-Control-Allow-Origin', '*')
For all responses
*/
app.use(cors())
// If header: Content-Type: application/json then parse it to object
app.use(express.json())
// Custom logger
app.use(morgan(morganCustom))



app.get('/info', (request, response) => {
  Person.countDocuments({})
    .then(count => {
      response.send(
        `
        <h2>Phonebook has info for ${count} people</h2>
        <h2>${(new Date()).toString()}</h2>
        `
      )
    })
    .catch(error => {
      console.error(`Couldn't respond to /info request`)
      response.send(
        `
        <h2>Phonebook database won't respond</h2>
        <h2>${(new Date()).toString()}</h2>
        `
      )
    })
})

app.get('/api/persons', (request, response, next) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })
  .catch(error => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id).then(person => {
    person === null ?
      response.status(404).end()
    :
      response.json(person)
  })
  .catch(error => next(error))
})


app.post('/api/persons', (request, response, next) => {
  const body = request.body
  if (!body.hasOwnProperty("name") || !body.hasOwnProperty("number")) {
    return response.status(400).json({error: "JSON must have valid keys: name, number"})
  }
  const person = new Person({
    name: body.name,
    number: body.number
  })
  /* Check if database name already exists in database
  Person.findOne({name: body.name}).then(dbPerson => {
    if (dbPerson !== null) {
      const error = new Error(`Person with name: ${body.name} already exists`)
      error.name = "PersonAlreadyExists"
      return Promise.reject(error)
    }
    return person.save()
  })
  */
  person.save()
    .then(savedPerson => {
      response.status(201).json(savedPerson)
    })
    .catch(error => next(error))
})


app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body
  if (!body.hasOwnProperty("name") || !body.hasOwnProperty("number")) {
    return response.status(400).json({error: "JSON must have valid keys: name, number"})
  }
  const person = {name: body.name, number: body.number}
  Person.findByIdAndUpdate(request.params.id, person, {new: true})
    .then(updatedPerson => {
      updatedPerson !== null ?
        response.json(updatedPerson)
      :
        response.status(500).json({error: "Couldn't find person responding to the id"})
    })
    .catch(error => next(error))
})


app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})



const unknownEndpoint = (request, response) => {
  response.status(404).json({ error: "unknown endpoint" })
}
app.use(unknownEndpoint)


const errorHandler = (error, request, response, next) => {
  const eName = error.name

  console.error(error.message)

  if (error.name === "CastError") {
    return response.status(400).send({error: "malformatted id"})
  }

  if (eName === "PersonAlreadyExists") {
    return response.status(400).json({error: `person with the same name already exists in database`})
  }
  
  if (eName === "MongooseError") {
    return response.status(500).json({error: "database error"})
  }

  next(error)
}
app.use(errorHandler)


const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})