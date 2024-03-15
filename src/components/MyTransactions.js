import {myOpenOrdersSelector} from '../store/selectors'
import {myTradeOrdersSelector} from '../store/selectors'
import {myOpenDuelsSelector} from '../store/selectors'
import {myDuelsSelector} from '../store/selectors'
import {useSelector, useDispatch} from 'react-redux'
import sort from '../assets/sort.svg'
import Banner from './Banner'
import {useRef, useState, useEffect} from 'react'
import {cancelOrder} from '../store/interactions'
import TOKEN_ABI from '../abis/Token'
import {ethers} from 'ethers'
import config from '../config.json'

const Transactions = () => {
  const [showMyOrders, setShowMyOrders] = useState(true)
  const myOpenOrders = useSelector(myOpenOrdersSelector)
  const myTradeOrders = useSelector(myTradeOrdersSelector)
  const myDuels = useSelector(myDuelsSelector)
  const myOpenDuels = useSelector(myOpenDuelsSelector)
  const symbols = useSelector(state => state.tokens.symbols)
  const dispatch = useDispatch()
  const exchange = useSelector(state => state.exchange.contract)
  const provider = useSelector(state => state.provider.connection)
  const chainId = useSelector(state => state.provider.chainId)

  const tradeRef = useRef(null)
  const orderRef = useRef(null)

  let dogeCoin, mEth, usdt
  const [addressList, setAddressList] = useState([])

  const tabHandler = (e) => {
    if (e.target.className !== orderRef.current.className) {
      e.target.className = 'tab tab--active'
      orderRef.current.className = 'tab'
      setShowMyOrders(false)
    }
    else {
      e.target.className = 'tab tab--active'
      tradeRef.current.className = 'tab'
      setShowMyOrders(true)
    }
  }

  const cancelHandler = (order) => {
    cancelOrder(provider, exchange, order, dispatch)
  }

  useEffect(() => {
    if (chainId) {
      let addressListLocal = []

      dogeCoin = config[chainId].dogeCoin.address
      mEth = config[chainId].mEth.address
      usdt = config[chainId].USDT.address

      addressListLocal.push(dogeCoin, mEth, usdt)
      setAddressList(addressListLocal)
    }
  }, [chainId])

  return (
    <div className="component exchange__transactions">
      {showMyOrders ? (
      <div>
        <div className='component__header flex-between'>
          <h2>Duels</h2>

          <div className='tabs'>
            <button onClick={tabHandler} ref={orderRef} className='tab tab--active'>Offers</button>
            <button onClick={tabHandler} ref={tradeRef} className='tab'>Previous</button>
          </div>
        </div>

          {!myDuels || myDuels.length == 0 || !chainId ? (
            <Banner text={'No Duels'}/>
          ):(

          <table>
            <thead>
              <tr>
                <th>Amount<img src={sort}></img></th>
                <th>Amount <img src={sort}></img></th>
                <th>Player<img src={sort}></img></th>
              </tr>
            </thead>
            <tbody>

              {myOpenDuels && myOpenDuels.map((duel, index) => {
                let senderSymbol, p2Symbol

                for(let i = 0; i <= symbols.length; i++) {
                  if (duel.senderToken == addressList[i]) {
                    senderSymbol = symbols[i]
                  }

                  if (duel.p2Token == addressList[i]) {
                    p2Symbol = symbols[i]
                  }
                }

                return(
                  <tr key={index}>
                    <td>(You) {p2Symbol} {duel.formattedP2TokenAmount}</td>
                    <td>(Them) {senderSymbol} {duel.formattedSenderTokenAmount}</td>
                    <td style={{color: `${duel.duelTypeClass}`}}>{duel.sender.slice(0, 5) + '...' + duel.sender.slice(38, 42)}</td>
                    <td><button className='button--transactions'>Accept</button><button className='button--transactions'>Deny</button> </td>
                  </tr>
                )
              })}

            </tbody>
          </table>
          
          )}

      </div>
      ):(
      <div>
       <div className='component__header flex-between'>
          <h2>My Transactions</h2>

          <div className='tabs'>
            <button onClick={tabHandler} ref={orderRef} className='tab tab--active'>Offers</button>
            <button onClick={tabHandler} ref={tradeRef} className='tab'>Previous</button>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Time<img src={sort}></img></th>
              <th>Win/Loss<img src={sort}></img></th>
              <th>Opponent<img src={sort}></img></th>
            </tr>
          </thead>
          <tbody>
            {myDuels && myDuels.map((duel, index) => {
            return(
              <tr key={index}>
              <td>{duel.formattedTimestamp}</td>
              <td style={{color: `${duel.duelTypeClass}`}}>{duel.duelSign}{duel.gain}</td>
              <td>{duel.duelOpponent.slice(0, 5) + '...' + duel.duelOpponent.slice(38, 42)}</td>
            </tr>
              )           
            })}

          </tbody>
        </table>

      </div>
      )}

    </div>
  )
}

export default Transactions;