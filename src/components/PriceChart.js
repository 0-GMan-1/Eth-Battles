import { useSelector } from 'react-redux'
import Banner from './Banner'
import Chart from 'react-apexcharts'
import { options, series } from './PriceChart.config'
import { priceChartSelector } from '../store/selectors'
import arrowDown from '../assets/down-arrow.svg'
import arrowUp from '../assets/up-arrow.svg'

const PriceChart = () => {
  const account = useSelector(state => state.provider.account)
  const symbols = useSelector(state => state.tokens.symbols)
  const priceChart = useSelector(priceChartSelector) 

  return (
    <div className="component exchange__chart">
      <div className='component__header flex-between'>
        <div className='flex'>
          <div className='character_screen'>
          </div>
        </div>
      </div>
     
        <Banner text={'Create Your Character'} />

    </div>
  );
}

export default PriceChart;