<template>
  <div
    class="legend"
    draggable
    @dragstart="getDragStartingPosition($event)"
    @dragend="getDragEndingPosition($event)"
    ref="legend"
  >
    <strong v-if="title">{{title}}</strong>
    <div v-if="biotest && data && data.length>1">
      <div v-for="(element,index) in data" :key="index" class="legend-container">
        <div class="legend-color">{{index+1}}</div>
        <span
          class="legend-content"
          v-if="!element.modifying"
          @click="element.modifying=!element.modifying"
        >{{element.name}}</span>
        <input
          v-if="element.modifying"
          @keydown.enter="element.modifying=false"
          v-model="element.name"
        />
      </div>
    </div>
    <div v-if="biotest && biotest!='mue' && biotest!='NQE'">
      <div class="legend-container">
        <div
          class="legend-color"
          :style="!newColor || biotest!='BBAC'? 'background: #4169e1' : 'background : #dbb7ff'"
        ></div>
        <span class="legend-content">Conforme</span>
      </div>
      <div class="legend-container">
        <div
          class="legend-color"
          :style="!newColor || biotest!='BBAC'?'background: #9acd32':'background : #b565f7'"
        ></div>
        <span class="legend-content">Impact faible</span>
      </div>
      <div class="legend-container">
        <div
          class="legend-color"
          :style="!newColor || biotest!='BBAC'?'background: #ffd700':'background : #8909ff'"
        ></div>
        <span class="legend-content">Impact modéré</span>
      </div>
      <div class="legend-container">
        <div
          class="legend-color"
          :style="!newColor || biotest!='BBAC'?'background: #ff8c00':'background : #6600cc'"
        ></div>
        <span class="legend-content">Impact fort</span>
      </div>
      <div class="legend-container">
        <div
          class="legend-color"
          :style="!newColor || biotest!='BBAC'?'background: #dc143c':'background : #47008e'"
        ></div>
        <span class="legend-content">Impact très fort</span>
      </div>
      <div class="legend-container">
        <div class="legend-color" style="background: #ffffff"></div>
        <span class="legend-content">Pas de résultat disponible</span>
      </div>
      <div
        v-if="biotest=='BBAC' || biotest=='alimentation' || biotest=='toxicité'"
        class="legend-container"
      >
        <div class="legend-color" style="background: #808080"></div>
        <span class="legend-content">Résultat non-interprétable</span>
      </div>
    </div>
    <div v-if="biotest=='mue' && data==undefined">
      <div class="legend-container">
        <div class="legend-color" style="background: #4169e1"></div>
        <span class="legend-content">Conforme</span>
      </div>
      <div class="legend-container">
        <div class="legend-color" style="background: #dc143c"></div>
        <span class="legend-content">Non Conforme</span>
      </div>
      <div class="legend-container">
        <div class="legend-color" style="background: #ffffff"></div>
        <span class="legend-content">Pas de résultat disponible</span>
      </div>
    </div>
    <div v-if="biotest=='NQE'">
      <div class="legend-container">
        <div class="legend-color" style="background: #4169e1"></div>
        <span class="legend-content">Pas de dépassement</span>
      </div>
      <div class="legend-container">
        <div class="legend-color" style="background: #dc143c"></div>
        <span class="legend-content">Dépassement de la NQE</span>
      </div>
      <div class="legend-container">
        <div class="legend-color" style="background: #ffffff"></div>
        <span class="legend-content">Pas de résultat disponible</span>
      </div>
      <div v-if="NQEValidationPrecision" class="legend-container">
        <div class="legend-color" style="background: #ffffff; border:2px solid red"></div>
        <span class="legend-content">Témoin non-valide</span>
      </div>
    </div>
    <div v-if="name=='layer-legend'">
      <div class="legend-container" v-for="line in data" :key="line.id">
        <div class="legend-color" :style="getColor(line)"></div>
        <span class="legend-content">{{line.sector}}</span>
      </div>
    </div>
    <div v-if="name=='toxicity-result-legend'">
      <div class="legend-head"></div>
      <table>
        <thead>
          <tr>
            <th></th>
            <th class="toxicity-legend-header">Alimentation</th>
            <th class="toxicity-legend-header">Neurotoxicité</th>
            <th class="toxicity-legend-header">Fécondité</th>
            <th class="toxicity-legend-header">Mue</th>
            <th class="toxicity-legend-header">PE</th>
          </tr>
        </thead>
        <tbody v-for="(element,index) in data" :key="index">
          <tr>
            <td>
              <span
                class="legend-content"
                v-if="!element.modifying"
                @click="element.modifying=!element.modifying"
              >{{element.name}}</span>
              <input
                v-if="element.modifying"
                @keydown.enter="element.modifying=false"
                v-model="element.name"
              />
            </td>
            <td class="legend-color"></td>
            <td class="legend-color"></td>
            <td class="legend-color"></td>
            <td class="legend-color"></td>
            <td class="legend-color"></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="name=='custom-points-legend'">
      <div v-for="(element,index) in data" :key="index" class="legend-container">
        <span class="legend-color">{{element.letter}}</span>
        <span
          class="legend-content"
          v-if="!element.modifying"
          @click="element.modifying=!element.modifying"
        >{{element.name}}</span>
        <input
          v-if="element.modifying"
          @keydown.enter="element.modifying=false"
          v-model="element.name"
        />
      </div>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      x: undefined,
      y: undefined,
    };
  },
  props: [
    "title",
    "data",
    "campaign",
    "name",
    "biotest",
    "NQEValidationPrecision",
    "newColor",
  ],
  methods: {
    getColor(line) {
      const result = this.hexToRGBA(line.color, line.opacity);
      return `background:rgba(${result[0]},${result[1]},${result[2]},${result[3]});`;
    },
    getDragStartingPosition(e) {
      this.x =
        e.clientX -
        (e.target.style.left
          ? parseInt(e.target.style.left.match(/\d+/)[0])
          : 0);
      this.y =
        e.clientY -
        (e.target.style.top ? parseInt(e.target.style.top.match(/\d+/)[0]) : 0);
    },
    getDragEndingPosition(e) {
      e.target.style.top = `${e.clientY - this.y}px`;
      e.target.style.left = `${e.clientX - this.x}px`;
    },
    hexToRGBA(hexaColor, opacity) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexaColor);
      return result
        ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16),
            opacity,
          ]
        : null;
    },
  },
};
</script>
<style>
</style>