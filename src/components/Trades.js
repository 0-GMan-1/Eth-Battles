import {useSelector} from 'react-redux'
import {tradeOrdersSelector} from '../store/selectors'
import sort from '../assets/sort.svg'
import Banner from './Banner'

const Trades = () => {
  const tradeOrders = useSelector(tradeOrdersSelector)
  const symbols = useSelector(state => state.tokens.symbols)

  return (
    <div className="component exchange__trades">
      <div className='component__header flex-between'>
        <h2>Trades</h2>
      </div>

      {!tradeOrders || tradeOrders.length == 0 ? (

        <Banner text={'No Transactions'} />

      ):(

        <table>
          <thead>
            <tr>
              <th>Time<img src={sort}></img></th>
              <th>{symbols && symbols[0]}<img src={sort}></img></th>
              <th>{symbols && symbols[0]}/{symbols && symbols[1]}<img src={sort}></img></th>
            </tr>
          </thead>
          <tbody>

            {tradeOrders && tradeOrders.map((order, index) => {
              return(
                <tr key={index}>
                  <td>{order.formattedTimestamp}</td>
                  <td>{order.token0Amount}</td>
                  <td style={{ color: `${order.tokenPriceClass}` }}>{order.tokenPrice}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      
      )}

    </div>
  );
}

export default Trades;