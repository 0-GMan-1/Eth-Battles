import { useEffect, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { loadBalances, makeOrder} from '../store/interactions'

const Order = () => {
  const tokens = useSelector(state => state.tokens.contracts)
  const exchange = useSelector (state => state.exchange.contract)
  const provider = useSelector(state => state.provider.connection)
  const dispatch = useDispatch()

  const [isBuy, setIsBuy] = useState(true)
  const [tokenAmount, setTokenAmount] = useState(0)
  const [priceAmount, setPriceAmount] = useState(0)

  const buyRef = useRef(null)
  const sellRef = useRef(null)

  const tabHandler = (e) => {
    if (e.target.className !== buyRef.current.className) {
      e.target.className = 'tab tab--active'
      buyRef.current.className = 'tab'
      setIsBuy(false)
    }
    else {
      e.target.className = 'tab tab--active'
      sellRef.current.className = 'tab'
      setIsBuy(true)
    }
  }

  const amountHandler = (e, token) => {
    if (token.address == tokens[0].address) {
      setTokenAmount(e.target.value)
    }
    else {
      setPriceAmount(e.target.value)
    }
  }

  const transferHandler = (e) => {
    e.preventDefault()
    
    if (isBuy) {
      makeOrder(dispatch, provider, exchange, 'buy', tokens, {tokenAmount, priceAmount})
    }
    else {
      makeOrder(dispatch, provider, exchange, 'sell', tokens, {tokenAmount, priceAmount})
    }
   
    setTokenAmount(0)      
    setPriceAmount(0)
  }

  return (
    <div className="component exchange__orders">
      <div className='component__header flex-between'>
        <h2>New Order</h2>
        <div className='tabs'>
          <button className='tab tab--active' ref={buyRef} onClick={tabHandler}>Buy</button>
          <button className='tab' ref={sellRef} onClick={tabHandler}>Sell</button>
        </div>
      </div>

      <form onSubmit={transferHandler}>
        {isBuy ? (
          <label htmlfor='amount'>Buy Amount</label>
        ):(
          <label htmlfor='amount'>Sell Amount</label>
        )}
      
        <input type="text" id='amount' placeholder='0.0000' value={tokenAmount == 0 ? '' : tokenAmount} onChange={(e) => amountHandler(e, tokens[0])}/>
        
        {isBuy ? (
          <label htmlfor='amount'>Buy Price</label>
        ):(
          <label htmlfor='amount'>Sell Price</label>
        )}

        <input type="text" id='price' placeholder='0.0000' value={priceAmount == 0 ? '' : priceAmount} onChange={(e) => amountHandler(e, tokens[1])}/>

        <button className='button button--filled' type='submit'>
          {isBuy ? (
            <span>Buy Order</span>
          ):(
            <span>Sell Order</span>
          )}
        </button>
      </form>
    </div>
  );
}

export default Order;