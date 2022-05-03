const bdb = require('../bigchaindb/controllers/patient.controller'),
    bc = require('../blockchain/controllers/patient.controller')


async function create(req, res) {
    const body = req.body

    // bc.create()

    const { status, response } = await bdb.create(body, res)

    res.status(status).json(response).end()
}

async function read(req, res) {
    const response = await bdb.read(req.params)

    res.status(200).json(response).end()
}

async function login(req, res) {
    const response = await bdb.login(req.query)

    res.status(200).json(response).end()
}


module.exports = {
    create,
    read,
    login
}
