<template>
  <div id="app">
    <b-navbar toggleable="md" type="dark" variant="dark">
      <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>
      <b-navbar-brand href="#">IOT Application Dashboard</b-navbar-brand>
    </b-navbar>

    <b-container fluid id="container" class="bv-example-row">
      <b-row>
          <b-col style="max-width:50%">
            <b-card title="Own API"
              tag="article"
              class="mb-2" v-if="weatherData.length > 0">
              <p class="card-text">
                <i>Last update: </i><b>{{formatDate(weatherData[0].created_at, "DD-MMM-YY HH:mm:ss", false)}}</b><br><br>
                <b-row>
                  <b-col>
                    <b-card title="Temperature"
                      tag="article"
                      style="max-width: 30rem;"
                      class="mb-2" v-if="weatherData.length > 0">
                      <p class="card-text">
                        <i>Temperature: </i><b>{{weatherData[0].temperature}}°</b><br>
                      </p>
                    </b-card>
                  </b-col>
                  <b-col>
                    <b-card title="Humidity"
                      tag="article"
                      style="max-width: 30rem;"
                      class="mb-2" v-if="weatherData.length > 0">
                      <p class="card-text">
                        <i>Humidity: </i><b>{{weatherData[0].humidity}}°</b><br>
                      </p>
                    </b-card>
                  </b-col>
                </b-row>
              </p>
            </b-card>
          </b-col>

          <b-col style="max-width:50%">
            <b-card title="Dark Sky API"
              tag="article"
              class="mb-2" v-if="weatherData_darksky_current.time">
              <p class="card-text">
                <i>Last update: </i><b>{{formatDate(weatherData_darksky_current.time, "DD-MMM-YY HH:mm:ss", true)}}</b><br><br>
                <b-row>
                  <b-col>
                    <b-card title="Temperature"
                      tag="article"
                      style="max-width: 30rem;"
                      class="mb-2">
                      <p class="card-text">
                        <i>Temperature: </i><b>{{weatherData_darksky_current.temperature}}°</b><br>
                      </p>
                    </b-card>
                  </b-col>
                  <b-col>
                    <b-card title="Humidity"
                      tag="article"
                      style="max-width: 30rem;"
                      class="mb-2">
                      <p class="card-text">
                        <i>Humidity: </i><b>{{weatherData_darksky_current.humidity}}°</b><br>
                      </p>
                    </b-card>
                  </b-col>
                </b-row>
              </p>
            </b-card>
          </b-col>
      </b-row>
      <b-row>
        <b-col style="max-width:100%">
          <b-card no-body>
            <b-tabs pills card>
              <b-tab title="Temerature" active @click="changeTab('temp')">
                <b-row>
                  <b-col style="max-width:100%">
                    <b-card title="Temperature Chart"
                      tag="article"
                      class="mb-2" v-if="tabTemp">
                      <p class="card-text">
                        <chart class="chart-wrapper" height="500" :chartData="temperatureData" :chartLabelData="temperatureLabelData"></chart>
                      </p>
                    </b-card>
                  </b-col>
                </b-row>
              </b-tab>
              <b-tab title="Humidity" @click="changeTab('hum')">
                <b-row>
                  <b-col style="max-width:100%">
                    <b-card title="Humidity Chart"
                      tag="article"
                      class="mb-2">
                      <p class="card-text" v-if="tabHum">
                        <chart class="chart-wrapper" height="500" :chartData="humidityData" :chartLabelData="humidityLabelData"></chart>
                      </p>
                    </b-card>
                  </b-col>
                </b-row>
              </b-tab>
            </b-tabs>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import axios from 'axios'
import moment,{ min } from 'moment'
import Chart from './components/Chart'
import * as R from 'ramda'
import config from '../config'

