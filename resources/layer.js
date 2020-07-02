const hydroSectors = require('../layers/SecteurHydro_FXX.json')
const streamsRaw = require('../layers/paot_ctxt_cours_deau.json')

module.exports.getHydroSector = (callback) => {
    return callback(hydroSectors.features)
}
module.exports.getStream = (callback) => {
    const streamsFiltered = streamsRaw.features.filter(stream => stream.classifica==1)
    return callback(streamsFiltered)
}