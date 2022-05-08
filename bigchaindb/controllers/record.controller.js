const bdb = require('../bdb'),
    controllers = {
        disease: require('../controllers/disease.controller'),
        hospital: require('../controllers/hospital.controller'),
        doctor: require('../controllers/doctor.controller')
    },
    Record = require("../models/Record");


async function create(data, res) {
    data.hospital = await controllers.hospital.login({hospital: data.bc_addresses.hospital})

    const response = {
        disease: await controllers.disease.create(data, res)
    }

    // Create Record
    const record = new Record({
        disease_id: response.disease.receipt ? response.disease.receipt.asset.data._id : response.disease._id,
        diagnose: data.cipher.diagnose,
        bc_tx_address: data.cipher.bc_tx_address,
        doctor_bc_address: data.bc_addresses.doctor
    })

    response.record = await bdb.create_tx(
        record,
        {diagnose: data.metadata.diagnose},
        data.hospital.ed25519_private_key,
        data.hospital.ed25519_public_key,
        res
    )

    return {status: 201, response}
}

async function index(data) {
    const result = {}

    result.disease = await controllers.disease.read(data)
    delete result.disease.hospital_bc_address
    delete result.disease.patient_bc_address

    result.hospital = await controllers.hospital.read(data)
    delete result.hospital.bc_address

    result.records = await bdb.assets.aggregate([{
        $match: {'data.disease_id': result.disease._id}
    }, {
        $project: {
            _id: 0,
            'data.model': 0,
            'data._id': 0,
            'data.disease_id': 0
        }
    }, {
        $lookup: {
            from: 'assets',
            localField: 'data.doctor_bc_address',
            foreignField: 'data.bc_address',
            as: 'data.doctor'
        }
    }, {
        $project: {
            'data.doctor._id': 0,
            'data.doctor.id': 0,
            'data.doctor.data.model': 0,
            'data.doctor.data._id': 0,
        }
    }, {
        $addFields: {
            'data.metadata.bdb_id': '$id',
            'data.doctor': {
                $arrayElemAt: ['$data.doctor.data', 0]
            }
        }
    }, {
        $replaceRoot: {
            newRoot: '$data'
        }
    }]).toArray();

    return result
}

async function read(data) {
    const result = {}

    result.doctor = await controllers.doctor.read(data)
    result.disease = await controllers.disease.read(data)

    result.bdb.record = await bdb.assets.find({
        'data.model': "Record",
        'data.date': data.record
    });

    // result.bdb.metadata = await bdb.metadata.find({
    //     'id': result.bdb.record.id
    // })

    return result
}

module.exports = {
    create,
    index,
    read
}
