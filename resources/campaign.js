const { rawDatabase, treatedDatabase } = require.main.require("./database");

module.exports.getAll = (callback) => {
  rawDatabase.query("SELECT * FROM Campaign", (err, results) => {
    if (err) throw err;
    return callback(results);
  });
};
module.exports.getOneWithChemistryResult = ({ query }, callback) => {
  if (query.campaign) {
    rawDatabase.query(
      `SELECT pack_id, sandre, value  FROM Analysis JOIN Pack ON Pack.id=Analysis.pack_id JOIN Measurepoint ON Measurepoint.id=Pack.measurepoint_id WHERE Measurepoint.reference like "${query.campaign}%"`,
      (err, result) => {
        if (err) throw err;
        let output = {};
        result.forEach((row) => {
          if (output[row.pack_id]) {
            output[row.pack_id][row.sandre] = row.value;
          } else {
            output[row.pack_id] = { [row.sandre]: [row.value] };
          }
        });
        return callback(output);
      }
    );
  } else {
    return callback(null);
  }
};
module.exports.getAllWithToxResult = ({ query }, callback) => {
  let output = { campaign: [] };
  rawDatabase.getConnection((err, rawDatabaseConnection) => {
    if (err) throw err;
    rawDatabaseConnection.connect(() => {
      rawDatabaseConnection.query(
        "SELECT project_id, Campaign.id as campaignId, Campaign.name as campaignName, Campaign.reference as campaignReference, Place.id as placeId, Place.reference as placeReference, Place.name, Measurepoint.id as measurepointId, Measurepoint.reference as measurepointReference, Measurepoint.longitudeSpotted as longitude, Measurepoint.latitudeSpotted as latitude, Measurepoint.code_t0_id, Pack.id as packId, Pack.nature as packNature FROM Campaign JOIN Place ON Place.campaign_id=Campaign.id JOIN Measurepoint ON Measurepoint.place_id=Place.id JOIN Pack ON Pack.measurepoint_id=Measurepoint.id ",
        (err, result) => {
          if (err) throw err;
          result.forEach(
            ({
              project_id,
              campaignId,
              campaignName,
              campaignReference,
              placeId,
              placeReference,
              name,
              measurepointId,
              measurepointReference,
              longitude,
              latitude,
              code_t0_id,
              packId,
              packNature,
            }) => {
              const campaignChecked = output.campaign.find(
                (campaign) => campaign.id == campaignId
              );
              if (campaignChecked) {
                const placeChecked = campaignChecked.place.find(
                  (place) => place.id == placeId
                );
                if (placeChecked) {
                  const measurepointChecked = placeChecked.measurepoint.find(
                    (measurepoint) => measurepoint.id == measurepointId
                  );
                  if (measurepointChecked) {
                    output.campaign
                      .find((campaign) => campaign.id == campaignId)
                      .place.find((place) => place.id == placeId)
                      .measurepoint.find(
                        (measurepoint) => measurepoint.id == measurepointId
                      )
                      .pack.push({ id: packId, nature: packNature });
                  } else {
                    output.campaign
                      .find((campaign) => campaign.id == campaignId)
                      .place.find((place) => place.id == placeId)
                      .measurepoint.push({
                        id: measurepointId,
                        reference: measurepointReference,
                        longitude,
                        latitude,
                        code_t0_id,
                        pack: [{ id: packId, nature: packNature }],
                      });
                  }
                } else {
                  output.campaign
                    .find((campaign) => campaign.id == campaignId)
                    .place.push({
                      id: placeId,
                      reference: placeReference,
                      name: name,
                      measurepoint: [
                        {
                          id: measurepointId,
                          reference: measurepointReference,
                          longitude,
                          latitude,
                          code_t0_id,
                          pack: [{ id: packId, nature: packNature }],
                        },
                      ],
                    });
                }
              } else {
                output.campaign.push({
                  project_id: project_id,
                  id: campaignId,
                  name: campaignName,
                  reference: campaignReference,
                  place: [
                    {
                      id: placeId,
                      reference: placeReference,
                      name: name,
                      measurepoint: [
                        {
                          id: measurepointId,
                          reference: measurepointReference,
                          longitude,
                          latitude,
                          code_t0_id,
                          pack: [{ id: packId, nature: packNature }],
                        },
                      ],
                    },
                  ],
                });
              }
            }
          );
          treatedDatabase.getConnection((err, treatedDatabaseConnection) => {
            if (err) throw err;

            treatedDatabaseConnection.connect(() => {
    
              treatedDatabaseConnection.query(
                `SELECT * FROM toxtable WHERE version=${query.version}`,
                (err, result) => {
                  if (err) throw err;
                  result.forEach((row) => {
                    output.campaign.forEach((campaignChecked) => {
                      campaignChecked.place.forEach((placeChecked) => {
                        placeChecked.measurepoint.forEach((measurepointChecked) => {
                          if (measurepointChecked.id == row.measurepoint_id) {
                            if (!measurepointChecked.toxicity) {
                              measurepointChecked.toxicity = {};
                            }
                            if (row.male_survival_7_days) {
                              measurepointChecked.toxicity.male_survival_7_days =
                                row.male_survival_7_days;
                            }
                            if (row.alimentation) {
                              measurepointChecked.toxicity.alimentation =
                                row.alimentation;
                            }
                            if (row.neurotoxicity) {
                              measurepointChecked.toxicity.neurotoxicity =
                                row.neurotoxicity;
                            }
                            if (row.percent_inhibition_fecondite) {
                              measurepointChecked.toxicity.fecondity =
                                row.percent_inhibition_fecondite;
                            }
                            if (row.molting_cycle_conformity) {
                              measurepointChecked.toxicity.molting_cycle_conformity =
                                row.molting_cycle_conformity;
                            }
                            if (row.surface_retard_conformity) {
                              measurepointChecked.toxicity.surface_retard_conformity =
                                row.surface_retard_conformity;
                            }
                          }
                        });
                      });
                    });
                  });
                  treatedDatabaseConnection.query(
                    `SELECT * FROM key_dates WHERE date_id IN (6,7) and version=${query.version}`,
                    (err, result) => {
                      if (err) throw err;
                      result.forEach((row) => {
                        output.campaign.forEach((campaignChecked) => {
                          campaignChecked.place.forEach((placeChecked) => {
                            placeChecked.measurepoint.forEach((measurepointChecked) => {
                              if (
                                measurepointChecked.pack.find(
                                  (packChecked) => packChecked.nature == "chemistry"
                                )
                              ) {
                                const measurepointFound =
                                  row.measurepoint_id == measurepointChecked.id;
                                if (measurepointFound && row.date) {
                                  if (row.date_id == 6)
                                    measurepointChecked.chemistryStart = new Date(row.date);
                                  if (row.date_id == 7)
                                    measurepointChecked.chemistryEnd = new Date(row.date);
                                }
                              }
                            });
                          });
                        });
                      });
                      output.campaign.forEach((campaignChecked) => {
                        campaignChecked.place.forEach((placeChecked) => {
                          placeChecked.measurepoint.forEach((measurepointChecked) => {
                            if (
                              measurepointChecked.chemistryEnd &&
                              measurepointChecked.chemistryStart
                            ) {
                              measurepointChecked.chemistryDays =
                                (measurepointChecked.chemistryEnd -
                                  measurepointChecked
                                    .chemistryStart) /
                                  (1000 * 3600 * 24) <
                                  14
                                  ? 7
                                  : 21;
                            }
                          });
                        });
                      });
                      treatedDatabaseConnection.release()
                      rawDatabaseConnection.release()
                      return callback(output);
                    }
                  );
                }

      );
          })
          })
        }
      );
    })
  })
};
