export const provider = (state = {account: '', xp: {amount: [10, 100], level: 0}, friends: [], friendRequests: [], playerGuilds: [], guilds: {list: [], running:{running: false}}, playerbase: [], messages: {messages: [], running: {running: false}}}, action) => {
	let playerCount = 0
	let serverGuildName = ''
	let index
	let data

	switch (action.type) {
		case 'PROVIDER_LOADED':
			return {
				...state,
				connection: action.connection
			}
		case 'PROVIDER_HARDHAT_LOADED':
			return {
				...state,
				connectionHardhat: action.connection
			}
		case 'NETWORK_LOADED':
			return {
				...state,
				chainId: action.chainId
			}
		case 'ACCOUNT_LOADED':
			return {
				...state,
				account: action.account,
				friends: [],
				playerbase: [...state.playerbase, {name: 'dude', address: action.account}]
			}
		case 'ETHER_BALANCE_LOADED':
			return {
				...state,
				balance: action.balance
			}
		case 'FRIEND_REQUEST':
			index = state.friendRequests.findIndex(request => request.toString() != action.friendAddress.toString())

			if (index == -1) {
				data = [...state.friendRequests, action.sender]
			}
			else {
				data = state.friendRequests
			}

			return {
				...state,
				friendRequests: data
			}
		case 'FRIEND_ACCEPT':
			return {
				...state,
				friends: [...state.friends, action.sender],
				friendRequests: [...state.friendRequests.filter(friend => friend != action.sender)]
			}
		case 'GUILD_CREATE_START':
			return {
				...state,
				guilds: {
					...state.guilds,
					running: {
						complete: false,
						running: true,
						isError: false
					}
				},
			}
		case 'GUILD_CREATE_CANCEL':
			return {
				...state,
				guilds: {
					...state.guilds,
					running: {
						complete: false,
						running: false,
						isError: false
					}
				},
			}
		case 'GUILD_CREATE':
			if (action.guild.owner == state.account) {
				data = [...state.playerGuilds, action.guild]
			}
			else {
				data = state.playerGuilds
			}

			return {
				...state,
				guilds: {
					list: [action.guild, ...state.guilds.list],
					running: {
						complete: true,
						running: false,
						isError: false
					}
				},
				playerGuilds: data
			}
		case 'GUILD_REQUEST':
			let serverGuildName = state.guilds.list.filter(guild => guild.owner == action.sender)
			serverGuildName = serverGuildName[0].name

			index = state.friendRequests.findIndex(guild => guild == serverGuildName)
			

			if (index == -1) {
				data = [...state.friendRequests, serverGuildName]
			}
			else {
				data = state.friendRequests
			}

			if (action.friendAddress == state.account) {
				return {
					...state,
					friendRequests: data
				}
			}
		case 'GUILD_ACCEPT':
			let serverGuild = state.guilds.list.filter(guild => guild.owner == action.ownerAddress)[0]
			serverGuild.playerCount += 1
			serverGuild.players.push(state.account)

			return {
				...state,
				guilds: {
					list: [serverGuild, ...state.guilds.list.filter(guild => guild.name != serverGuild.name && serverGuild.playerCount == guild.playerCount)],
					running: {
						complete: false,
						running: false,
						isError: false
					}
				},
				playerGuilds: [...state.playerGuilds, serverGuild],
				friendRequests: [...state.friendRequests.filter(friend => friend != serverGuild.name)]
			}
		case 'MESSAGE':
			let serverMessageObjectList = state.messages.messages.filter(messageObject => messageObject.recipient == action.messageObject.recipient || messageObject.recipient == state.account)
			serverMessageObjectList = serverMessageObjectList.filter(messageObject => messageObject.messageSender == state.account || messageObject.messageReciever == state.account)

			let serverMessageObject = serverMessageObjectList[0]

			if (serverMessageObjectList.length == 0) {
				return {
					...state,
					messages: {
						...state.messages,
						messages: [action.messageObject, ...state.messages.messages]
					}
				}	
			}
			else {

				if (serverMessageObject.messages.message1.length > 0) {
		 			serverMessageObject.messages.message1.push(action.message)
		 		}

		 		else if (serverMessageObject.messages.message2.length > 0) {
		 			serverMessageObject.messages.message2.push(action.message)
		 		}

				serverMessageObject.messageSender = action.messageObject.messageSender
				serverMessageObject.messageReciever = action.messageObject.messageReciever

				return {
					...state,
					messages: {
						...state.messages,
						messages: [serverMessageObject, ...state.messages.messages.filter(messageObject => messageObject.recipient != serverMessageObject.recipient)]
				}	}
			}
		case 'MESSAGE_START':
			return {
				...state,
				messages: {
					...state.messages,
					running: {
						running: true,
						recipient: action.name
					}
				}
			}
		case 'MESSAGE_RESET':
			return {
				...state,
				messages: {
					...state.messages,
					running: {
						running: false,
						recipient: ''
					}
				}
			}	
			
		default:
			return state
	}
}