export default {
  name: 'app',
  components: {
    Chart
  },
  data: function () {
    return {
      tabTemp:true,
      tabHum:false,
      weatherData:[],
      weatherData_darksky_current:{},
      weatherData_darksky:[],

      temperatureData:[],
      temperatureLabelData:[],
      humidityData:[],
      humidityLabelData:[],
    }
  },
  methods: {
    clearData(){
      this.weatherData = []
      this.weatherData_darksky_current = {}
      this.weatherData_darksky= []

      this.temperatureData = []
      this.temperatureLabelData = []
      this.humidityData = []
      this.humidityLabelData = []
    },
    async getData(){
      //get data from own api
      this.weatherData = (await axios.get(config.PROXY+config.OWN_API+':'+config.OWN_API_PORT+'/weather_measures?start_date='+moment().subtract(1, 'days').format("YYYY-MM-DD")+' 00:00:00&end_date='+moment().add(1, 'days').format("YYYY-MM-DD"))).data
      //get data from darksky from yesterday and today
      var tmpDarkSky = []
      tmpDarkSky.push((await axios.get(config.PROXY+config.EXTERNAL_API+'/forecast/'+config.EXTERNAL_API_KEY+'/52.4899663,4.9431226,'+moment().subtract(1, 'days').format("X")+'?lang=nl&units=auto')).data)
      tmpDarkSky.push((await axios.get(config.PROXY+config.EXTERNAL_API+'/forecast/'+config.EXTERNAL_API_KEY+'/52.4899663,4.9431226,'+moment().format("X")+'?lang=nl&units=auto')).data)

      //add darksky currently to weatherData_darksky_current and add all hourly data to weatherData_darksky
      this.weatherData_darksky_current = tmpDarkSky[1].currently
      for (let i = 0; i < tmpDarkSky.length; i++) {
        for (let j = 0; j < tmpDarkSky[i].hourly.data.length; j++) {
          this.weatherData_darksky.push(tmpDarkSky[i].hourly.data[j])
        }
      }

      this.getTemperatureData();
      this.getHumidityData();
    },

    getTemperatureData(){
      //add data from darksy to temperature array
      var dataDarkSkyTemperature = [];
      for (let i = 0 ; i < this.weatherData_darksky.length; i++) {
        dataDarkSkyTemperature.push(this.weatherData_darksky[i].temperature)
        this.temperatureLabelData.push(this.formatDate(this.weatherData_darksky[i].time, 'DD-MM-YYYY HH:mm', true))
      }

      //add data from own api to temperature array
      var dataOwnTemperature = [];
      var tmpHour = 0
      for (let i = 0 ; i < this.weatherData.length; i++) {
        var day = this.formatDate(this.weatherData[i].created_at, 'DD', false)
        var hour = this.formatDate(this.weatherData[i].created_at, 'HH', false)
        var minute = this.formatDate(this.weatherData[i].created_at, 'mm', false)

        if((day == this.formatDate(moment(), 'DD', false) || day == this.formatDate(moment().subtract(1, 'days'), 'DD', false)) && minute === "00"){
          if(tmpHour != 0){
            if((tmpHour - hour) != 1){
              for (let i = 1; i < (tmpHour - hour); i++) {
                dataOwnTemperature.push(NaN)
              }
            }
          }
          dataOwnTemperature.push(this.weatherData[i].temperature)
          tmpHour = hour
        }
      }

      dataOwnTemperature = R.reverse(dataOwnTemperature);

      this.temperatureData.push(
        {
          label:"Dark Sky API",
          backgroundColor: 'transparent',
          borderColor: "blue",
          pointHoverBackgroundColor: '#fff',
          borderWidth: 2,
          data: dataDarkSkyTemperature
        }
      )

      this.temperatureData.push(
        {
          label:"Own API",
          backgroundColor: 'transparent',
          borderColor: "red",
          pointHoverBackgroundColor: '#fff',
          borderWidth: 2,
          data: dataOwnTemperature,
        }
      )
    },

    getHumidityData(){
      //add data from darksy to humidity array
      var dataDarkSkyHumidity = [];
      for (let i = 0 ; i < this.weatherData_darksky.length; i++) {
        dataDarkSkyHumidity.push(this.weatherData_darksky[i].humidity)
        this.humidityLabelData.push(this.formatDate(this.weatherData_darksky[i].time, 'DD-MM-YYYY HH:mm', true))
      }

      //add data from own api to humidity array
      var dataOwnHumidity = [];
      var tmpHour = 0
      for (let i = 0 ; i < this.weatherData.length; i++) {
        var day = this.formatDate(this.weatherData[i].created_at, 'DD', false)
        var hour = this.formatDate(this.weatherData[i].created_at, 'HH', false)
        var minute = this.formatDate(this.weatherData[i].created_at, 'mm', false)

        if((day == this.formatDate(moment(), 'DD', false) || day == this.formatDate(moment().subtract(1, 'days'), 'DD', false)) && minute === "00"){
          if(tmpHour != 0){
            if((tmpHour - hour) != 1){
              for (let i = 1; i < (tmpHour - hour); i++) {
                dataOwnHumidity.push(NaN)
              }
            }
          }
          dataOwnHumidity.push(this.weatherData[i].humidity)
          tmpHour = hour
        }
      }

      dataOwnHumidity = R.reverse(dataOwnHumidity);

      this.humidityData.push(
        {
          label:"Dark Sky API",
          backgroundColor: 'transparent',
          borderColor: "blue",
          pointHoverBackgroundColor: '#fff',
          borderWidth: 2,
          data: dataDarkSkyHumidity
        }
      )

      this.humidityData.push(
        {
          label:"Own API",
          backgroundColor: 'transparent',
          borderColor: "red",
          pointHoverBackgroundColor: '#fff',
          borderWidth: 2,
          data: dataOwnHumidity,
        }
      )
    },

    changeTab(tab){
      if(tab == "temp"){
        this.tabTemp = true
        this.tabHum = false
      }
      if(tab == "hum"){
        this.tabTemp = false
        this.tabHum = true
      }
    },

    formatDate(time, format, unix){
      if(unix){
        return moment.unix(time).format(format)
      } else{
        return moment(time).format(format)
      }
    },

    getHighestTempValue(){
      var highestTemp = this.weatherData[0].temperature;
      for (let i = 1; i < this.weatherData.length; i++) {
        if(highestTemp < this.weatherData[i].temperature){
          highestTemp = this.weatherData[i].temperature
        }
      }

      return highestTemp
    },
    getHighestHumValue(){
      var highestHum = this.weatherData[0].humidity;
      for (let i = 1; i < this.weatherData.length; i++) {
        if(highestHum < this.weatherData[i].humidity){
          highestHum = this.weatherData[i].humidity
        }
      }

      return highestHum
    },
    getLowestTempValue(){
      var lowestTemp = this.weatherData[0].temperature;
      for (let i = 1; i < this.weatherData.length; i++) {
        if(lowestTemp > this.weatherData[i].temperature){
          lowestTemp = this.weatherData[i].temperature
        }
      }

      return lowestTemp
    },
    getLowestHumValue(){
      var lowestHum = this.weatherData[0].humidity;
      for (let i = 1; i < this.weatherData.length; i++) {
        if(lowestHum > this.weatherData[i].humidity){
          lowestHum = this.weatherData[i].humidity
        }
      }

      return lowestHum
    }

  },
  async mounted () {
    this.getData()
    setInterval(() => {
      this.clearData()
			this.getData()
    }, 1000 * 60 * 5)
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#container {
  margin-top: 10px;
}
</style>
