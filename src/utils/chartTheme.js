import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

let registered = false
export const registerCharts = () => {
  if (registered) return
  ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, ChartDataLabels)

  ChartJS.defaults.set('plugins.datalabels', { display: false })
  registered = true
}

export const CHART_COLORS = {
  primary: '#5f43e8',
  primarySoft: '#eeeaff',
  green: '#168457',
  greenSoft: '#ebf8f1',
  amber: '#a96f12',
  amberSoft: '#fff7e7',
  red: '#c94d4d',
  redSoft: '#fbebeb',
  blue: '#3c70c4',
  blueSoft: '#edf4ff',
  ink: '#22252b',
  inkMuted: '#69707a',
  line: '#e8e7e3',
}

export const CHART_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.blue,
  CHART_COLORS.green,
  CHART_COLORS.amber,
  CHART_COLORS.red,
]

const FONT_FAMILY = "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

export const baseChartOptions = (overrides = {}) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false, labels: { font: { family: FONT_FAMILY, size: 11 }, color: CHART_COLORS.inkMuted } },
    tooltip: {
      backgroundColor: CHART_COLORS.ink,
      titleFont: { family: FONT_FAMILY, size: 11, weight: '600' },
      bodyFont: { family: FONT_FAMILY, size: 11 },
      padding: 8,
      cornerRadius: 8,
      displayColors: false,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { family: FONT_FAMILY, size: 10.5 }, color: CHART_COLORS.inkMuted },
    },
    y: {
      grid: { color: CHART_COLORS.line },
      ticks: { font: { family: FONT_FAMILY, size: 10.5 }, color: CHART_COLORS.inkMuted },
      beginAtZero: true,
    },
  },
  ...overrides,
})
