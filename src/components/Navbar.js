import { useSelector, useDispatch } from 'react-redux'
import { loadAccount } from '../store/interactions'
import {useEffect} from 'react'
import {useState} from 'react'
import config from '../config.json'
import Blockies from 'react-blockies'
import {currentBalanceSelector} from '../store/selectors'

import logo from '../assets/logo.png'
import ethlogo from '../assets/eth.svg'

import BTCLogo from '../assets/bitcoin-btc-logo.png'
import ETHLogo from '../assets/ethlogo.png'
import USDTLogo from '../assets/tether-usdt-logo.png'

const Navbar = () => {
  const provider = useSelector(state => state.provider.connection)
  const chainId = useSelector(state => state.provider.chainId)
  const accountConnect = useSelector(state => state.provider.account)
  const balance = useSelector(state => state.provider.balance)
  const dispatch = useDispatch()
  const accountLogIn = useSelector(state => state.localAccount.account.username)
  let stateImage = useSelector(state => state.tokens.image)
  const localBalance = useSelector(currentBalanceSelector)
  const experienceAmount = useSelector(state => state.provider.xp.amount)
  const experienceLevel = useSelector(state => state.provider.xp.level)
  console.log(chainId)

  const [cryptoImage, setCryptoImage] = useState('')

  const connectHandler = async () => {
  	await loadAccount(dispatch, provider)
  }

  const networkHandler = async (e) => {
  	await window.ethereum.request({
  		method: 'wallet_switchEthereumChain',
  		params: [{chainId: e.target.value}]
  	})
  }

  const logHandler = () => {
    dispatch({type: 'LOG_IN_ATTEMPT'})
  }

  const depositHandler = () => {
    dispatch({type: 'DEPOSIT_ATTEMPT'})
  }

  const getPercentage = () => {
    if (experienceAmount){
      let percentage = experienceAmount[0] / experienceAmount[1] * 100
      console.log(percentage)
      return percentage
    }
  }

  useEffect(() => {
  }, [stateImage])

  return(
    <div className='exchange__header--bg'>
    <div className='exchange__header grid'>
      <div className='exchange__header--brand flex'>
      	<h1>ETH BATTLES</h1>
      </div>

      <div className='exchange__header--networks flex'>
        <ul className='exchange__header--playhome'>
          <li className='exchange__header--home'>HOME</li>
          <li className='exchange__header--play'>PLAY</li>
        </ul>
      </div>

      <div className='exchange__header--account flex'>
      	{balance ? (
          <div className='exchange__header--account--balance'>
             {stateImage && <img src={stateImage} className='logo'></img>}
            <p className='exchange__header--account--message'><small>Balance</small>{balance.slice(0, 7)}</p>
          </div>
      	):(
      	<div className='exchange__header--account--balance'>
            <img src={"/static/media/bitcoin-btc-logo.82491fef997ab841639c.png"} className='logo'></img>
            <p><small>Balance</small>${localBalance}</p>
        </div>
      	)}

      	{accountConnect ? (
        <div>
      	  <a href={config[chainId] ? `${config[chainId].explorerURL}${accountConnect}` : '#'} className='blockie' target='_blank' rel='noreferrer'>
      	  {accountConnect.slice(0, 5) + '...' + accountConnect.slice(38, 42)}
      	  <Blockies 
      	  	seed={accountConnect}
    		size={10}
    		scale={3}
    		color="#ff0004"
    		bgColor="#ffe"
    		spotColor="#2200ff" 
    		className="identicon"
      	  />

      	  </a>

          <div className='exchange__header--account--xp'>
              <p className='exchange__header--account--xp--2'><small>XP {experienceAmount && experienceAmount[0]} / {experienceAmount[1]}</small></p>
              <p className='exchange__header--account--xp--3'><small>Level {experienceLevel}</small></p>
              <div className='dot'></div>
              <div className='exchange__header--account--xpbar'></div>
              <div className='exchange__header--account--xpbarfill' style={experienceAmount && {width: `${getPercentage()}%`}}></div>
          </div>
          <div className='exchange__header--account--buttons'>
              <button className='button' onClick={depositHandler}>Deposit</button>
          </div>
        </div>

        ): accountLogIn ?(    
          <div>
          <div className='exchange__header--account--buttons'>
              <button className='button' onClick={depositHandler}>Deposit</button>
          </div>
          <div className='exchange__header--account--xp'>
              <p className='exchange__header--account--xp--2'><small>XP {experienceAmount && experienceAmount[0]} / {experienceAmount[1]}</small></p>
              <p className='exchange__header--account--xp--3'><small>Level {experienceLevel}</small></p>
              <div className='dot'></div>
              <div className='exchange__header--account--xpbar'></div>
              <div className='exchange__header--account--xpbarfill' style={experienceAmount && {width: `${getPercentage()}%`}}></div>
          </div>
          </div>
      	):(
          <div>
          <div className='exchange__header--account--buttons'> 
      	    <button className='button' onClick ={connectHandler}>Connect</button>
            <button className='button' onClick={logHandler}>Log In</button>
          </div>
          <div className='exchange__header--account--xp'>
              <p className='exchange__header--account--xp--2'><small>XP {experienceAmount && experienceAmount[0]} / {experienceAmount[1]}</small></p>
              <p className='exchange__header--account--xp--3'><small>Level {experienceLevel}</small></p>
              <div className='dot'></div>
              <div className='exchange__header--account--xpbar'></div>
              <div className='exchange__header--account--xpbarfill' style={experienceAmount && {width: `${getPercentage()}%`}}></div>
          </div>
          </div>
      	)}

      </div>
    </div>
    </div>
  )
}

export default Navbar;