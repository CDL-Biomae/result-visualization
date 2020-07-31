<template>
  <section class="main">
    <div
      v-if="result"
      draggable
      @dragstart="getDragStartingPosition($event)"
      @dragend="getDragEndingPosition($event)"
    >
      <img class="compass" src="../../public/compass.png" />
    </div>
    <div v-if="measurepointChoiceFormShown" class="measurepoint-choice-form">
      <table class="table center">
        <thead>
          <tr>
            <th>Point</th>
            <th v-for="campaign in measurepointChoiceDict" :key="campaign.id">{{campaign.reference}}</th>
          </tr>
        </thead>
        <tfoot v-for="point in currentPoints" :key="point.id">
          <tr v-if="point.number && point.id">
            <td>
              {{point.number}}
              <input type="checkbox" v-model="point.shown" />
            </td>
            <td v-for="campaign in measurepointChoiceDict" :key="campaign.id">
              <div
                v-if="point.reference.find(pointReference => pointReference.search(campaign.reference)!=-1)!=undefined && campaign.placeShown.find(place => place.number==point.number) && campaign.placeShown.find(place => place.number==point.number).gotOneResultPerBiotest && singleResultShown"
              >
                {{campaign.placeShown.find(place => place.number==point.number).reference}}
                <input
                  type="checkbox"
                  v-model="campaign.placeShown.find(place => place.number==point.number).shown"
                />
              </div>
              <div
                v-if="point.reference.find(pointReference => pointReference.search(campaign.reference)!=-1)!=undefined && campaign.placeShown.find(place => place.number==point.number) && campaign.placeShown.find(place => place.number==point.number).gotOneResultPerBiotest==false"
              >
                <div
                  v-for="measurepoint in campaign.placeShown.find(place => place.number==point.number).measurepointShown"
                  :key="measurepoint.id"
                >
                  <span>{{measurepoint.reference}}</span>
                  <input
                    type="checkbox"
                    v-model="measurepoint.shown"
                    @change="chooseMeasurepoint($event,campaign.reference, campaign.placeShown.find(place => place.number==point.number).reference,measurepoint.reference)"
                  />
                </div>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
      <button class="button validate-choice-button" @click="validateMeasurepointChoice">OK</button>
      <button
        class="button validate-choice-button"
        @click="showAllPoints"
      >{{!allPointShown ? "Sélectionner":"Désélectionner"}} tous les points</button>
      <button
        class="button validate-choice-button"
        @click="showAllResults"
      >{{!allResultShown ? "Sélectionner":"Désélectionner"}} tous les résultats</button>
      <button
        v-if="multipleSameBiotestPerPlaceCampaignList.length"
        class="button validate-choice-button"
        @click="switchNumberOfResult"
      >Afficher {{singleResultShown ? "deux":"qu'un"}} résultat{{singleResultShown ? "s":""}} par point</button>
    </div>
    <Legend
      name="title"
      v-if="biotestChosen && resultDescription.biotest"
      :title="(biotestChosen=='BBAC' || biotestChosen=='NQE') ? chemistryElementChosen : biotestChosen"
    />
    <Legend
      name="toxicity-result-legend"
      v-if="biotestChosen=='toxicité'"
      :data="resultDescription.campaign"
    />
    <Legend
      name="biotest-result-legend"
      v-if="resultDescription.biotest"
      :data="biotestChosen=='toxicité' ? '' : resultDescription.campaign"
      :biotest="biotestChosen"
      :NQEValidationPrecision="NqeT0NotValidatedColorShown"
      :title="biotestChosen=='NQE' ? 'NQE':'Seuils gradués'"
      :newColor="newColorsUsed"
    />
    <Legend
      name="reproduction-conformity"
      v-if="resultDescription.biotest=='toxicité'"
      :biotest="'mue'"
      :title="'Seuils'"
    />
    <Legend
      name="layer-legend"
      v-if="changedColorFeature.length"
      title="Région Hydrographique"
      :data="changedColorFeature"
    />
    <Legend name="custom-points-legend" v-if="customPointsAdded" :data="customPointNames" />
    <div v-if="!result" class="downloading-message">
      Chargement des données
      <span>{{downloadingPoints}}</span>
    </div>
    <div class="main-content">
      <div id="map" class="map"></div>
      <div v-if="result" class="selection-menu">
        <div class="selection-item">
          <input
            type="text"
            @keydown.enter="chooseOne"
            class="input is-small"
            v-model="campaignChoice"
            placeholder="Nom de campagne"
          />
          <button @click="chooseOne" class="button is-small is-primary">
            <i class="mdi mdi-check"></i>
          </button>
        </div>
        <div v-for="campaign in campaignChosenList" :key="campaign.id" class="selection-item">
          <span>{{campaign}}</span>
          <a @click="deleteCampaign(campaign)">
            <i class="mdi mdi-close"></i>
          </a>
        </div>
        <div v-if="currentPoints.length>1" class="selection-item">
          <span>Taille des points</span>
          <input
            type="range"
            min="10"
            max="50"
            step="0"
            @change="showResult"
            v-model="markerDimension"
          />
        </div>
        <div v-if="currentPoints.length>1" class="selection-item">
          <input type="checkbox" class="sub-sector-radio" @change="showResult" v-model="showNumber" />
          <span>Afficher les numéros</span>
        </div>
        <div v-if="measurepointChoiceMade" class="selection-item">
          <button class="button" @click="getMeasurepointChoice">Modifier la personalisation</button>
        </div>
        <div
          class="dropdown selection-item"
          :class="{'is-active':mapDropdownActive}"
          @click="mapDropdownActive=!mapDropdownActive;ChemistryDropdownActive=false; versionDropdownActive=false;NQEDropdownActive=false;biotestDropdownActive=false;"
        >
          <div class="dropdown-trigger">
            <button class="button" aria-haspopup="true" aria-controls="dropdown-menu">
              <span>
                Fond de carte
                <span v-if="mapChosen">: {{mapChosen}}</span>
              </span>
              <span class="icon is-small">
                <i class="mdi mdi-chevron-down" aria-hidden="true"></i>
              </span>
            </button>
          </div>
          <div class="dropdown-menu">
            <div class="dropdown-content">
              <a
                class="dropdown-item"
                @click="changeBackground('streets-v11');mapChosen='Streets';"
              >Streets</a>
              <a
                class="dropdown-item"
                @click="changeBackground('light-v10');mapChosen='Light';"
              >Light</a>
              <a class="dropdown-item" @click="changeBackground('dark-v10');mapChosen='Dark';">Dark</a>
              <a
                class="dropdown-item"
                @click="changeBackground('outdoors-v11');mapChosen='Outdoors';"
              >Outdoors</a>
              <a
                class="dropdown-item"
                @click="changeBackground('satellite-v9');mapChosen='Satellite';"
              >Satellite</a>
              <a
                class="dropdown-item"
                @click="changeBackground('satellite-streets-v11');mapChosen='Satellite-Streets';"
              >Satellite-Streets</a>
            </div>
          </div>
        </div>
        <div
          class="dropdown selection-item"
          :class="{'is-active':versionDropdownActive}"
          @click="versionDropdownActive=!versionDropdownActive;ChemistryDropdownActive=false; NQEDropdownActive=false;mapDropdownActive=false;biotestDropdownActive=false;"
        >
          <div class="dropdown-trigger">
            <button class="button" aria-haspopup="true" aria-controls="dropdown-menu">
              <span>Version : {{versionChosen}}</span>
              <span class="icon is-small">
                <i class="mdi mdi-chevron-down" aria-hidden="true"></i>
              </span>
            </button>
          </div>
          <div class="dropdown-menu">
            <div class="dropdown-content" v-for="element in version" :key="element.id">
              <a class="dropdown-item" @click="changeVersion(element.id)">{{element.id}}</a>
            </div>
          </div>
        </div>
        <div
          class="dropdown selection-item"
          :class="{'is-active':biotestDropdownActive}"
          @click="biotestDropdownActive=!biotestDropdownActive;ChemistryDropdownActive=false; versionDropdownActive=false;mapDropdownActive=false;NQEDropdownActive=false;"
        >
          <div class="dropdown-trigger">
            <button class="button" aria-haspopup="true" aria-controls="dropdown-menu">
              <span>
                Biotest
                <span v-if="biotestChosen">: {{biotestChosen}}</span>
              </span>
              <span class="icon is-small">
                <i class="mdi mdi-chevron-down" aria-hidden="true"></i>
              </span>
            </button>
          </div>
          <div class="dropdown-menu">
            <div class="dropdown-content">
              <a
                class="dropdown-item"
                @click="biotestChosen='alimentation'; showResult()"
              >Alimentation</a>
              <a
                class="dropdown-item"
                @click="biotestChosen='neurotoxicité AChE'; showResult()"
              >Neurotoxicité AChE</a>
              <a
                class="dropdown-item"
                @click="biotestChosen='reproduction'; showResult()"
              >Reproduction</a>
              <a
                v-if="singleResultShown"
                class="dropdown-item"
                @click="biotestChosen='toxicité'; showResult()"
              >Toxicité</a>
              <hr />
              <a class="dropdown-item" @click="biotestChosen='NQE'">NQE</a>
              <a class="dropdown-item" @click="biotestChosen='BBAC'">BBAC</a>
            </div>
          </div>
        </div>
        <div
          v-if="biotestChosen=='NQE'"
          class="dropdown selection-item"
          :class="{'is-active':NQEDropdownActive}"
          @click="NQEDropdownActive=!NQEDropdownActive;ChemistryDropdownActive=false; versionDropdownActive=false;mapDropdownActive=false;biotestDropdownActive=false;"
        >
          <div class="dropdown-trigger">
            <button class="button" aria-haspopup="true" aria-controls="dropdown-menu">
              <span>Element NQE : {{sandreChosen}}</span>
              <span class="icon is-small">
                <i class="mdi mdi-chevron-down" aria-hidden="true"></i>
              </span>
            </button>
          </div>
          <div class="dropdown-menu dropdown-chemistry">
            <div v-for="element in NQESandreList" :key="element.id" class="dropdown-content">
              <a
                class="dropdown-item"
                @click="sandreChosen=element.sandre; chemistryElementChosen=element.name; showResult()"
              >{{element.sandre}} : {{element.name}}</a>
            </div>
          </div>
        </div>
        <div
          v-if="biotestChosen=='BBAC'"
          class="dropdown selection-item"
          :class="{'is-active':ChemistryDropdownActive}"
          @click="ChemistryDropdownActive=!ChemistryDropdownActive;NQEDropdownActive=false; versionDropdownActive=false;mapDropdownActive=false;biotestDropdownActive=false;"
        >
          <div class="dropdown-trigger">
            <button class="button" aria-haspopup="true" aria-controls="dropdown-menu">
              <span>Element BBAC : {{sandreChosen}}</span>
              <span class="icon is-small">
                <i class="mdi mdi-chevron-down" aria-hidden="true"></i>
              </span>
            </button>
          </div>
          <div class="dropdown-menu dropdown-chemistry">
            <div v-for="element in threshold.chemistry" :key="element.id" class="dropdown-content">
              <a
                class="dropdown-item"
                @click="sandreChosen=element.sandre; chemistryElementChosen=element.parameter ;showResult()"
              >{{element.sandre}} : {{element.parameter}}</a>
            </div>
          </div>
        </div>
        <div class="selection-item">
          <div v-if="biotestChosen=='NQE'" class="selection-item selection-details">
            <input
              type="checkbox"
              class="sub-sector-radio"
              v-model="NqeT0Checked"
              @click="NqeT0NotValidatedColorShown=!NqeT0NotValidatedColorShown;showResult()"
            />
            <span>Prendre en compte la validité des témoins</span>
          </div>
        </div>
        <div class="selection-item">
          <div v-if="biotestChosen=='BBAC'" class="selection-item selection-details">
            <input
              type="checkbox"
              class="sub-sector-radio"
              v-model="newColorsChecked"
              @click="newColorsUsed=!newColorsUsed;showResult()"
            />
            <span>Nouvelles couleurs</span>
          </div>
        </div>
        <hr class="selection-item" />
        <button
          v-if="!hydroSectorAdded"
          @click="addHydroSectorLayer"
          class="button selection-item"
        >Ajouter les bassins versants</button>
        <div v-if="hydroSectorAdded" class="selection-item selection-details">
          <a @click="removeHydroSector">
            <i class="mdi mdi-close"></i>
          </a>
          <span>Retirer les bassins versants</span>
        </div>
        <div v-if="hydroSectorAdded" class="selection-item selection-details">
          <input type="checkbox" class="sub-sector-radio" v-model="subSectorShown" />
          <span>Afficher jusqu'aux sous-bassins</span>
        </div>
        <button
          v-if="!streamAdded"
          @click="addStreamLayer"
          class="button selection-item"
        >Ajouter les cours d'eau</button>
        <div v-if="streamAdded" class="selection-item selection-details">
          <a @click="removeStream">
            <i class="mdi mdi-close"></i>
          </a>
          <span>Retirer les cours d'eau</span>
        </div>
        <div
          v-if="streamAdded && streamClassificaMaxChosen<7"
          class="selection-item selection-details"
        >
          <a @click="addStreamLayer">
            <i class="mdi mdi-plus"></i>
          </a>
          <span>Rajouter des cours d'eau</span>
        </div>
        <hr class="selection-item" />
        <div v-show="LbRegionHyChosen" class="selection-item console">
          <strong class="selection-item">{{subSectorShown ? LbSecteurHChosen : LbRegionHyChosen}}</strong>
          <div class="selection-item">
            <span>Couleur de la région :</span>
            <a class="color-choice" @click="changeLayerColor">
              <v-swatches swatches="text-advanced" class="selection-item" v-model="colorChosen" />
            </a>
          </div>
          <div v-if="sliderShown">Opacité: {{sliderValue}}%</div>
          <input v-if="sliderShown" type="range" min="0" max="100" step="0" v-model="sliderValue" />
        </div>
        <div v-if="pointArrowIdList.length" class="selection-item">
          <span>Couleur des flèches</span>
          <a class="color-choice" @click="changeArrowColor">
            <v-swatches swatches="text-advanced" class="selection-item" v-model="arrowColorChosen" />
          </a>
        </div>
        <!-- <hr class="selection-item" /> -->
        <button @click="addCustomPoint" class="button selection-item">Ajouter un point</button>
      </div>
    </div>
  </section>
