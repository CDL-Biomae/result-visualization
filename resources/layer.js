// const hydroSectors = require('../layers/SecteurHydro_FXX.json')
// const streamsRaw = require('../layers/paot_ctxt_cours_deau.json')

module.exports.getHydroSector = (callback) => {
    return callback(hydroSectors.features)
}
module.exports.getStream = ({query}, callback) => {
    if (query.classifica) {
        const streamsFiltered = streamsRaw.features.filter(stream => stream.properties.classifica==query.classifica)
        return callback(streamsFiltered)
    } else {
        callback({})
    }
}