export const tokens = (state = { loaded: false, contracts: [], symbols: [], cryptoBalances: {btcBalance: 0, ethBalance: 0, usdtBalance: 0}, exchangeBalances: {btcBalance: 0, ethBalance: 0, usdtBalance: 0} , selectedToken:{}, image: '' }, action) => {
	switch (action.type) {
		case 'TOKEN_LOADED_1':
			return {
				...state,
				loaded: true,
				contracts: [action.token],
				symbols: [action.symbol]
			}
		case 'TOKEN_1_BALANCE_LOADED':
			return {
				...state,
				balances: [action.balance]
			}
		case 'TOKEN_LOADED_2':
			return {
				...state,
				loaded: true,
				contracts: [...state.contracts, action.token],
				symbols: [...state.symbols, action.symbol]
			}
		case 'TOKEN_2_BALANCE_LOADED':
			return {
				...state,
				balances: [...state.balances, action.balance]
			}

		case 'TOKEN_LOADED_3':
			return {
				...state,
				loaded: true,
				contracts: [...state.contracts, action.token],
				symbols: [...state.symbols, action.symbol]
			}

		case 'TOKEN_SELECTED':
			let token, balance
			let exchangeBalance

			if (action.selectedToken == 'BTC') {
				token = state.contracts[0]
				balance = state.cryptoBalances.btcBalance
				exchangeBalance = state.exchangeBalances.btcBalance
			}
			if (action.selectedToken == 'ETH') {
				token = state.contracts[2]
				balance = state.cryptoBalances.ethBalance
				exchangeBalance = state.exchangeBalances.ethBalance
			}
			if (action.selectedToken == 'USDT') {
				token = state.contracts[3]
				balance = state.cryptoBalances.usdtBalance
				exchangeBalance = state.exchangeBalances.usdtBalance
			}
			
			return {
				...state,
				selectedToken: {
					symbol: action.selectedToken,
					contract: token,
					balance: balance,
					exchangeBalance:exchangeBalance
				},
				image: action.localCryptoImage
			}
			case 'DEPOSIT_TOKENS': {
			let data

			if (state.selectedToken.symbol == 'BTC') {
				data = {
					...state.cryptoBalances,
					btcBalance: action.balance
				}
			}
			if (state.selectedToken.symbol == 'ETH') {
				data = {
					...state.cryptoBalances,
					ethBalance: action.balance
				}
			}
			if (state.selectedToken.symbol == 'USDT') {
				data = {
					...state.cryptoBalances,
					usdtBalance: action.balance
				}
			}

			return{
				...state,
				cryptoBalances: data
			}
		}

		case 'BALANCES_LOADED': {
			return{
				...state,
				cryptoBalances: {
				btcBalance: action.balances.btcBalance,
				ethBalance: action.balances.ethBalance,
				usdtBalance: action.balances.usdtBalance
				}
			}
		}

		case 'EXCHANGE_BALANCES_LOADED':
			return {
				...state,
				exchangeBalances: {
					btcBalance: action.exchangeBalances.btcBalance,
					ethBalance: action.exchangeBalances.ethBalance,
					usdtBalance: action.exchangeBalances.usdtBalance
				},

				image: action.ETHLogo,
				
				selectedToken: {
					symbol: 'ETH', 
					contract: state.contracts[1],
					balance: state.cryptoBalances.ethBalance,
					exchangeBalance: state.exchangeBalances.ethBalance
				}
			}
		default:
			return state
	}
}

