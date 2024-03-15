import { useEffect } from 'react'
import { ethers } from 'ethers'
import { useDispatch } from 'react-redux'
import {useSelector} from 'react-redux'

import TOKEN_ABI from '../abis/Token.json'
import config from '../config.json'

import { 
  loadProvider, 
  loadNetwork, 
  loadAccount, 
  loadTokens, 
  loadExchange,
  subscribeToEvents,
  loadOrders,
  loadDuels
} from '../store/interactions'

import Navbar from './Navbar'
import Markets from './Markets'
import Balance from './Balance'
import Orders from './Orders'
import Orderbook from './Orderbook'
import PriceChart from './PriceChart'
import Trades from './Trades'
import MyTransactions from './MyTransactions'
import Alert from './Alert'
import LogIn from './LogIn'

function App() {
  const dispatch = useDispatch()
  const account = useSelector(state => state.provider.account)


  const loadBlockchainData = async () => {
    let provider, providerHardhat
    [provider, providerHardhat] = loadProvider(dispatch)
    const { chainId } = await loadNetwork(dispatch, provider)

    window.ethereum.on('chainChanged', () => {
      window.location.reload()
    })

    window.ethereum.on('accountsChanged', () => {
      loadAccount(dispatch, provider)
    })


    const dogeCoin = config[chainId].dogeCoin
    const mEth = config[chainId].mEth
    const USDT = config[chainId].USDT
    await loadTokens(dispatch, provider, [dogeCoin.address, mEth.address, USDT.address])

    const exchangeConfig = config[chainId].exchange
    const exchange = await loadExchange(dispatch, provider, exchangeConfig.address)

    loadOrders(dispatch, provider, exchange)
    

    loadDuels(dispatch, provider, exchange)
    await subscribeToEvents(exchange, dispatch, providerHardhat, account, [dogeCoin.address, mEth.address, USDT.address])
  }

  useEffect(() => {
    loadBlockchainData()
  })

  return (
    <div>

      <Navbar />
      <LogIn />

      <main className='exchange grid'>
        <section className='exchange__section--left grid'>

          <Markets />

          <Balance />

          <Orders />

        </section>
        <section className='exchange__section--right grid'>

          <PriceChart />

          <MyTransactions />

          <Trades/>

          <Orderbook />

        </section>
      </main>

      <Alert/>

    </div>
  );
}

export default App;