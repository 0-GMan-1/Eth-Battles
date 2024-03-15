import { useSelector, useDispatch } from 'react-redux'
import config from '../config.json'
import { loadTokens } from '../store/interactions'
import {useRef} from 'react'
import {useState} from 'react'
import {useEffect} from 'react'
import {addFriend, acceptFriend, createGuild, acceptGuild} from '../store/interactions'
import {myFriendsSelector, myRequestsSelector, myGuildsSelector} from '../store/selectors'

const Markets = () => {
  const chainId = useSelector(state => state.provider.chainId)
  const provider = useSelector(state => state.provider.connection)
  const account = useSelector(state => state.provider.account)
  const playerbase = useSelector(state => state.provider.playerbase)
  const guilds = useSelector(state => state.provider.guilds.list)
  const dispatch = useDispatch()

  const friendsRef = useRef(null)
  const requestsRef = useRef(null)
  const guildRef = useRef(null)

  const [showFriends, setShowFriends] = useState(true)
  const [showRequests, setShowRequests] = useState(false)
  const [showGuilds, setShowGuilds] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [isSearching, setIsSearching] = useState  (false)
  const [searchResults, setSearchResults] = useState('')

  const myFriends = useSelector(myFriendsSelector)
  const myRequests = useSelector(myRequestsSelector)
  const myGuilds = useSelector(myGuildsSelector)

  const tabHandler = (e) => {
    if (e.target.className == 'tab-requests') {
      e.target.className = 'tab tab--active--friends'
      friendsRef.current.className = 'tab-friends'
      guildRef.current.className = 'tab-guild'
      setShowRequests(true)
      setShowFriends(false)
      setShowGuilds(false)
    }
    else if (e.target.className == 'tab-guild') {
      e.target.className = 'tab tab--active--friends'
      friendsRef.current.className = 'tab-friends'
      requestsRef.current.className = 'tab-requests'
      setShowGuilds(true)
      setShowFriends(false)
      setShowRequests(false)
    }
    else if (e.target.className == 'tab-friends') {
      e.target.className = 'tab tab--active--friends'
      guildRef.current.className = 'tab-guild'
      requestsRef.current.className = 'tab-requests'
      setShowFriends(true)
      setShowGuilds(false)
      setShowRequests(false)
    }
  }

  const amountHandler = (e) => {
    if (e.target.value.length > 0) {
      setSearchValue(e.target.value)
      setIsSearching(true)
      const resultsArray = playerbase.filter((player) => player.name.includes(e.target.value) || player.address.includes(e.target.value))
      setSearchResults(resultsArray)
    }
    else {
      setIsSearching(false)
      setSearchValue('')
      console.log('Please Enter Valid Username')
    }
  }

  const guildHandler = () => {
    dispatch({type: 'GUILD_CREATE_START'})
  }

  const addaFriend = (dispatch, account, username) => {
    addFriend(dispatch, account, username, 'friend')
    createGuild(dispatch, username, 'Dude Guild', 3, guilds)
    addFriend(dispatch, account, username, 'guild')
  }

  const friendButtonHandler = (type, friendAddress, sender) => {
    if (type == 'friend') {
      acceptFriend(dispatch, friendAddress, sender)
    }
    else if (type == 'guild') {
      acceptGuild(dispatch, friendAddress, sender)
    }
  }

const messageStart = (name) => {
  dispatch({type:'MESSAGE_START', name})
}


  useEffect(()=> {
    addaFriend(dispatch, account, '0x70997970C51812dc3A010C7d01b50e0d17dc79C8')
  }, [showFriends, showGuilds, showRequests, searchValue])

  return(
    <div className='component exchange__markets'>
      <div className='component__header'>
      	<h2>Social</h2>

        <div className='tabs-friends'>
            <button onClick={tabHandler} ref={friendsRef} className='tab tab--active--friends'>Friends</button>
            <button onClick={tabHandler} ref={requestsRef} className='tab-requests'>Requests</button>
            <button onClick={tabHandler} ref={guildRef} className='tab-guild'>Guilds</button>
        </div>
      </div>

        <table>
            <thead>
              <td><input type="text" id='friend' placeholder='Address or Name' value={searchValue == '' ? '' : searchValue} onChange={(e) => amountHandler(e)} /></td>
              <tr>
                <th>Name</th>
                {showGuilds ?
                <th>Owner</th>
                : <th>Address</th>
                }
                <th>Level</th>
              </tr>
            </thead>
            <tbody>
              {showFriends && !isSearching && account ? myFriends.map((friend, index) => {
                return(
                  <tr key={index}>
                    <td style={{color: `${friend.friendTypeClass}`}}>{friend.name}</td>
                    <td style={{color: `${friend.friendTypeClass}`}}>{friend.address.slice(0, 5) + '...' + friend.address.slice(38, 42)}</td>
                    <td>{friend.xpLevel}</td>
                    <td><button className='button--transactions' onClick={() => messageStart(friend.name)}>Message</button></td>
                  </tr>
                )
              })

             : showRequests && !isSearching && account ? myRequests.map((request, index) => {
                return(
                  <tr key={index}>
                    <td style={{color: `${request.friendTypeClass}`}}>{request.name}</td>
                    <td style={{color: `${request.friendTypeClass}`}}>{request.address.slice(0, 5) + '...' + request.address.slice(38, 42)}</td>
                    <td>{request.xpLevel}</td>
                    <td><button className='button--transactions' onClick={() => friendButtonHandler(request.type, account, request.address)}>Accept {request.type.charAt(0).toUpperCase()}</button></td>
                  </tr>
                )
             }) 
             : showGuilds && !isSearching && account ? myGuilds.map((guild, index) => {
                return(
                  <tr key={index}>
                    <td style={{color: `${guild.guildTypeClass}`}}>{guild.name}</td>
                    <td style={{color: `${guild.guildTypeClass}`}}>{guild.owner.slice(0, 5) + '...' + guild.owner.slice(38, 42)}</td>
                    <td>{guild.xp}</td>
                    <td><button className='button--transactions'>Message</button></td>
                  </tr>
                )
             })
                : isSearching && account ?
                  searchResults.map((player, index) => {
                    return(
                        <tr key={index}>
                            <td>{player.name}</td>
                            <td>{player.address.slice(0, 5) + '...' + player.address.slice(38, 42)}</td>
                            <td>{player.xpLevel}</td>
                        </tr>
                    )
                  })
                 :
                  <td>Please Connect</td>
              }
            </tbody>
          </table>
          {showGuilds && account &&
            <button button className='button--transactions' onClick={guildHandler}>Create Guild</button>
          }
    </div>
  )
}

export default Markets;