export const exchange = (state = { loaded: false, contract: {}, transaction: {isSuccessful: false}, events: [], orders: [], transferInProgress: false, allOrders: {data: []}, allCancelledOrders: {data: []}, allTradeOrders: {data: []}, allDuels: {data: []}}, action) => {
	let data 
	let index

	switch (action.type) {
		case 'EXCHANGE_LOADED':
			return {
				...state,
				loaded: true,
				contract: action.exchange
			}
		case 'EXCHANGE_TOKEN_1_BALANCE_LOADED':
			return {
				...state,
				balances: [action.balance]
			}
		case 'EXCHANGE_TOKEN_2_BALANCE_LOADED':
			return {
				...state,
				balances: [...state.balances, action.balance]
			}

		case 'TRANSFER_REQUEST':
			return {
				...state,
				transaction: {
					transactionType: 'transfer',
					isPending: true,
					isSuccessful: false
				},
				transferInProgress: true
			}
		case 'TRANSFER_SUCCESS':
			return {
				...state,
				transaction: {
					transactionType: 'transfer',
					isPending: false,
					isSuccessful: true
				},
				transferInProgress: false,
				events: [action.event, ...state.events]
			}
		case 'TRANSFER_FAIL':
			return {
				...state,
				transaction: {
					transactionType: 'transfer',
					isPending: false,
					isSuccessful: false,
					isError: true
				},
				transferInProgress: false,
			}
		case 'ORDER_REQUEST':
			return {
				...state,
				transaction: {
					transactionType: 'new_order',
					isPending: true,
					isSuccessful: false,
					isError: false
				},
				transferInProgress: true,
			}
		case 'ORDER_SUCCESS':
			index = state.allOrders.data.findIndex(order => order.id.toString() == action.order.id.toString())

			if (index == -1) {
				data = [...state.allOrders.data, action.order]
			}
			else {
				data = state.allOrders.data
			}

			return {
				...state,
				allOrders: {
					...state.allOrders,
					data
				},
				transaction: {
					transactionType: 'new_order',
					isPending: false,
					isSuccessful: true
				},
				transferInProgress: false,
				events: [action.event, ...state.events],
			}
		case 'ORDER_FAIL':
			return {
				...state,
				transaction: {
					transactionType: 'new_order',
					isPending: false,
					isSuccessful: false,
					isError: true
				},
				transferInProgress: false,
			}
		case 'TRADEORDERS_LOADED':
			return {
				...state,
				allTradeOrders: {
					loaded: true,
					data: action.tradeOrders
				}
			}

		case 'CANCELLEDORDERS_LOADED':
			return {
				...state,
				allCancelledOrders: {
					loaded: true,
					data: action.cancelledOrders
				}
			}

		case 'ALL_ORDERS_LOADED':
			return {
				...state,
				allOrders: {
					loaded: true,
					data: action.allOrders
				}
			}

		case 'ORDER_CANCEL_REQUEST':
			return {
				...state,
				transaction: {
					transactionType: 'Cancel',
					isPending: true,
					isSuccessful: false
				}
			}
		case 'ORDER_CANCEL_SUCCESS':
			return {
				...state,
				transaction: {
					transactionType: 'Cancel',
					isPending: false,
					isSuccessful: true
				},
				allCancelledOrders: {
					...state.allCancelledOrders,
					data: [
						...state.allCancelledOrders.data,
						action.order
					]
				},
				events: [action.event, ...state.events]
			}
			case 'ORDER_CANCEL_FAIL':
			return {
				...state,
				transaction: {
					...state,
					transactionType: 'Cancel',
					isPending: false,
					isSuccessful: false,
					isError: true
				}
			}
			case 'FILL_ORDER_REQUEST':
			return {
				...state,
				transaction: {
					transactionType: 'Fill Order',
					isPending: true,
					isSuccessful: false
				}
			}
			case 'FILL_ORDER_FAIL':
			return {
				...state,
				transaction: {
					transactionType: 'Fill Order',
					isPending: false,
					isSuccessful: false,
					isError: true
				}
			}
			case 'FILL_ORDER_SUCCESS':
			index = state.allTradeOrders.data.findIndex(order => order.id.toString() == action.order.id.toString())

			if (index == -1) {
				data = [...state.allTradeOrders.data, action.order]
			}
			else {
				data = state.allTradeOrders.data
			}

			return {
				...state,
				transaction: {
					transactionType: 'Fill Order',
					isPending: false,
					isSuccessful: true
				},
				allTradeOrders: {
					...state.allTradeOrders,
					data
				},
				events: [action.event, ...state.events]
			}
			case 'ORDER_RESET':
			return {
				...state,
				transaction: {
					transactionType: 'new_order',
					isPending: false,
					isSuccessful: false,
					isError: false
				}
			}
			case 'DUEL_REQUEST':
			return {
				...state,
				transaction: {
					transactionType: 'new_duel',
					isPending: true,
					isSuccessful: false,
					isError: false
				},
				transferInProgress: true,
			}
			case 'DUEL_SUCCESS':
			index = state.allDuels.data.findIndex(duel => duel.id.toString() == action.duel.id.toString())

			if (index == -1) {
				data = [...state.allDuels.data, action.duel]
			}
			else {
				data = state.allDuels.data
			}

			return {
				...state,
				allDuels: {
					...state.allDuels,
					data
				},
				transaction: {
					transactionType: 'new_duel',
					isPending: false,
					isSuccessful: true
				},
				transferInProgress: false,
				events: [action.event, ...state.events],
			}
			case 'DUELS_LOADED':
			return {
				...state,
				allDuels: {
					data: action.allDuels
				}
			}
			case 'OPEN_DUELS_LOADED':
			return {
				...state,
				openDuels: {
					data: action.openDuels
				}
			}
		default:
			return state
	}
}

export const localAccount = (state = {account: {xp: {amount: [10, 100], level: 0}}, logProccess: {loading: false}, depositProccess: {loading: false}}, action) => {
	switch (action.type) {
		case 'LOG_IN_ATTEMPT': {
			return{
				...state,
				logProccess: {
					loading: true
				}
	
			}
		}

		case 'LOG_IN_CANCEL': {
			return{
				...state,
				logProccess: {
					loading: false
				},
				depositProccess: {
					loading: false
				}
			}
		}

		case 'LOG_IN_SUCCESS': {
			return{
				...state,
				logProccess: {
					loading: false
				},
				account: {
					username: action.user,
					password: action.pass,
					xp: {
						level: 1,
						amount: [1, 1000]
					}
				}
			}
		}

		case 'DEPOSIT_ATTEMPT': {
			return{
				...state,
				depositProccess: {
					loading: true
				}
			}
		}

		case 'LOCAL_DEPOSIT': {
			return{
				...state,
				depositProccess: {
					loading: 'complete'
				}
			}
		}

		default:
			return state
	}
}

