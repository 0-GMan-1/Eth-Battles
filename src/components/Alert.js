import {useRef} from 'react'
import {useEffect} from 'react'
import {useSelector} from 'react-redux'
import {myEventsSelector} from '../store/selectors'
import config from '../config.json'
import {useState} from 'react'
import {messageSend} from '../store/interactions'
import {useDispatch} from 'react-redux'

const Alert = () => {
  const isPending = useSelector(state => state.exchange.transaction.isPending)
  const alertRef = useRef(null)
  const account = useSelector(state => state.provider.account)
  const isError = useSelector(state => state.exchange.transaction.isError)
  const events = useSelector(myEventsSelector)
  const network = useSelector(state => state.provider.network)
  const depositComplete = useSelector(state => state.localAccount.depositProccess.loading)
  const guildComplete = useSelector(state => state.provider.guilds.running.complete)
  const guilds = useSelector(state => state.provider.guilds.list)
  const messages = useSelector(state => state.provider.messages.messages)
  const messagesStart = useSelector(state => state.provider.messages.running.running)
  const messageRecipient = useSelector(state => state.provider.messages.running.recipient)
  const messageObject = messages.filter(messageObject => messageObject.recipient == messageRecipient || messageObject.recipient == account)[0]

  const dispatch = useDispatch()

  const [messageValue, setMessageValue] = useState('')
  const [spacingAmount, setSpacingAmount] = useState(0)

  const removeHandler = async (e) => {
    if (e.target.className != 'messagebox' && e.target.className != 'messageButton' && e.target.className != 'messageform') {
      alertRef.current.className='alert alert--remove'
      dispatch({type: 'MESSAGE_RESET'})
      dispatch({type: 'ORDER_RESET'})
    }
  }

  const messageValueHandler = (e) => {
    setMessageValue(e.target.value)
  }

  const messageHandler = (e) => {
    e.preventDefault()
    messageSend(dispatch, account, account, messageRecipient, messageValue)
    setMessageValue('')
    setSpacingAmount(spacingAmount + 1.75)
  }

  useEffect(() => {
    if(isPending || isError || depositComplete == 'complete' || guildComplete == true){
      alertRef.current.className = 'alert'
    }
    else if (messagesStart == true) {
      alertRef.current.className = 'wrapper'
      messageSend(dispatch, account, messageRecipient, account, 'yo')
    }
  }, [isPending, isError, account, depositComplete, guildComplete, messagesStart])
  return (
    <div>
        {isPending ? (
          <div className="alert alert--remove" ref={alertRef} onClick={removeHandler}>
            <h1>Transaction Pending...</h1>
          </div>
        
        ): isError ? (
          <div className="alert alert--remove" ref={alertRef} onClick={removeHandler}>
            <h1>Transaction Will Fail</h1>
          </div>  
        ): !isPending && events[0] ? (
          <div className="alert alert--remove" ref={alertRef} onClick={removeHandler}>
            <h1>Transaction Successful</h1>
              <a
                href={config[network] ? `${config[network].explorerURL}/tx/${events[0].transactionHash}` : '#'}
                target='_blank'
                rel='noreferrer'
              >
              {events[0].transactionHash.slice(0, 6) + '...' + events[0].transactionHash.slice(60, 66)}
              </a>
          </div>
        ): depositComplete == 'complete' ? (
          <div className="alert alert--remove" ref={alertRef} onClick={removeHandler}>
            <h1>Transaction Complete</h1>
          </div>
        
        ): guildComplete == true ? (
          <div className="alert alert--remove" ref={alertRef} onClick={removeHandler}>
            <h1>Created {guilds[0].name}</h1>
          </div>   
        ): messagesStart == true ?
        <div className='alert alert--remove' ref={alertRef} onClick={(e) => removeHandler(e)}>
          <div className='alert--messages'>
            <div className= 'messageTables'>
              <table className='messagetable' style={{marginBottom: `${spacingAmount}em`}}>
                <thead>
                  <tr className='messageLabel'>
                    <th>{messageRecipient}</th>
                  </tr>
                </thead>
                <tbody className='messageBody'>
                {messageObject && messageObject.messages.message2.map((message, index) => {
                  return(
                    <td key={index}>{message}</td>
                  )
                })}
                </tbody>
              </table>
              <table className='messagetable2' style={{marginBottom: `${spacingAmount}em`}}>
                <thead>
                  <tr className='messageLabel2'>
                    <th>You</th>
                  </tr>
                </thead>
                <tbody className='messageBody2'>
                {messageObject && messageObject.messages.message1.map((message, index) => {
                  return(
                    <td key={index}>{message}</td>
                  )
                })}
                </tbody>
              </table>
              </div>
              <form className='messageform' onSubmit={(e) => messageHandler(e)}>
                <input type="text" id='message' placeholder='Message' autocomplete='off' className='messagebox' value={messageValue == '' ? '' : messageValue} onChange={(e) => messageValueHandler(e)}></input>
                <button type='submit' className='messageButton'>Send</button>
              </form>
          </div>
          </div>
        :(
          <div className="alert alert--remove"></div>
        )}     
    </div>
  )
}

export default Alert;