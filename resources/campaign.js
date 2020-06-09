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
      `SELECT pack_id, sandre, Analysis.name, prefix, value  FROM Analysis JOIN Pack ON Pack.id=Analysis.pack_id JOIN Measurepoint ON Measurepoint.id=Pack.measurepoint_id WHERE Measurepoint.reference like "${query.campaign}%"`,
      (err, result) => {
        if (err) throw err;
        return callback(result);
      }
    );
  } else {
    return callback(null);
  }
};
module.exports.getAllWithToxResult = ({ query }, callback) => {
  let output = { campaign: [] };
  rawDatabase.query(
    "SELECT project_id, Campaign.id as campaignId, Campaign.reference as campaignReference, Place.id as placeId, Place.reference as placeReference, Place.name, Measurepoint.id as measurepointId, Measurepoint.reference as measurepointReference, Measurepoint.longitude as longitude, Measurepoint.latitude as latitude, Measurepoint.code_t0_id, Pack.id as packId, Pack.nature as packNature FROM Campaign JOIN Place ON Place.campaign_id=Campaign.id JOIN Measurepoint ON Measurepoint.place_id=Place.id JOIN Pack ON Pack.measurepoint_id=Measurepoint.id ",
    (err, result) => {
      if (err) throw err;
      result.forEach(
        ({
          project_id,
          campaignId,
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
                  code_t0_id,
                  measurepoint: [
                    {
                      id: measurepointId,
                      reference: measurepointReference,
                      longitude,
                      latitude,
                      pack: [{ id: packId, nature: packNature }],
                    },
                  ],
                });
            }
          } else {
            output.campaign.push({
              project_id: project_id,
              id: campaignId,
              reference: campaignReference,
              place: [
                {
                  id: placeId,
                  reference: placeReference,
                  name: name,
                  code_t0_id,
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

      treatedDatabase.query(
        `SELECT * FROM toxtable WHERE version=${query.version}`,
        (err, result) => {
          if (err) throw err;
          result.forEach((row) => {
            output.campaign.forEach((campaignChecked) => {
              campaignChecked.place.forEach((placeChecked) => {
                const placeFound = placeChecked.measurepoint.find(
                  (point) => point.id == row.measurepoint_id
                );
                if (placeFound) {
                  if (!placeChecked.toxicity) {
                    placeChecked.toxicity = {};
                  }
                  if (row.male_survival_7_days) {
                    placeChecked.toxicity.male_survival_7_days =
                      row.male_survival_7_days;
                  }
                  if (row.alimentation) {
                    placeChecked.toxicity.alimentation = row.alimentation;
                  }
                  if (row.neurotoxicity) {
                    placeChecked.toxicity.neurotoxicity = row.neurotoxicity;
                  }
                  if (row.percent_inhibition_fecondite) {
                    placeChecked.toxicity.fecondity =
                      row.percent_inhibition_fecondite;
                  }
                }
              });
            });
          });
          treatedDatabase.query(
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
                            placeChecked.chemistryStart = new Date(row.date);
                          if (row.date_id == 7)
                            placeChecked.chemistryEnd = new Date(row.date);
                        }
                      }
                    });
                  });
                });
              });
              output.campaign.forEach((campaignChecked) => {
                campaignChecked.place.forEach((placeChecked) => {
                  if (
                    placeChecked.chemistryEnd &&
                    placeChecked.chemistryStart
                  ) {
                    placeChecked.chemistryDays =
                      (placeChecked.chemistryEnd -
                        placeChecked.chemistryStart) /
                        (1000 * 3600 * 24) <
                      14
                        ? 7
                        : 21;
                  }
                });
              });
              return callback(output);
            }
          );
        }
      );
    }
  );
};
