const express = require('express')
const app = express()
const cors = require('cors') // Work-around for same origin policy
const morgan = require('morgan') // For logging


let persons = [
  {
    "name": "Arto Hellas",
    "number": "040-123456",
    "id": "1"
  },
  {
    "name": "Ada Lovelace",
    "number": "39-44-5323523",
    "id": "2"
  },
  {
    "name": "Dan Abramov",
    "number": "12-43-234345",
    "id": "3"
  },
  {
    "name": "Mary Poppendieck",
    "number": "39-23-6423122",
    "id": "4"
  }
]

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

app.use(cors())
app.use(express.json())
app.use(morgan(morganCustom))

app.get('/api/persons', (request, response) => {
  response.json(persons)
})

app.get('/info', (request, response) => {
  response.send(
    `
    <h2>Phonebook has info for ${persons.length} people</h2>
    <h2>${(new Date()).toString()}</h2>
    `
  )
})

app.get('/api/persons/:id', (request, response) => {
  const reqId = request.params.id
  const reqPerson = persons.find(person => person.id === reqId)
  reqPerson === undefined ?
    response.status(404).end()
  :
    response.json(reqPerson)
})


app.post('/api/persons/',(request, response) => {
  const data = request.body
  if (!data.hasOwnProperty("name") || !data.hasOwnProperty("number")) {
    return (
      response
      .status(400)
      .send(JSON.stringify({error: "JSON must have valid keys: name, number"}))
      .end()
    )
  }
  if (persons.find(person => person.name === data.name)) {
    return (
      response
      .status(400)
      .send(JSON.stringify({error: "Name must be unique"}))
      .end()
    )
  }
  const person = {
    name: data.name,
    number: data.number,
    id: Math.floor(Math.random() * 100000000)
  }
  persons.push(person)
  response.json(person)
})


app.delete('/api/persons/:id', (request, response) => {
  const reqId = request.params.id
  persons = persons.filter(person => person.id !== reqId)
  response.status(204).end()
})


const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" })
}

app.use(unknownEndpoint)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})