<script>
import { Line } from 'vue-chartjs'

export default {
  data() {
    return {
    }
  },
  extends: Line,
  props: ['height','chartData','chartLabelData'],
  methods:{
    renderLineChart: function() {
      this.renderChart({
        labels: this.chartLabelData,
        datasets: this.chartData
      }, {
        tooltips: {
          enabled: true,
          intersect: true,
          mode: 'index',
          position: 'nearest',
          callbacks: {
            labelColor: function (tooltipItem, chart) {
              return { backgroundColor: chart.data.datasets[tooltipItem.datasetIndex].borderColor }
            }
          }
        },
        maintainAspectRatio: false,
        legend: {
          display: true
        },
        scales: {
          xAxes: [{
            gridLines: {
              drawOnChartArea: false
            }
          }],
          yAxes: [{
            ticks: {
              beginAtZero: true,
              maxTicksLimit: 5,
            },
            gridLines: {
              display: true
            }
          }]
        },
        elements: {
          point: {
            radius: 0,
            hitRadius: 10,
            hoverRadius: 4,
            hoverBorderWidth: 3
          }
        }
      })
    }
  },
  mounted () {
    this.renderLineChart();
  },
  watch: {
    chartData: function() {
      console.log('update etc')
      this.renderLineChart();
    }
  }
}
</script>
