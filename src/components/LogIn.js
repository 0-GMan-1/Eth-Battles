import {useEffect} from 'react'
import {useRef} from 'react'
import {useSelector} from 'react-redux'
import {useDispatch} from 'react-redux'
import {useState} from 'react'
import XLogo from '../assets/xlogo.png'
import {logIn, createGuild, loadBalances, transferTokens, loadBalancesNew} from '../store/interactions'
import BTCLogo from '../assets/bitcoin-btc-logo.png'
import ETHLogo from '../assets/ethlogo.png'
import USDTLogo from '../assets/tether-usdt-logo.png'
import {transfersToExchange} from '../store/interactions'

const LogIn = () => {
  const loggingIn = useSelector(state => state.localAccount.logProccess.loading)
  const cancelled = useSelector(state => state.localAccount.logProccess.cancelled)
  const depositing = useSelector(state => state.localAccount.depositProccess.loading)
  const localBalance = useSelector(state => state.tokens.cryptoBalances.btcBalance)
  const stateCryptoImage = useSelector(state => state.tokens.image)
  const exchange = useSelector(state => state.exchange.contract)
  const tokens = useSelector(state => state.tokens.contracts)
  const provider = useSelector(state => state.provider.connection)
  const guildCreate = useSelector(state => state.provider.guilds.running.running)
  const account = useSelector(state => state.provider.account)
  const guilds = useSelector(state => state.provider.guilds.list)
  const symbols = useSelector(state => state.tokens.symbols)
  const balance = useSelector(state => state.tokens.selectedToken.balance)
  const exchangeBalance = useSelector(state => state.tokens.selectedToken.exchangeBalance)

  const logInRef = useRef(null)
  const guildRef = useRef(null)
  const formRef = useRef(null)

  const [userNameVal, setUserNameVal] = useState('')
  const [passVal, setPassVal] = useState('')
  const [isLogIn, setIsLogIn] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [selectedToken, setSelectedToken] = useState('ETH')
  const [cryptoImage, setCryptoImage] = useState(ETHLogo)
  const [guildNameVal, setGuildNameVal] = useState('')
  const [maxPlayersVal, setMaxPlayersVal] = useState(0)
  const [isDeposit, setIsDeposit] = useState(true)
  const [tokenTransferAmount, setTokenTransferAmount] = useState(0)

  const dispatch = useDispatch()

  const clickHandler = async (e) => {
    if (guildCreate == true) {
      guildRef.current.className = 'alert alert--remove'
      dispatch({type: 'GUILD_CREATE_CANCEL'})
      return
    }

    logInRef.current.className = 'alert alert--remove'
    dispatch({type: 'LOG_IN_CANCEL'})
    console.log(logInRef.current.className)
  }

  const userNameHandler = (e) => {
    setUserNameVal(e.target.value)
  }

  const passHandler = (e) => {
    setPassVal(e.target.value)
  }

  const guildNameHandler = (e) => {
    setGuildNameVal(e.target.value)
  }

  const maxPlayersHandler = (e) => {
    setMaxPlayersVal(e.target.value)
  }

  const logInHandler = (e, dispatch, input1, input2) => {
    e.preventDefault()
    
    if (guildCreate == true) {
      if (guildNameVal != '' && maxPlayersVal != 0) {
        input2 = parseInt(input2)
        createGuild(dispatch, account, input1, input2, guilds)
        setGuildNameVal('')
        setMaxPlayersVal(0)
        guildRef.current.className = 'alert alert--remove'
        return
      }
      else {
        formRef.current.innerText = 'Please Enter Valid Players or Name'
        formRef.current.className = 'alert2--warning'
      }
    }

    else if(loggingIn && userNameVal.length != 0 && passVal != 0) {
      logIn(dispatch, input1, input2)
      setUserNameVal('')
      setPassVal('')
      logInRef.current.className = 'alert alert--remove'
    }
    else {
      formRef.current.className = 'alert2--warning'
    }
  }

  const currencyHandler = (e) => {
    e.preventDefault()
    let localCryptoImage

    transfersToExchange(provider, exchange)

    if (selectedToken == 'BTC') {
      setCryptoImage(BTCLogo)
      localCryptoImage = BTCLogo
    } 
    else if (selectedToken == 'ETH') {
      setCryptoImage(ETHLogo)
      localCryptoImage = ETHLogo
    }
    else if (selectedToken == 'USDT') {
      setCryptoImage(USDTLogo)
      localCryptoImage = USDTLogo
      console.log(exchangeBalance)
    }

    dispatch({type: 'TOKEN_SELECTED', selectedToken, localCryptoImage})
  }

  const transferHandler = (e, isDeposit) => {
    e.preventDefault()
    if (isDeposit) {
      if (selectedToken == 'BTC') {
        transferTokens(dispatch, provider, exchange, 'deposit', tokens[0], tokenTransferAmount)
        setTokenTransferAmount(0)
      }
      else if (selectedToken == 'ETH') {
        transferTokens(dispatch, provider, exchange, 'deposit', tokens[1], tokenTransferAmount)
        setTokenTransferAmount(0)
      }
      else if (selectedToken == 'USDT') {
        transferTokens(dispatch, provider, exchange, 'deposit', tokens[2], tokenTransferAmount)
        setTokenTransferAmount(0)
      }
    }
  }

  useEffect(() => {
    if(loggingIn == true) {
      logInRef.current.className = 'alert2'
    }
    if(depositing == true) {
      logInRef.current.className = 'alert2--deposit'
    }
    else if (guildCreate == true) {
      guildRef.current.className = 'alert2'
    }

  }, [loggingIn, depositing, stateCryptoImage, guildCreate])

  return (
    <div>
      {loggingIn == true ? (
        <div className="alert alert--remove" ref={logInRef}>
        <img src={XLogo} alt='Logos' className='close' onClick={clickHandler}/>
          <h1>Please Log In or Sign Up Below</h1>
          <h1 className='alert2--warning--remove' ref={formRef}>Invalid Username or Password</h1>
            <div className='alert2--form'>    
              <form onSubmit={(e) => logInHandler(e, dispatch, userNameVal, passVal)}>
                <label>UserName</label>
                <input className='alert2--input' onChange={(e) => userNameHandler(e)}></input>
                <label>Password</label>
                <input className='alert2--input' onChange={(e) => passHandler(e)}></input>
                <button className='button' type='submit' onClick={() => setIsLogIn(true)}>Log In</button>
                <button className='button' type='submit' onClick={() => setIsSignUp(true)}>Sign Up</button>
              </form>  
            </div>
        </div>

      ) : depositing ?(
        <div className="alert alert--remove" ref={logInRef}>
          <div className='alert2--content'>
            <img src={XLogo} alt='Logos' className='close' onClick={clickHandler}/>
            <button className='alert2--balance'>
                <img className='logo' src={cryptoImage}></img>
                <h1>Balance ${exchangeBalance && exchangeBalance}</h1>
            </button>
            <div className='alert2--address'>
              <h1>{selectedToken && selectedToken} Deposit Address</h1> 
              <p>{exchange.address && exchange.address}</p>
            </div>

            <div className='exchange__transfers--form'>
              <div className='flex-between'>
                <p><small>Token</small> <br/> <img src={cryptoImage} alt='Token Logo' />{selectedToken && selectedToken}</p>
                <p><small>Wallet</small> <br/> {balance && balance}</p>
              </div>

              <form onSubmit={(e) => transferHandler(e, isDeposit)}>
                <label htmlFor="token0">{selectedToken} Amount</label>
                <input type="text" id='token0' placeholder='0.0000' value={tokenTransferAmount === 0 ? '' : tokenTransferAmount} onChange={(e) => setTokenTransferAmount(e.target.value)} />
                <button className='button' type='submit'>
               {isDeposit ? (
                <span>Deposit</span>
                ):(
                <span>Withdraw</span>
                )
               }
              </button>
            </form>
          </div>

            <form className='alert2--balances' onSubmit={currencyHandler}>
              <button className='alert2--balance' type='submit' onClick={() => setSelectedToken('BTC')}>
                <img src={BTCLogo} className='logo'></img><span>BTC</span>
              </button>
              <button className='alert2--balance' type='submit' onClick={() => setSelectedToken('ETH')}>
                <img src={ETHLogo} className='logo'></img><span>ETH</span>
              </button>
              <button className='alert2--balance' type='submit' onClick={() => setSelectedToken('USDT')}>
                <img src={USDTLogo} className='logo'></img><span>USDT</span>
              </button>
            </form>

          </div>
        </div>
      ) : guildCreate ? (
        <div className="alert alert--remove" ref={guildRef}>
        <img src={XLogo} alt='Logos' className='close' onClick={clickHandler}/>
          <h1>Create Guild</h1>
          <h1 className='alert2--warning--remove' ref={formRef}>Invalid Username or Password</h1>
            <div className='alert2--form'>    
              <form onSubmit={(e) => logInHandler(e, dispatch, guildNameVal, maxPlayersVal)}>
                <label>Name</label>
                <input className='alert2--input' onChange={(e) => guildNameHandler(e)}></input>
                <label>Max Players</label>
                <input className='alert2--input' onChange={(e) => maxPlayersHandler(e)} placeHolder={'1-10'}></input>
                <div className='dot'></div>
                <button className='button'>Upload Picture</button>
                <button className='button' type='submit' onClick={() => setIsSignUp(true)}>Create</button>
              </form>  
            </div>
        </div>
      ) : 
        <div className="alert alert--remove"></div>
      }
    </div>
  );
}

export default LogIn;