</template>


<script>
import axios from "axios";
import mapboxgl from "mapbox-gl";
import VSwatches from "vue-swatches";
import Legend from "@/components/legend";

import "vue-swatches/dist/vue-swatches.css";

export default {
  components: { VSwatches, Legend },
  data() {
    return {
      downloadingPoints: "",
      result: null,
      map: null,
      campaignChoice: null,
      campaignChosenList: [],
      mapDropdownActive: false,
      biotestDropdownActive: false,
      versionDropdownActive: false,
      NQEDropdownActive: false,
      ChemistryDropdownActive: false,
      currentPoints: [
        { id: 0, number: 0, campaignAssociated: [], reference: [] },
      ],
      mapChosen: "Light",
      biotestChosen: null,
      versionChosen: null,
      sandreChosen: null,
      chemistryElementChosen: null,
      version: [],
      threshold: { toxicity: null, chemistry: null },
      t0ChemistryResult: {},
      NQESandreList: [
        { sandre: 1115, name: "Benzo (a) pyrene" },
        { sandre: 1118, name: "Benzo (g,h,i) Perylene" },
        { sandre: 1117, name: "Benzo (k) Fluoranthene" },
        { sandre: 1116, name: "Benzo (b) Fluoranthene" },
        { sandre: 1204, name: "Indeno (1,2,3-cd) Pyrene" },
        { sandre: 1191, name: "Fluoranthene" },
        { sandre: 6616, name: "DEHP" },
        { sandre: 7707, name: "Dioxines et composées de type dioxine" },
      ],
      sliderValue: 100,
      NqeT0NotValidatedColorShown: false,
      NqeT0Checked: false,
      hydroSectorData: null,
      currentLayers: [],
      hydroSectorAdded: false,
      gidList: [],
      LbRegionHyHovered: null,
      LbRegionHyChosen: null,
      LbSecteurHHovered: null,
      LbSecteurHChosen: null,
      CdRegionHyHovered: null,
      CdRegionHyChosen: null,
      sectorHovered: undefined,
      featureChosen: null,
      popup: null,
      subSectorShown: false,
      streamData: null,
      streamAdded: false,
      colorChangedLayerIdList: [],
      colorChosen: "#DDDDDD",
      lastColorChosen: "#DDDDDD",
      changedColorFeature: [],
      lastChangedColorFeatureId: 0,
      pointLegend: [],
      layerOpacityLayerSetter: setInterval(() => {}, 10000),
      sliderShown: false,
      resultDescription: {
        campaign: [],
        splitResult: false,
        biotest: undefined,
        sandre: undefined,
      },
      measurepointChoiceDict: [],
      measurepointChoiceFormShown: false,
      measurepointChoiceMade: false,
      allPointShown: true,
      allResultShown: true,
      singleResultShown: true,
      multipleSameBiotestPerPlaceCampaignList: [],
      toxicityResult: {
        alimentation: false,
        neurology: false,
        reproduction: false,
      },
      markerDimension: 20,
      showNumber: true,
      pointArrowIdList: [],
      arrowColorChosen: "#000000",
      newColorsChecked: false,
      newColorsUsed: false,
      streamClassificaMaxChosen: 0,
      compass: { x: 0, y: 0 },
      customPointsAdded: false,
      customPointNames: [],
    };
  },
  async mounted() {
    const loading = setInterval(() => {
      if (this.downloadingPoints.length != 3) this.downloadingPoints += ".";
      else this.downloadingPoints = "";
    }, 1000);
    const versions = await axios.get(`${process.env.VUE_APP_API_URL}/version`);
    this.version = versions.data;
    this.versionChosen = Math.max(...this.version.map((element) => element.id));
    const { data } = await axios.get(
      `${process.env.VUE_APP_API_URL}/campaign/data?version=${this.versionChosen}`
    );
    this.result = data;
    this.campaignList = this.result.campaign.map(
      (campaign) => campaign.reference
    );
    mapboxgl.accessToken = process.env.VUE_APP_ACCESS_TOKEN_MAPBOX;
    this.map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/light-v10",
      center: [2, 47], // starting position [lng, lat]
      zoom: 5, // starting zoom
    });
    let threshold = await axios.get(
      `${process.env.VUE_APP_API_URL}/threshold/toxicity?version=${this.versionChosen}`
    );
    this.threshold.toxicity = threshold.data;
    threshold = await axios.get(
      `${process.env.VUE_APP_API_URL}/threshold/chemistry?version=${this.versionChosen}`
    );
    this.threshold.chemistry = threshold.data;
    clearInterval(loading);
    this.popup = new mapboxgl.Popup({
      closeButton: false,
    });
    setInterval(() => {
      this.rotateCompass();
    }, 10);
    const window = document.documentElement;
    window.style.setProperty("--marker-dimension", this.markerDimension + "px");
  },

  methods: {
    async changeVersion(version) {
      this.versionChosen = version;
      const campaignList = [...this.campaignChosenList];
      campaignList.forEach((campaign) => this.deleteCampaign(campaign));
      const loading = setInterval(() => {
        if (this.downloadingPoints.length != 3) this.downloadingPoints += ".";
        else this.downloadingPoints = "";
      }, 1000);
      const { data } = await axios.get(
        `${process.env.VUE_APP_API_URL}/campaign/data?version=${this.versionChosen}`
      );
      this.result = data;
      this.campaignList = this.result.campaign.map(
        (campaign) => campaign.reference
      );

      let threshold = await axios.get(
        `${process.env.VUE_APP_API_URL}/threshold/toxicity?version=${this.versionChosen}`
      );
      this.threshold.toxicity = threshold.data;
      threshold = await axios.get(
        `${process.env.VUE_APP_API_URL}/threshold/chemistry?version=${this.versionChosen}`
      );
      this.threshold.chemistry = threshold.data;
      clearInterval(loading);
      this.popup = new mapboxgl.Popup({
        closeButton: false,
      });
    },
    async chooseOne() {
      const existing = this.result.campaign.find(
        (campaign) => campaign.reference == this.campaignChoice
      )
        ? true
        : false;
      if (existing) {
        const alreadyShown = this.currentPoints.find((point) =>
          point.campaignAssociated.find(
            (campaign) => campaign == this.campaignChoice
          )
        );
        if (!alreadyShown) {
          this.campaignChosenList.push(this.campaignChoice);
          const chemistryData = await axios.get(
            `${process.env.VUE_APP_API_URL}/campaign/chemistry?campaign=${this.campaignChoice}`
          );
          let t0IdList = [];
          const campaignChosen = this.result.campaign.find(
            (campaign) => campaign.reference == this.campaignChoice
          );
          this.resultDescription.campaign.push({
            name: campaignChosen.name,
            modifying: false,
          });
          campaignChosen.place.forEach((placeChecked) => {
            placeChecked.measurepoint.forEach((measurepointChecked) => {
              if (
                t0IdList.find(
                  (t0Id) => t0Id == measurepointChecked.code_t0_id
                ) == undefined
              ) {
                t0IdList.push(measurepointChecked.code_t0_id);
              }
            });
          });
          t0IdList.forEach(async (t0Id) => {
            if (!this.t0ChemistryResult[t0Id]) {
              const { data } = await axios.get(
                `${process.env.VUE_APP_API_URL}/measurepoint/chemistry?id=${t0Id}`
              );
              this.t0ChemistryResult[t0Id] = data;
            }
          });
          if (chemistryData.data) {
            campaignChosen.place.forEach((placeChecked) => {
              placeChecked.measurepoint.forEach((measurepointChecked) => {
                measurepointChecked.pack.forEach((packChecked) => {
                  if (chemistryData.data[packChecked.id]) {
                    measurepointChecked.chemistry =
                      chemistryData.data[packChecked.id];
                  }
                });
              });
            });
          }
          let showMeasurepointNumber = false;
          if (
            this.result.campaign.find(
              (campaign) => campaign.reference == this.campaignChoice
            ).place.length == 1
          ) {
            showMeasurepointNumber = true;
          }
          const project = this.result.campaign.find(
            (campaign) => campaign.reference == this.campaignChoice
          ).project_id;
          this.result.campaign
            .find((campaign) => campaign.reference == this.campaignChoice)
            .place.forEach((placeChecked) => {
              let firstNumber,
                secondNumber,
                longitude,
                latitude,
                pointAssociated,
                number;
              placeChecked.measurepoint.forEach((measurepoint) => {
                if (measurepoint.longitude && measurepoint.latitude) {
                  longitude = measurepoint.longitude;
                  latitude = measurepoint.latitude;
                }
                if (!showMeasurepointNumber) {
                  firstNumber = placeChecked.reference.charAt(
                    placeChecked.reference.length - 2
                  );
                  secondNumber = placeChecked.reference.charAt(
                    placeChecked.reference.length - 1
                  );
                } else {
                  firstNumber = measurepoint.reference.charAt(
                    measurepoint.reference.length - 2
                  );
                  secondNumber = measurepoint.reference.charAt(
                    measurepoint.reference.length - 1
                  );
                }
                number = parseInt(firstNumber)
                  ? firstNumber + secondNumber
                  : secondNumber;
                pointAssociated = this.currentPoints.find(
                  (point) =>
                    point.id != 0 &&
                    point.reference[0].charAt(0) ==
                      placeChecked.reference.charAt(0) &&
                    point.reference[0].charAt(1) ==
                      placeChecked.reference.charAt(1) &&
                    point.reference[0].charAt(2) ==
                      placeChecked.reference.charAt(2) &&
                    point.number == number
                );
                if (showMeasurepointNumber) {
                  if (pointAssociated) {
                    if (
                      pointAssociated.campaignAssociated.find(
                        (c) => c == this.campaignChoice
                      ) == undefined
                    ) {
                      pointAssociated.campaignAssociated.push(
                        this.campaignChoice
                      );
                      pointAssociated.reference.push(measurepoint.reference);
                    }
                  } else {
                    this.addPoint(
                      number,
                      longitude,
                      latitude,
                      project,
                      true,
                      measurepoint.reference
                    );
                  }
                }
              });
              if (!showMeasurepointNumber) {
                if (pointAssociated) {
                  if (
                    pointAssociated.campaignAssociated.find(
                      (c) => c == this.campaignChoice
                    ) == undefined
                  ) {
                    pointAssociated.campaignAssociated.push(
                      this.campaignChoice
                    );
                    pointAssociated.reference.push(placeChecked.reference);
                  }
                } else {
                  this.addPoint(
                    number,
                    longitude,
                    latitude,
                    project,
                    false,
                    placeChecked.reference
                  );
                }
              }
            });
          this.showResult();
          this.campaignChoice = "";
        }
      }
    },
    deleteCampaign(campaign) {
      const indexOfDeletingPointsList = [];
      this.currentPoints.forEach((point, index) => {
        if (index == 0) return {};
        if (point.campaignAssociated.find((e) => e == campaign)) {
          point.campaignAssociated.splice(
            point.campaignAssociated.findIndex((e) => e == campaign),
            1
          );
          point.reference.splice(
            point.reference.findIndex((e) => e.search(campaign) != -1),
            1
          );
        }
        if (point.reference.length == 0) {
          point.marker.remove();
          indexOfDeletingPointsList.unshift(index);
          if (
            this.pointArrowIdList.find(
              (layer) => layer == `point-arrow-${point.id}`
            )
          ) {
            this.map.removeLayer(`point-arrow-${point.id}`);
            this.map.removeSource(`point-arrow-${point.id}`);
            this.pointArrowIdList.splice(
              this.pointArrowIdList.findIndex(
                (point) => `point-arrow-${point.id}`
              ),
              1
            );
          }
        }
      });
      indexOfDeletingPointsList.forEach((index) => {
        this.currentPoints.splice(index, 1);
      });
      this.resultDescription.campaign.splice(
        this.campaignChosenList.findIndex((e) => e == campaign),
        1
      );
      this.campaignChosenList.splice(
        this.campaignChosenList.findIndex((e) => e == campaign),
        1
      );
      this.measurepointChoiceDict.splice(
        this.measurepointChoiceDict.findIndex((c) => c.reference == campaign),
        1
      );
      this.multipleSameBiotestPerPlaceCampaignList.splice(
        this.multipleSameBiotestPerPlaceCampaignList.findIndex(
          (c) => c == campaign
        ),
        1
      );
      if (this.multipleSameBiotestPerPlaceCampaignList.length == 0)
        this.singleResultShown = true;
      this.showResult();
    },
    chooseMeasurepoint(
      event,
      campaignReference,
      placeReference,
      measurepointReference
    ) {
      if (event.srcElement.checked) {
        this.measurepointChoiceDict
          .find((c) => c.reference == campaignReference)
          .placeShown.find((p) => p.reference == placeReference)
          .measurepointShown.forEach((measurepoint) => {
            if (measurepoint.reference != measurepointReference)
              measurepoint.shown = false;
          });
      }
    },
    addPoint(number, longitude, latitude, project, isMeasurepoint, reference) {
      const window = document.documentElement;
      window.style.setProperty(
        "--marker-dimension",
        this.markerDimension + "px"
      );

      window.style.setProperty(
        "--marker-font-size",
        Math.round(this.markerDimension / 2) + "px"
      );
      window.style.setProperty(
        "--marker-square-dimension",
        Math.round(this.markerDimension / 3) + "px"
      );

      const element = document.createElement("div");
      element.className = "marker";
      const id =
        this.currentPoints.length >= 1
          ? Math.max(...this.currentPoints.map((point) => point.id)) + 1
          : 1;
      element.id = id;
      const marker = new mapboxgl.Marker(element, {
        draggable: true,
      });
      marker.setLngLat([longitude, latitude]).addTo(this.map);
      marker.on("dragstart", () => {
        if (
          this.pointArrowIdList.find((layer) => layer == `point-arrow-${id}`)
        ) {
          this.map.removeLayer(`point-arrow-${id}`);
          this.map.removeSource(`point-arrow-${id}`);
          this.pointArrowIdList.slice(
            this.pointArrowIdList.findIndex(
              (point) => point == `point-arrow-${id}`
            ),
            1
          );
        }
      });
      marker.on("dragend", () => {
        this.map.addSource(`point-arrow-${id}`, {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              properties: {},
              coordinates: [
                [marker.getLngLat().lng, marker.getLngLat().lat],
                [longitude, latitude],
              ],
            },
          },
        });
        this.map.addLayer({
          id: `point-arrow-${id}`,
          type: "line",
          source: `point-arrow-${id}`,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": this.arrowColorChosen,
            "line-width": 3,
          },
        });
        this.pointArrowIdList.push(`point-arrow-${id}`);
      });
      this.currentPoints.push({
        id,
        project,
        campaignAssociated: [this.campaignChoice],
        number,
        marker: marker,
        isMeasurepoint,
        reference: [reference],
        coordinates: [longitude, latitude],
        shown: true,
      });
    },
    changeBackground(style) {
      this.map.setStyle(`mapbox://styles/mapbox/${style}`);
      if (this.hydroSectorAdded) this.removeHydroSector();
      if (this.streamAdded) this.removeStream();
      if (this.LbRegionHyChosen) this.LbRegionHyChosen = null;
    },
    cleanResult() {
      this.currentPoints.forEach((point) => {
        if (point.id) {
          document.getElementById(point.id).innerHTML = point.number;
          document.getElementById(point.id).style.background = "white";
          document.getElementById(point.id).style.color = "black";
          document.getElementById(point.id).style.border = "solid 1px black";
        }
      });
    },
    showAllPoints() {
      if (this.allPointShown) {
        this.currentPoints.forEach((point) => (point.shown = false));
        this.allPointShown = false;
      } else {
        this.currentPoints.forEach((point) => (point.shown = true));
        this.allPointShown = true;
      }
    },
    showAllResults() {
      if (this.allResultShown) {
        this.measurepointChoiceDict.forEach((campaignChecked) => {
          campaignChecked.placeShown.forEach((placeChecked) => {
            placeChecked.shown = false;
            placeChecked.measurepointShown.forEach(
              (measurepointChecked) => (measurepointChecked.shown = false)
            );
          });
        });
        this.allResultShown = false;
      } else {
        this.allResultShown = true;
        this.measurepointChoiceDict = [];
        this.getMeasurepointChoice();
      }
    },
    getMeasurepointChoice() {
      this.measurepointChoiceFormShown = true;
      this.campaignChosenList.forEach((campaign) => {
        if (!this.measurepointChoiceDict.find((c) => c.reference == campaign)) {
          this.measurepointChoiceDict.push({
            reference: campaign,
            placeShown: [],
          });
          const campaignChecked = this.result.campaign.find(
            (c) => c.reference == campaign
          );
          const placeShownList = this.measurepointChoiceDict.find(
            (c) => c.reference == campaign
          ).placeShown;

          this.currentPoints.forEach((point) => {
            const pointReferenceOfCurrentCampaign = point.reference.find(
              (pointReference) =>
                pointReference.search(campaignChecked.reference) != -1
            );
            let placeChecked;
            if (pointReferenceOfCurrentCampaign) {
              placeChecked = campaignChecked.place.find(
                (place) =>
                  pointReferenceOfCurrentCampaign.search(place.reference) != -1
              );
            }
            if (placeChecked) {
              if (point.isMeasurepoint) {
                const gotOneResultPerBiotest = false;
                const measurepointChecked =
                  placeChecked.measurepoint[point.number - 1];
                placeShownList.push({
                  reference: placeChecked.reference,
                  number: point.number,
                  shown: true,
                  gotOneResultPerBiotest,
                  measurepointShown: [
                    { reference: measurepointChecked.reference, shown: true },
                  ],
                });
                if (
                  measurepointChecked.toxicity &&
                  measurepointChecked.toxicity.alimentation
                )
                  this.toxicityResult.alimentation = true;
                if (
                  measurepointChecked.toxicity &&
                  measurepointChecked.toxicity.neurotoxicity
                )
                  this.toxicityResult.neurology = true;
                if (
                  measurepointChecked.toxicity &&
                  measurepointChecked.toxicity.fecondity
                )
                  this.toxicityResult.reproduction = true;
              } else {
                let gotOneResultPerBiotest = true;
                let gotAlimentationResult,
                  gotNeurologyResult,
                  gotReproductionResult,
                  gotChemistryResult;
                placeChecked.measurepoint.forEach((measurepointChecked) => {
                  if (
                    measurepointChecked.toxicity &&
                    measurepointChecked.toxicity.alimentation
                  ) {
                    if (gotAlimentationResult) gotOneResultPerBiotest = false;
                    else {
                      this.toxicityResult.alimentation = true;
                      gotAlimentationResult = true;
                    }
                  }
                  if (
                    measurepointChecked.toxicity &&
                    measurepointChecked.toxicity.neurotoxicity
                  ) {
                    if (gotNeurologyResult) gotOneResultPerBiotest = false;
                    else {
                      this.toxicityResult.neurology = true;
                      gotNeurologyResult = true;
                    }
                  }
                  if (
                    measurepointChecked.toxicity &&
                    measurepointChecked.toxicity.fecondity
                  ) {
                    if (gotReproductionResult) gotOneResultPerBiotest = false;
                    else {
                      gotReproductionResult = true;
                      this.toxicityResult.reproduction = true;
                    }
                  }
                  if (measurepointChecked.chemistry) {
                    if (gotChemistryResult) gotOneResultPerBiotest = false;
                    else gotChemistryResult = true;
                  }
                });
                placeShownList.push({
                  reference: placeChecked.reference,
                  number: point.number,
                  shown:
                    (gotOneResultPerBiotest && this.singleResultShown) ||
                    !gotOneResultPerBiotest,
                  gotOneResultPerBiotest,
                  measurepointShown: [],
                });
                if (
                  !gotOneResultPerBiotest &&
                  this.multipleSameBiotestPerPlaceCampaignList.find(
                    (c) => c == campaign
                  ) == undefined
                )
                  this.multipleSameBiotestPerPlaceCampaignList.push(campaign);
                const measurepointShownList = placeShownList.find(
                  (p) => p.reference == placeChecked.reference
                ).measurepointShown;

                placeChecked.measurepoint.forEach((measurepointChecked) => {
                  if (gotOneResultPerBiotest)
                    measurepointShownList.push({
                      reference: measurepointChecked.reference,
                      shown:
                        (gotOneResultPerBiotest && this.singleResultShown) ||
                        (!gotOneResultPerBiotest && !this.singleResultShown),
                    });
                  else {
                    measurepointShownList.push({
                      reference: measurepointChecked.reference,
                      shown:
                        measurepointShownList.length == 0 ||
                        !this.singleResultShown,
                    });
                  }
                });
              }
            }
          });
        }
      });
      this.measurepointChoiceFormShown = true;
    },
    validateMeasurepointChoice() {
      this.measurepointChoiceFormShown = false;
      this.measurepointChoiceMade = true;
      this.showResult();
    },
    switchNumberOfResult() {
      this.singleResultShown = !this.singleResultShown;
      if (this.biotestChosen == "toxicité" && !this.singleResultShown)
        this.biotestChosen = "alimentation";
      this.measurepointChoiceDict = [];
      this.getMeasurepointChoice();
    },
    showResult() {
      const window = document.documentElement;
      window.style.setProperty(
        "--marker-dimension",
        this.markerDimension + "px"
      );
      window.style.setProperty(
        "--marker-square-dimension",
        Math.round(this.markerDimension / 3) + "px"
      );
      window.style.setProperty(
        "--marker-font-size",
        Math.round(this.markerDimension / 2) + "px"
      );
      if (!this.biotestChosen) {
        this.currentPoints.forEach((point) => {
          if (point.id == 0) return {};
          if (!point.shown) {
            const DOMElement = document.getElementById(point.id);
            DOMElement.style.display = "none";
          } else {
            const DOMElement = document.getElementById(point.id);
            DOMElement.style.display = "inherit";
            DOMElement.innerHTML = `<span>${
              this.showNumber ? point.number : ""
            } </span>`;
          }
        });
      }
      if (this.biotestChosen) {
        this.resultDescription.biotest = this.biotestChosen;
        this.cleanResult();
        const numberResult = Math.max(
          ...this.currentPoints.map((point) => point.campaignAssociated.length)
        );
        let biotestTranslated, type;
        if (
          this.biotestChosen == "alimentation" ||
          this.biotestChosen == "neurotoxicité AChE" ||
          this.biotestChosen == "reproduction" ||
          this.biotestChosen == "toxicité"
        ) {
          type = "toxicity";
          if (this.biotestChosen == "alimentation")
            biotestTranslated = "alimentation";
          else if (this.biotestChosen == "neurotoxicité AChE")
            biotestTranslated = "neurotoxicity";
          else if (this.biotestChosen == "reproduction")
            biotestTranslated = "fecondity";
          else if (this.biotestChosen == "toxicité")
            biotestTranslated = "toxicity";
        } else if (
          this.biotestChosen == "NQE" ||
          this.biotestChosen == "BBAC"
        ) {
          type = "chemistry";
          biotestTranslated = this.biotestChosen;
        }
        if (
          !this.measurepointChoiceMade ||
          this.measurepointChoiceDict.length !=
            this.campaignChosenList.length ||
          (this.measurepointChoiceDict.length &&
            this.campaignChosenList.find(
              (c) =>
                this.measurepointChoiceDict.find(
                  (element) => element.reference == c
                ) == undefined
            ) != undefined)
        )
          return this.getMeasurepointChoice();
        let splitResult =
          this.currentPoints.find(
            (point) => point.campaignAssociated.length > 1
          ) != undefined || biotestTranslated == "toxicity";
        this.resultDescription.splitResult = splitResult ? true : false;
        this.currentPoints.forEach((point) => {
          if (point.id == 0) return {};
          if (!point.shown) {
            const DOMElement = document.getElementById(point.id);
            DOMElement.style.display = "none";
          } else {
            const DOMElement = document.getElementById(point.id);
            DOMElement.style.display = "inherit";

            DOMElement.innerHTML = `<span>${
              this.showNumber ? point.number : ""
            } </span>`;
            let resultSquares = "";
            let resultShown = false;
            this.campaignChosenList.forEach((campaign, index) => {
              let placeChecked, measurepointChecked;
              if (point.isMeasurepoint) {
                measurepointChecked = this.result.campaign
                  .find(
                    (resultCampaign) => resultCampaign.reference == campaign
                  )
                  .place[0].measurepoint.find(
                    (measurepoint) =>
                      point.reference.find(
                        (pointReference) =>
                          pointReference.search(measurepoint.reference) != -1
                      ) != undefined &&
                      this.measurepointChoiceDict
                        .find((c) => c.reference == campaign)
                        .placeShown.find(
                          (placeChosen) =>
                            placeChosen.measurepointShown[0].shown &&
                            placeChosen.measurepointShown[0].reference ==
                              measurepoint.reference
                        )
                  );
              } else {
                placeChecked = this.result.campaign
                  .find(
                    (resultCampaign) => resultCampaign.reference == campaign
                  )
                  .place.find(
                    (resultPlace) =>
                      point.reference.find(
                        (pointReference) =>
                          pointReference.search(resultPlace.reference) != -1
                      ) != undefined &&
                      this.measurepointChoiceDict.find(
                        (c) => c.reference == campaign
                      ) != undefined
                  );
              }
              let output;
              if (this.singleResultShown) {
                if (placeChecked && biotestTranslated != "toxicity") {
                  measurepointChecked = placeChecked.measurepoint.find(
                    (measurepoint) =>
                      measurepoint[type] != undefined &&
                      (type == "toxicity"
                        ? measurepoint[type][biotestTranslated] != undefined
                        : true) &&
                      ((this.measurepointChoiceDict
                        .find((c) => c.reference == campaign)
                        .placeShown.find(
                          (p) =>
                            p.reference == placeChecked.reference && p.shown
                        ) &&
                        this.measurepointChoiceDict
                          .find((c) => c.reference == campaign)
                          .placeShown.find(
                            (p) =>
                              p.reference == placeChecked.reference && p.shown
                          ).gotOneResultPerBiotest) ||
                        (this.measurepointChoiceDict
                          .find((c) => c.reference == campaign)
                          .placeShown.find(
                            (p) =>
                              p.reference == placeChecked.reference && p.shown
                          ) &&
                          this.measurepointChoiceDict
                            .find((c) => c.reference == campaign)
                            .placeShown.find(
                              (p) =>
                                p.reference == placeChecked.reference && p.shown
                            )
                            .measurepointShown.find((m) => m.shown) !=
                            undefined &&
                          measurepoint.reference ==
                            this.measurepointChoiceDict
                              .find((c) => c.reference == campaign)
                              .placeShown.find(
                                (p) =>
                                  p.reference == placeChecked.reference &&
                                  p.shown
                              )
                              .measurepointShown.find((m) => m.shown)
                              .reference))
                  );
                }
                if (biotestTranslated != "toxicity") {
                  if (measurepointChecked) {
                    output =
                      type == "toxicity"
                        ? this.getStyleToxicity(
                            measurepointChecked,
                            this.biotestChosen
                          )
                        : this.getStyleChemistry(
                            measurepointChecked,
                            this.biotestChosen,
                            this.sandreChosen
                          );
                  }

                  if (output && !splitResult) {
                    const { background, color, border } = output;
                    DOMElement.style.background = background;
                    DOMElement.style.color = color;
                    if (border && this.NqeT0NotValidatedColorShown)
                      DOMElement.style.border = `solid ${border} 2px`;
                  }
                  if (splitResult) {
                    if (output) resultShown = true;
                    resultSquares +=
                      index == 0
                        ? '<div class="squares"><div class="square-row">'
                        : "";
                    resultSquares += `<div class="square" style="background:${
                      output && output.background ? output.background : "white"
                    }; ${
                      output &&
                      output.border &&
                      this.NqeT0NotValidatedColorShown
                        ? "border: solid red 2px"
                        : ""
                    }"></div>`;

                    resultSquares +=
                      index == numberResult - 1 ? "</div></div>" : "";
                  }
                } else {
                  if (placeChecked || measurepointChecked) {
                    if (this.toxicityResult.alimentation) {
                      if (placeChecked) {
                        measurepointChecked = placeChecked.measurepoint.find(
                          (measurepoint) =>
                            measurepoint.toxicity != undefined &&
                            measurepoint.toxicity.alimentation &&
                            ((this.measurepointChoiceDict
                              .find((c) => c.reference == campaign)
                              .placeShown.find(
                                (p) =>
                                  p.reference == placeChecked.reference &&
                                  p.shown
                              ) &&
                              this.measurepointChoiceDict
                                .find((c) => c.reference == campaign)
                                .placeShown.find(
                                  (p) =>
                                    p.reference == placeChecked.reference &&
                                    p.shown
                                ).gotOneResultPerBiotest) ||
                              (this.measurepointChoiceDict
                                .find((c) => c.reference == campaign)
                                .placeShown.find(
                                  (p) =>
                                    p.reference == placeChecked.reference &&
                                    p.shown
                                ) &&
                                this.measurepointChoiceDict
                                  .find((c) => c.reference == campaign)
                                  .placeShown.find(
                                    (p) =>
                                      p.reference == placeChecked.reference &&
                                      p.shown
                                  )
                                  .measurepointShown.find((m) => m.shown) !=
                                  undefined &&
                                measurepoint.reference ==
                                  this.measurepointChoiceDict
                                    .find((c) => c.reference == campaign)
                                    .placeShown.find(
                                      (p) =>
                                        p.reference == placeChecked.reference &&
                                        p.shown
                                    )
                                    .measurepointShown.find((m) => m.shown)
                                    .reference))
                        );
                      }
                      if (measurepointChecked) {
                        resultSquares +=
                          index == 0
                            ? '<div class="squares"><div class="square-row">'
                            : "<div class='square-row'>";

                        output = this.getStyleToxicity(
                          measurepointChecked,
                          "alimentation"
                        );
                        if (output) resultShown = true;
                        resultSquares += `<div class="square" style="background:${
                          output && output.background
                            ? output.background
                            : "white"
                        };"></div>`;

                        resultSquares +=
                          this.toxicityResult.reproduction ||
                          this.toxicityResult.neurology
                            ? ""
                            : index == numberResult - 1
                            ? "</div></div>"
                            : "</div>";
                      } else {
                        resultSquares +=
                          index == 0
                            ? '<div class="squares"><div class="square-row">'
                            : "<div class='square-row'>";
                        resultSquares += `<div class="square" style="background:#FFFFFF"></div>`;
                        resultSquares +=
                          this.toxicityResult.reproduction ||
                          this.toxicityResult.neurology
                            ? ""
                            : index == numberResult - 1
                            ? "</div></div>"
                            : "</div>";
                      }
                    }
                    if (this.toxicityResult.neurology) {
                      if (placeChecked) {
                        measurepointChecked = placeChecked.measurepoint.find(
                          (measurepoint) =>
                            measurepoint.toxicity != undefined &&
                            measurepoint.toxicity.neurotoxicity &&
                            ((this.measurepointChoiceDict
                              .find((c) => c.reference == campaign)
                              .placeShown.find(
                                (p) =>
                                  p.reference == placeChecked.reference &&
                                  p.shown
                              ) &&
                              this.measurepointChoiceDict
                                .find((c) => c.reference == campaign)
                                .placeShown.find(
                                  (p) =>
                                    p.reference == placeChecked.reference &&
                                    p.shown
                                ).gotOneResultPerBiotest) ||
                              (this.measurepointChoiceDict
                                .find((c) => c.reference == campaign)
                                .placeShown.find(
                                  (p) =>
                                    p.reference == placeChecked.reference &&
                                    p.shown
                                ) &&
                                this.measurepointChoiceDict
                                  .find((c) => c.reference == campaign)
                                  .placeShown.find(
                                    (p) =>
                                      p.reference == placeChecked.reference &&
                                      p.shown
                                  )
                                  .measurepointShown.find((m) => m.shown) !=
                                  undefined &&
                                measurepoint.reference ==
                                  this.measurepointChoiceDict
                                    .find((c) => c.reference == campaign)
                                    .placeShown.find(
                                      (p) =>
                                        p.reference == placeChecked.reference &&
                                        p.shown
                                    )
                                    .measurepointShown.find((m) => m.shown)
                                    .reference))
                        );
                      }
                      if (measurepointChecked) {
                        resultSquares += this.toxicityResult.alimentation
                          ? ""
                          : index == 0
                          ? '<div class="squares"><div class="square-row">'
                          : "<div class='square-row'>";

                        output = this.getStyleToxicity(
                          measurepointChecked,
                          "neurotoxicité AChE"
                        );
                        if (output) resultShown = true;
                        resultSquares += `<div class="square" style="background:${
                          output && output.background
                            ? output.background
                            : "white"
                        };"></div>`;

                        resultSquares += this.toxicityResult.reproduction
                          ? ""
                          : index == numberResult - 1
                          ? "</div></div>"
                          : "</div>";
                      } else {
                        resultSquares += this.toxicityResult.alimentation
                          ? ""
                          : index == 0
                          ? '<div class="squares"><div class="square-row">'
                          : "<div class='square-row'>";
                        resultSquares += `<div class="square" style="background:#FFFFFF"></div>`;
                        resultSquares += this.toxicityResult.reproduction
                          ? ""
                          : index == numberResult - 1
                          ? "</div></div>"
                          : "</div>";
                      }
                    }
                    if (this.toxicityResult.reproduction) {
                      if (placeChecked) {
                        measurepointChecked = placeChecked.measurepoint.find(
                          (measurepoint) =>
                            measurepoint.toxicity != undefined &&
                            measurepoint.toxicity.fecondity &&
                            ((this.measurepointChoiceDict
                              .find((c) => c.reference == campaign)
                              .placeShown.find(
                                (p) =>
                                  p.reference == placeChecked.reference &&
                                  p.shown
                              ) &&
                              this.measurepointChoiceDict
                                .find((c) => c.reference == campaign)
                                .placeShown.find(
                                  (p) =>
                                    p.reference == placeChecked.reference &&
                                    p.shown
                                ).gotOneResultPerBiotest) ||
                              (this.measurepointChoiceDict
                                .find((c) => c.reference == campaign)
                                .placeShown.find(
                                  (p) =>
                                    p.reference == placeChecked.reference &&
                                    p.shown
                                ) &&
                                this.measurepointChoiceDict
                                  .find((c) => c.reference == campaign)
                                  .placeShown.find(
                                    (p) =>
                                      p.reference == placeChecked.reference &&
                                      p.shown
                                  )
                                  .measurepointShown.find((m) => m.shown) !=
                                  undefined &&
                                measurepoint.reference ==
                                  this.measurepointChoiceDict
                                    .find((c) => c.reference == campaign)
                                    .placeShown.find(
                                      (p) =>
                                        p.reference == placeChecked.reference &&
                                        p.shown
                                    )
                                    .measurepointShown.find((m) => m.shown)
                                    .reference))
                        );
                      }
                      if (measurepointChecked) {
                        resultSquares +=
                          this.toxicityResult.alimentation ||
                          this.toxicityResult.neurology
                            ? ""
                            : index == 0
                            ? '<div class="squares"><div class="square-row">'
                            : "<div class='square-row'>";

                        output = this.getStyleToxicity(
                          measurepointChecked,
                          "reproduction"
                        );
                        if (output) resultShown = true;
                        resultSquares += `<div class="square" style="background:${
                          output && output.background
                            ? output.background
                            : "white"
                        };"></div>`;
                        if (output && output.background) {
                          output = this.getStyleToxicity(
                            measurepointChecked,
                            "molting_cycle_conformity"
                          );
                          if (output) resultShown = true;
                          resultSquares += `<div class="square" style="background:${
                            output && output.background
                              ? output.background
                              : "white"
                          };"></div>`;
                          output = this.getStyleToxicity(
                            measurepointChecked,
                            "surface_retard_conformity"
                          );
                          if (output) resultShown = true;
                          resultSquares += `<div class="square" style="background:${
                            output && output.background
                              ? output.background
                              : "white"
                          };"></div>`;

                          resultSquares +=
                            index == numberResult - 1
                              ? "</div></div>"
                              : "</div>";
                        } else {
                          resultSquares += `<div class="square" style="background:#FFFFFF"></div>`;
                          resultSquares += `<div class="square" style="background:#FFFFFF"></div>`;
                          resultSquares +=
                            index == numberResult - 1
                              ? "</div></div>"
                              : "</div>";
                        }
                      } else {
                        resultSquares +=
                          this.toxicityResult.alimentation ||
                          this.toxicityResult.neurology
                            ? ""
                            : index == 0
                            ? '<div class="squares"><div class="square-row">'
                            : "<div class='square-row'>";
                        resultSquares += `<div class="square" style="background:#FFFFFF"></div>`;
                        resultSquares += `<div class="square" style="background:#FFFFFF"></div>`;
                        resultSquares += `<div class="square" style="background:#FFFFFF"></div>`;
                        resultSquares +=
                          index == numberResult - 1 ? "</div></div>" : "</div>";
                      }
                    }
                  }
                }
              } else {
                if (
                  placeChecked &&
                  this.measurepointChoiceDict
                    .find((c) => c.reference == campaign)
                    .placeShown.find(
                      (p) => p.reference == placeChecked.reference && p.shown
                    )
                ) {
                  if (biotestTranslated != "toxicity") {
                    placeChecked.measurepoint.forEach(
                      (measurepoint, measurepointIndex) => {
                        if (
                          measurepoint &&
                          this.measurepointChoiceDict
                            .find((c) => c.reference == campaign)
                            .placeShown.find(
                              (p) =>
                                p.reference == placeChecked.reference && p.shown
                            )
                            .measurepointShown.find(
                              (m) =>
                                m.reference == measurepoint.reference && m.shown
                            )
                        ) {
                          output =
                            type == "toxicity"
                              ? this.getStyleToxicity(
                                  measurepoint,
                                  this.biotestChosen
                                )
                              : this.getStyleChemistry(
                                  measurepoint,
                                  this.biotestChosen,
                                  this.sandreChosen
                                );
                        }
                        if (output) resultShown = true;
                        resultSquares +=
                          index == 0 && measurepointIndex == 0
                            ? '<div class="squares"><div class="square-row">'
                            : "";
                        resultSquares += `<div class="square" style="background:${
                          output && output.background
                            ? output.background
                            : "white"
                        }; ${
                          output &&
                          output.border &&
                          this.NqeT0NotValidatedColorShown
                            ? "border: solid red 2px"
                            : ""
                        }"></div>`;

                        resultSquares +=
                          index == numberResult - 1 &&
                          measurepointIndex == placeChecked.measurepoint.length
                            ? "</div></div>"
                            : "";
                      }
                    );
                  } else {
                    console.log(
                      "pas encore fait ce cas de toxicité + plusieurs résultats du même biotest par place"
                    );
                  }
                }
              }
            });
            DOMElement.innerHTML += resultShown ? resultSquares : "";
          }
        });
      }
    },
    getStyleToxicity(measurepointChecked, biotest = this.biotestChosen) {
      if (biotest) {
        let type;
        if (biotest == "alimentation") type = "alimentation";
        if (biotest == "neurotoxicité AChE") type = "neurotoxicity";
        if (biotest == "reproduction") type = "fecondity";
        if (biotest == "molting_cycle_conformity")
          type = "molting_cycle_conformity";
        if (biotest == "surface_retard_conformity")
          type = "surface_retard_conformity";

        if (!measurepointChecked.toxicity[type]) {
          return {
            background: "#FFFFFF",
            color: "white",
          };
        }
        if (
          biotest == "alimentation" &&
          parseFloat(measurepointChecked.toxicity.male_survival_7_days) < 70
        ) {
          if (
            parseFloat(measurepointChecked.toxicity.male_survival_7_days) < 70
          )
            return { background: "#808080", color: "white" };
          else return { background: "" };
        } else if (
          type == "surface_retard_conformity" ||
          type == "molting_cycle_conformity"
        ) {
          if (
            measurepointChecked.toxicity[type] == "NA" ||
            measurepointChecked.toxicity[type] == "Conforme" ||
            measurepointChecked.toxicity[type] == "Conforme BC1"
          ) {
            return { background: "#4169e1", color: "white" };
          } else {
            return {
              background: "#dc143c",
              color: "white",
            };
          }
        } else if (
          measurepointChecked.toxicity[type] >
          -this.threshold.toxicity.find(
            (threshold) =>
              threshold.parameter == biotest &&
              threshold.meaning == "pas d'effet"
          ).threshold
        )
          return { background: "#4169e1", color: "white" };
        else if (
          measurepointChecked.toxicity[type] >
          -this.threshold.toxicity.find(
            (threshold) =>
              threshold.parameter == biotest &&
              threshold.meaning == "effet faible"
          ).threshold
        )
          return { background: "#9acd32", color: "white" };
        else if (
          measurepointChecked.toxicity[type] >
          -this.threshold.toxicity.find(
            (threshold) =>
              threshold.parameter == biotest &&
              threshold.meaning == "effet modéré"
          ).threshold
        )
          return { background: "#ffd700" };
        else if (
          measurepointChecked.toxicity[type] >
          -this.threshold.toxicity.find(
            (threshold) =>
              threshold.parameter == biotest &&
              threshold.meaning == "effet élevé"
          ).threshold
        )
          return {
            background: "#ff8c00",
            color: "white",
          };
        else if (
          measurepointChecked.toxicity[type] <
          -this.threshold.toxicity.find(
            (threshold) =>
              threshold.parameter == biotest &&
              threshold.meaning == "effet élevé"
          ).threshold
        )
          return {
            background: "#dc143c",
            color: "white",
          };
      }
    },
    getStyleChemistry(
      measurepointChecked,
      biotest = this.biotestChosen,
      sandre
    ) {
      if (biotest && measurepointChecked) {
        let t0, thresholdChecked;
        t0 = this.t0ChemistryResult[measurepointChecked.code_t0_id];
        thresholdChecked = this.threshold.chemistry.find(
          (threshold) => threshold.sandre == sandre
        );
        if (!thresholdChecked)
          return {
            background: "#808080",
            color: "white",
          };
        let chemistryType;
        if (measurepointChecked.chemistryDays == 7) {
          chemistryType = "7j";
        } else if (measurepointChecked.chemistryDays == 21) {
          chemistryType = "21j";
        }
        if (
          measurepointChecked.chemistry &&
          measurepointChecked.chemistry[sandre]
        ) {
          if (biotest == "NQE") {
            if (thresholdChecked.NQE) {
              let output = {};
              if (
                t0 &&
                t0[sandre] &&
                thresholdChecked.concentration_t0_max &&
                thresholdChecked.concentration_t0_max < t0[sandre]
              ) {
                output.border = "red";
              }
              if (
                measurepointChecked.chemistry[sandre] < thresholdChecked.NQE
              ) {
                output.background = "#4169e1";
                output.color = "white";
              } else {
                (output.background = "#dc143c"), (output.color = "white");
              }

              return output;
            } else
              return {
                background: "#808080",
                color: "white",
              };
          } else if (chemistryType == "7j" || chemistryType == "21j") {
            if (
              t0 &&
              t0[sandre] &&
              thresholdChecked[`${chemistryType}_threshold`] &&
              thresholdChecked[`${chemistryType}_threshold`] > t0[sandre] &&
              measurepointChecked.chemistry[sandre]
            ) {
              if (
                measurepointChecked.chemistry[sandre] <
                thresholdChecked[`${chemistryType}_threshold`]
              ) {
                return {
                  background: this.newColorsUsed ? "#dbb7ff" : "#4169e1",
                  color: this.newColorsUsed ? "black" : "white",
                };
              } else if (
                measurepointChecked.chemistry[sandre] <
                thresholdChecked[`${chemistryType}_graduate_25`]
              ) {
                return {
                  background: this.newColorsUsed ? "#b565f7" : "#9acd32",
                  color: "white",
                };
              } else if (
                measurepointChecked.chemistry[sandre] <
                thresholdChecked[`${chemistryType}_graduate_50`]
              ) {
                return {
                  background: this.newColorsUsed ? "#8909ff" : "#ffd700",
                  color: this.newColorsUsed ? "white" : "black",
                };
              } else if (
                measurepointChecked.chemistry[sandre] <
                thresholdChecked[`${chemistryType}_graduate_75`]
              ) {
                return {
                  background: this.newColorsUsed ? "#6600cc" : "#ff8c00",
                  color: "white",
                };
              } else if (
                measurepointChecked.chemistry[sandre] >
                thresholdChecked[`${chemistryType}_graduate_75`]
              ) {
                return {
                  background: this.newColorsUsed ? "#47008e" : "#dc143c",
                  color: "white",
                };
              }
            } else {
              return {
                background: "#808080",
                color: "white",
              };
            }
          }
        }
      }
    },
    async addStreamLayer() {
      if (this.streamClassificaMaxChosen < 7) {
        this.streamClassificaMaxChosen++;
        const { data } = await axios.get(
          `${process.env.VUE_APP_API_URL}/layer/stream?classifica=${this.streamClassificaMaxChosen}`
        );
        this.streamData = data;
        this.map.addSource(`Stream-${this.streamClassificaMaxChosen}`, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: data,
          },
          generateId: true,
        });
        this.streamAdded = true;
        this.map.addLayer({
          id: `streams-${this.streamClassificaMaxChosen}`,
          source: `Stream-${this.streamClassificaMaxChosen}`,
          type: "line",
          paint: {
            "line-color":
              this.streamClassificaMaxChosen > 1 ? "#7abeff" : "#1E90FF",
            "line-width": 3 - Math.round(this.streamClassificaMaxChosen / 3),
          },
        });
      }
    },

    async addHydroSectorLayer() {
      let data;
      if (!this.hydroSectorData) {
        const output = await axios.get(
          `${process.env.VUE_APP_API_URL}/layer/hydro-sector`
        );
        data = output.data;
        this.hydroSectorData = data;
        data.forEach((feature) => {
          this.gidList.push(feature.properties.gid);
        });
      }
      if (!this.hydroSectorAdded) {
        this.map.addSource("HydroSector", {
          type: "geojson",
          data: { type: "FeatureCollection", features: this.hydroSectorData },
          generateId: true,
        });
        this.map.addLayer({
          id: "hydro-sector",
          type: "fill",
          source: "HydroSector",
          paint: {
            "fill-color": [
              "case",
              ["boolean", ["feature-state", "hovered"], false], // Set this to false
              "#64bdbb",
              "#DDDDDD",
            ],
            "fill-opacity": 0.4,
            "fill-antialias": false,
          },
        });
      }
      this.hydroSectorAdded = true;
      this.map.on("click", "hydro-sector", (event) => {
        const featuresClicked = this.map.queryRenderedFeatures(event.point);
        if (
          featuresClicked &&
          featuresClicked.length &&
          featuresClicked[0].properties &&
          featuresClicked[0].properties.LbRegionHy
        ) {
          this.LbRegionHyChosen = featuresClicked[0].properties.LbRegionHy;
          this.CdRegionHyChosen = featuresClicked[0].properties.CdRegionHy;
          this.LbSecteurHChosen = featuresClicked[0].properties.LbSecteurH;
          const sector = this.subSectorShown
            ? this.LbSecteurHChosen
            : this.LbRegionHyChosen;
          const alreadyChanged = this.changedColorFeature.find(
            (el) => el.sector == sector
          );
          if (alreadyChanged) {
            this.colorChosen = alreadyChanged.color;
            this.lastColorChosen = alreadyChanged.color;
          } else {
            this.colorChosen = "#DDDDDD";
            this.lastColorChosen = "#DDDDDD";
          }
          this.changeLayerOpacity();
          if (!this.subSectorShown) {
            this.featureChosen = this.map
              .queryRenderedFeatures(undefined, { layers: ["hydro-sector"] })
              .filter(
                (feature) =>
                  feature.properties.CdRegionHy == this.CdRegionHyChosen
              );
            let duplicateGIDIndexList = [];
            let GIDList = [];
            this.featureChosen.forEach((feature, index) => {
              if (GIDList.find((gid) => gid == feature.properties.gid))
                duplicateGIDIndexList.push(index);
              GIDList.push(feature.properties.gid);
            });
            duplicateGIDIndexList
              .reverse()
              .forEach((index) => this.featureChosen.splice(index, 1));
          } else {
            this.featureChosen = featuresClicked[0];
          }
        } else {
          this.LbRegionHyChosen = null;
          this.CdRegionHyChosen = null;
        }
      });
      this.map.on("mousemove", (event) => {
        const featuresHovered = this.map.queryRenderedFeatures(event.point);
        if (
          featuresHovered &&
          featuresHovered.length &&
          featuresHovered[0].properties &&
          featuresHovered[0].properties.LbRegionHy
        ) {
          this.popup
            .setLngLat(event.lngLat)
            .setText(
              this.subSectorShown
                ? featuresHovered[0].properties.LbSecteurH
                : featuresHovered[0].properties.LbRegionHy
            )
            .addTo(this.map);
          this.LbRegionHyHovered = featuresHovered[0].properties.LbRegionHy;
          this.CdRegionHyHovered = featuresHovered[0].properties.CdRegionHy;
          this.LbSecteurHHovered = featuresHovered[0].properties.LbSecteurH;
          if (this.sectorHovered) {
            if (this.subSectorShown) {
              this.map.removeFeatureState({
                source: "HydroSector",
                id: this.sectorHovered.id,
              });
            } else {
              this.sectorHovered.forEach((feature) => {
                this.map.removeFeatureState({
                  source: "HydroSector",
                  id: feature.id,
                });
              });
            }
          }
          if (this.subSectorShown) {
            this.sectorHovered = featuresHovered[0];
            this.map.setFeatureState(
              {
                source: "HydroSector",
                id: featuresHovered[0].id,
              },
              {
                hovered: true,
              }
            );
          } else {
            this.sectorHovered = this.map
              .queryRenderedFeatures(undefined, {
                layers: ["hydro-sector"],
              })
              .filter(
                (feature) =>
                  feature.properties.CdRegionHy == this.CdRegionHyHovered
              );
            this.sectorHovered.forEach((feature) => {
              this.map.setFeatureState(
                {
                  source: "HydroSector",
                  id: feature.id,
                },
                {
                  hovered: true,
                }
              );
            });
          }
        } else {
          if (this.sectorHovered && this.sectorHovered.length) {
            this.sectorHovered.forEach((feature) => {
              this.map.removeFeatureState({
                source: "HydroSector",
                id: feature.id,
              });
            });
          } else if (this.sectorHovered) {
            this.map.removeFeatureState({
              source: "HydroSector",
              id: this.sectorHovered.id,
            });
          }
          this.sectorHovered = undefined;
          this.popup.remove();
        }
      });
    },
    removeHydroSector() {
      this.changedColorFeature.forEach((feature) => {
        this.map.removeLayer("hydro-sector-" + feature.id);
        this.map.removeSource("HydroSector" + feature.id);
      });
      this.map.removeLayer("hydro-sector");
      this.map.removeSource("HydroSector");
      this.changedColorFeature = [];
      this.hydroSectorAdded = false;
      this.gidList = [];
      this.LbRegionHyChosen = undefined;
      this.LbSecteurHChosen = undefined;
      this.CdRegionHyChosen = undefined;
      clearInterval(this.layerOpacityLayerSetter);
    },
    removeStream() {
      if (this.streamClassificaMaxChosen >= 1) {
        this.map.removeLayer(`streams-${this.streamClassificaMaxChosen}`);
        this.map.removeSource(`Stream-${this.streamClassificaMaxChosen}`);
        this.streamClassificaMaxChosen--;
        if (this.streamClassificaMaxChosen == 0) this.streamAdded = false;
      }
    },
    changeLayerOpacity() {
      this.sliderShown = false;
      const sector = this.subSectorShown
        ? this.LbSecteurHChosen
        : this.LbRegionHyChosen;
      if (sector) {
        const layerFound = this.changedColorFeature.find(
          (color) => color.sector == sector
        );
        clearInterval(this.layerOpacityLayerSetter);
        if (layerFound) {
          this.sliderValue =
            this.map.getPaintProperty(
              `hydro-sector-${layerFound.id}`,
              "fill-opacity"
            ) * 100;
          this.sliderShown = true;
          this.layerOpacityLayerSetter = setInterval(() => {
            this.map.setPaintProperty(
              `hydro-sector-${layerFound.id}`,
              "fill-opacity",
              this.sliderValue / 100
            );
            layerFound.opacity = this.sliderValue / 100;
          }, 100);
        }
      }
    },
    changeArrowColor() {
      if (this.lastColorChosen != this.arrowColorChosen) {
        this.pointArrowIdList.forEach((id) => {
          this.map.removeLayer(id);
          this.map.addLayer({
            id,
            type: "line",
            source: id,
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": this.arrowColorChosen,
              "line-width": 3,
            },
          });
        });
        this.lastColorChosen == this.arrowColorChosen;
      }
    },
    changeLayerColor() {
      if (this.lastColorChosen != this.colorChosen) {
        const sector = this.subSectorShown
          ? this.LbSecteurHChosen
          : this.LbRegionHyChosen;
        const alreadyChanged = this.changedColorFeature.find(
          (color) => color.sector == sector
        );
        if (alreadyChanged) {
          this.map.removeLayer("hydro-sector-" + alreadyChanged.id);
          this.map.removeSource("HydroSector" + alreadyChanged.id);
          this.changedColorFeature.splice(
            this.changedColorFeature.findIndex(
              (color) => color.sector == sector
            ),
            1
          );
          this.changeLayerColor();
          clearInterval(this.layerOpacityLayerSetter);
          this.lastColorChosen = this.colorChosen;
        } else {
          let newColor = {
            id: this.lastChangedColorFeatureId + 1,
            color: this.colorChosen,
            opacity: 0.4,
          };
          this.lastChangedColorFeatureId++;
          if (this.featureChosen.length) {
            this.map.addSource("HydroSector" + newColor.id, {
              type: "geojson",
              data: { type: "FeatureCollection", features: this.featureChosen },
            });
            newColor.featureGid = this.featureChosen.map(
              (feature) => feature.properties.gid
            );
            newColor.sector = this.subSectorShown
              ? this.LbSecteurHChosen
              : this.LbRegionHyChosen;
          } else {
            this.map.addSource("HydroSector" + newColor.id, {
              type: "geojson",
              data: this.featureChosen,
            });
            newColor.featureGid = this.featureChosen.properties.gid;
            newColor.sector = this.subSectorShown
              ? this.LbSecteurHChosen
              : this.LbRegionHyChosen;
          }
          this.map.addLayer({
            id: "hydro-sector-" + newColor.id,
            type: "fill",
            source: "HydroSector" + newColor.id,
            paint: {
              "fill-color": [
                "case",
                ["boolean", ["feature-state", "hovered"], false], // Set this to false
                "#64bdbb",
                newColor.color,
              ],
              "fill-opacity": 0.4,
              "fill-antialias": false,
            },
          });
          this.changedColorFeature.push(newColor);
          this.changeLayerOpacity();
        }
      }
    },
    rotateCompass() {
      const window = document.documentElement;
      window.style.setProperty("--map-rotation", this.map.getBearing() + "deg");
    },
    getDragStartingPosition(e) {
      this.compass.x =
        e.clientX -
        (e.target.style.left
          ? parseInt(e.target.style.left.match(/\d+/)[0])
          : 0);
      this.compass.y =
        e.clientY -
        (e.target.style.top ? parseInt(e.target.style.top.match(/\d+/)[0]) : 0);
    },
    getDragEndingPosition(e) {
      e.target.style.top = `${e.clientY - this.compass.y}px`;
      e.target.style.left = `${e.clientX - this.compass.x}px`;
    },
    addCustomPoint() {
      const element = document.createElement("div");
      element.className = "custom-point";
      const marker = new mapboxgl.Marker(element, {
        draggable: true,
      });
      element.innerHTML += `<span> ${String.fromCharCode(
        this.customPointNames.length + 1 + 64
      )} </span>`;
      marker
        .setLngLat([this.map.getCenter().lng, this.map.getCenter().lat])
        .addTo(this.map);
      this.customPointsAdded = true;
      this.customPointNames.push({
        name: `Point ${this.customPointNames.length + 1}`,
        modifying: false,
        letter: String.fromCharCode(this.customPointNames.length + 1 + 64),
      });
    },
    // async saveConfiguration() {
    //   const configuration = {
    //     campaignChosenList: this.campaignChosenList,
    //     currentPoints: this.currentPoints,
    //     mapChosen: this.mapChosen,
    //     compass: this.compass,
    //   };
    //   configuration.currentPoints.forEach((point) => delete point.marker);
    //   // Object.assign(configuration, this.$data)
    //   // configuration.map=undefined
    //   // configuration.currentPoints.forEach(point => point.marker=undefined)
    //   // configuration.popup = undefined
    //   // console.log(configuration)
    //   await axios.post(
    //     `${process.env.VUE_APP_API_URL}/map?name=test`,
    //     configuration
    //   );
    // },
  },
};
</script>
