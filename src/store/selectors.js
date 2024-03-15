import { createSelector } from 'reselect'
import { get, groupBy, reject, maxBy, minBy } from 'lodash'
import { ethers } from 'ethers'
import moment from 'moment'
import TOKEN_ABI from '../abis/Token'

const tokens = state => get(state, 'tokens.contracts')
const provider = state => get(state, 'provider.connection')
const allOrders = state => get(state, 'exchange.allOrders.data', [])
const allDuels = state => get(state, 'exchange.allDuels.data', [])
const allOpenDuels = state => get(state, 'exchange.openDuels.data', [])
const cancelledOrders = state => get(state, 'exchange.allCancelledOrders.data', [])
const tradeOrders = state => get(state, 'exchange.allTradeOrders.data', [])
const account = state => get(state, 'provider.account')
const events = state => get(state, 'exchange.events', [])
const selectedToken = state => get(state, 'tokens.selectedToken.symbol')
const btcBalance = state => get(state, 'tokens.cryptoBalances.btcBalance')
const ethBalance = state => get(state, 'tokens.cryptoBalances.ethBalance')
const usdtBalance = state => get(state, 'tokens.cryptoBalances.usdtBalance')
const friendsList = state => get(state, 'provider.friends')
const requestList = state => get(state, 'provider.friendRequests')
const guildList = state => get(state, 'provider.guilds.list')
const playerGuildList = state => get(state, 'provider.playerGuilds')
const openOrders = state => {
	const all = allOrders(state)
	const trade = tradeOrders(state)
	const cancelled = cancelledOrders(state)

	const openOrders = reject(all, (order) => {
		const orderTrade = trade.some((o) => o.id.toString() == order.id.toString())
		const orderCancelled = cancelled.some((o) => o.id.toString() == order.id.toString())
		return(orderTrade || orderCancelled)
	})
	return openOrders
}

const allDuelsList = state => {
	const all = allDuels(state)
	return all
}

const allOpenList = state => {
	const open = allOpenDuels(state)
	return open
}

const friendsListAll = state => {
	const friends = friendsList(state)
	return friends
}

const localAccountBalances = state => {
	const btc = btcBalance(state)
	const eth = ethBalance(state)
	const usdt = usdtBalance(state)
	const selToken = selectedToken(state)

	if (selToken == 'BTC') {
		return btc
	}

	else if (selToken == 'ETH') {
		return eth
	}

	else if (selToken == 'USDT') {
		return usdt
	}
}

const accountBalances = state => {
	const btc = btcBalance(state)
	const eth = ethBalance(state)
	const usdt = usdtBalance(state)
	const selToken = selectedToken(state)

	if (selToken == 'btc') {
		return btc
	}

	else if (selToken == 'ETH') {
		return eth
	}

	else if (selToken == 'USDT') {
		return usdt
	}
}

const decorateOrder = (order, tokens) => {
	let token0Amount, token1Amount

	if (order.tokenGive == tokens[1].address) {
		token0Amount = order.amountGive
		token1Amount = order.amountGet
	}

	else {
		token0Amount = order.amountGet
		token1Amount = order.amountGive
	}

	let tokenPrice = (token1Amount / token0Amount)
	tokenPrice = Math.round(tokenPrice * 100000) / 100000

	return{
		...order,
		token0Amount: ethers.utils.formatUnits(token0Amount, 'ether'),
		token1Amount: ethers.utils.formatUnits(token1Amount, 'ether'),
		tokenPrice: tokenPrice,
		formattedTimestamp: moment.unix(order.timestamp).format('h:mm:ssa d D MMM D')
	}
}

export const orderBookSelector = createSelector(openOrders, tokens, (orders, tokens) => {
	if (!tokens[0] || !tokens[1]) {return}

	orders = orders.filter((o) => o.tokenGet == tokens[0].address || o.tokenGet == tokens[1].address)
	orders = orders.filter((o) => o.tokenGive == tokens[0].address || o.tokenGive == tokens[1].address)

	orders = decorateOrderbookOrders(orders, tokens)
	orders = groupBy(orders, 'orderType')
	const buyOrders = get(orders, 'buy', [])
	orders = {
		...orders,
		buyOrders: buyOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
	}
	const sellOrders = get(orders, 'sell', [])
	orders = {
		...orders,
		sellOrders: sellOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
	}

	return orders
})

const decorateOrderbookOrders = (orders, tokens) => {
	return(
		orders.map((order) => {
			order = decorateOrder(order, tokens)
			order = decorateOrderbookOrder(order, tokens)
			return order
		})
	)
}

const GREEN = '#25CE8F'
const RED = '#F45353'
const BLUE = '#0710a8'

const decorateOrderbookOrder = (order, tokens) => {
	const orderType = order.tokenGive == tokens[1].address ? 'buy' : 'sell'

	return {
		...order,
		orderType: orderType,
		orderTypeClass: (orderType == 'buy' ? GREEN : RED),
		orderFillAction: (orderType == 'buy' ? 'sell' : 'buy')
	}
}

export const priceChartSelector = createSelector(tradeOrders, tokens, (orders, tokens) => {
	if (!tokens[0] || !tokens[1]) {return}

	orders = orders.filter((o) => o.tokenGet == tokens[0].address || o.tokenGet == tokens[1].address)
	orders = orders.filter((o) => o.tokenGive == tokens[0].address || o.tokenGive == tokens[1].address)

	orders = orders.sort((a, b) => a.timestamp - b.timestamp)

	orders = orders.map((o) => decorateOrder(o, tokens))

	orders = groupBy(orders, (o) => moment.unix(o.timestamp).startOf('hour').format())

	const hours = Object.keys(orders)
	const graphData = hours.map((hour) => {
		const group = orders[hour]

		const open = group[0]
		const high = maxBy(group, 'tokenPrice')
		const low = minBy(group, 'tokenPrice')
		const close = group[group.length - 1]
		return({
			x: new Date(hour),
			y: [open.tokenPrice, high.tokenPrice, low.tokenPrice, close.tokenPrice	]
		})
	})

	const lastHour = hours[hours.length - 1]
	const lastOrderHour = orders[lastHour]

	const lastOrder = (lastOrderHour && lastOrderHour[lastOrderHour.length - 1])
	const lastOrderPrice = get(lastOrder, 'tokenPrice', 0)
	const secondLastOrder = (lastOrderHour && lastOrderHour[lastOrderHour.length - 2]) 
	const secondLastOrderPrice = get(secondLastOrder, 'tokenPrice', 0)
	return({
		lastPriceChange: lastOrderPrice >= secondLastOrderPrice ? '+' : '-',
		lastPrice: lastOrderPrice,
		series: [{
			data: graphData && graphData
			
		}]
			
	})
})

export const tradeOrdersSelector = createSelector(tradeOrders, tokens, (orders, tokens) => {
    if (!tokens[0] || !tokens[1]) {return}

    orders = orders.filter((o) => o.tokenGet == tokens[0].address || o.tokenGet == tokens[1].address)
	orders = orders.filter((o) => o.tokenGive == tokens[0].address || o.tokenGive == tokens[1].address)

	orders = orders.sort((a, b) => a.timestamp - b.timestamp)

	orders = decorateTradeOrders(orders, tokens)		

	orders = orders.sort((a, b) => b.timestamp - a.timestamp)

	return orders
})

const decorateTradeOrders = (orders, tokens) => {
	let previousOrder = orders[0]
	return(
		orders.map((order) => {
			order = decorateOrder(order, tokens)
			order = decorateTradeOrder(order, previousOrder)
			previousOrder = order
			return(order)
		})
	)
}	

const decorateTradeOrder = (order, previousOrder) => {
	return({
		...order,
		tokenPriceClass: tokenPriceClass(order.tokenPrice, order.id, previousOrder)
	})
}

const tokenPriceClass = (tokenPrice, orderId, previousOrder) => {
	if(previousOrder.id == orderId) {
		return GREEN
	}

	if (previousOrder.tokenPrice <= tokenPrice) {
		return GREEN
	}
	else {
	return RED
	}
}

export const myOpenOrdersSelector = createSelector(account, tokens, openOrders, (account, tokens, orders) => {
	if (!tokens[0] || !tokens[1]) {return}

    orders = orders.filter((o) => o.user == account)

	orders = orders.filter((o) => o.tokenGet == tokens[0].address || o.tokenGet == tokens[1].address)
	orders = orders.filter((o) => o.tokenGive == tokens[0].address || o.tokenGive == tokens[1].address)

	orders = decorateMyOpenOrders(orders, tokens)

	orders = orders.sort((a, b) => b.timestamp - a.timestamp)

	return orders
})

const decorateMyOpenOrders = (orders, tokens) => {
	return(
		orders.map((order) => {
			order = decorateOrder(order, tokens)
			order = decorateMyOpenOrder(order, tokens)
			return(order)
		})
	)
}

const decorateMyOpenOrder = (order, tokens) => {
	let orderType = order.tokenGive == tokens[1].address ? 'buy' : 'sell'
	return({
		...order,
		orderType: orderType,
		orderTypeClass: (orderType == 'buy' ? GREEN : RED)
	}) 
}

export const myTradeOrdersSelector = createSelector(account, tokens, tradeOrders, (account, tokens, orders) => {
	if (!tokens[0] || !tokens[1]) {return}

	orders = orders.filter((o) => o.user == account || o.creator == account)

	orders = orders.filter((o) => o.tokenGet == tokens[0].address || o.tokenGet == tokens[1].address)
	orders = orders.filter((o) => o.tokenGive == tokens[0].address || o.tokenGive == tokens[1].address)

	orders = orders.sort((a, b) => b.timestamp - a.timestamp)

	orders = decorateMyTradeOrders(orders, account, tokens)


	return orders
})

const decorateMyTradeOrders = (orders, account, tokens) => {
	return(
		orders.map((order) => {
			order = decorateOrder(order, tokens)
			order = decorateMyTradeOrder(order, account, tokens)
			return(order)
		})
	)
}

const decorateMyTradeOrder = (order, account, tokens) => {
	const myOrder = order.creator == account
	let orderType
	if (myOrder) {
		orderType = order.tokenGive == tokens[1].address ? 'buy' : 'sell'
	}
	else {
		orderType = order.tokenGive == tokens[1].address ? 'sell' : 'buy'
	}

	return({
		...order,
		orderType: orderType,
		orderClass: orderType == 'buy' ? GREEN : RED,
		orderSign: (orderType == 'buy' ? '+' : '-')
	}) 
}

export const myEventsSelector = createSelector(account, events, (account, events) => {
	events = events.filter((e) => e.args.user == account)
	return events
})

export const currentBalanceSelector = createSelector(localAccountBalances, (localAccountBalances) => {

	return localAccountBalances
})

export const myDuelsSelector = createSelector(account, tokens, allDuelsList, allOpenList, (account, tokens, duels, openDuels) => {
	if (!tokens[0] || !tokens[1]) {return}
	if (!duels || !openDuels)

    duels = duels.filter((d) => d.winner == account || d.loser == account)

	duels = decorateDuels(duels, tokens, account)

	duels = duels.sort((a, b) => b.timestamp - a.timestamp)

	return duels
})

export const myOpenDuelsSelector = createSelector(account, allOpenList, tokens, (account, openDuels, tokens) => {
	if (!tokens[0] || !tokens[1]) {return}
	openDuels = openDuels.filter((d) => d.sender == account || d.p2 == account)

	openDuels = decorateOpenDuels(openDuels)

	openDuels = openDuels.sort((a, b) => b.timestamp - a.timestamp)

	return openDuels
})

const decorateDuels = (duels, tokens, account) => {
	return(
		duels.map((duel) => {
		duel = decorateDuel(duel, tokens, account)
		return duel
		})
	)
}

const decorateOpenDuels = (duels) => {
	return(
		duels.map((duel) => {
			duel = decorateOpenDuel(duel)
			return duel
		})
	)
}

const decorateOpenDuel = (duel) => {
	return{
		...duel,
		formattedSenderTokenAmount: ethers.utils.formatUnits(duel.senderTokenAmount, 'ether'),
		formattedP2TokenAmount: ethers.utils.formatUnits(duel.p2TokenAmount, 'ether'),
		senderToken: duel.senderToken,
		p2Token: duel.p2Token,
		duelOpponent: duel.sender,
		duelTypeClass: BLUE,
		formattedTimestamp: moment.unix(duel.timestamp).format('h:mm:ssa d D MMM D')
	}
}

const decorateDuel = (duel, tokens, account) => {
	let gain, duelTypeClass, duelSign, duelOpponent
	if (duel.loser == account) {
		gain = ethers.utils.formatUnits(duel.loserTokenAmount, 'ether')
		duelTypeClass = RED
		duelSign = '-'
		duelOpponent = duel.winner
	}

	else {
		gain = ethers.utils.formatUnits(duel.winnerTokenAmount, 'ether')
		duelTypeClass = GREEN
		duelSign = '+'
		duelOpponent = duel.loser
	}

	return{
		...duel,
		formattedWinnerTokenAmount: ethers.utils.formatUnits(duel.winnerTokenAmount, 'ether'),
		formattedLoserTokenAmount: ethers.utils.formatUnits(duel.loserTokenAmount, 'ether'),
		gain: gain,
		duelTypeClass: duelTypeClass,
		duelSign: duelSign,
		duelOpponent: duelOpponent,
		formattedTimestamp: moment.unix(duel.timestamp).format('h:mm:ssa d D MMM D')
	}
}

export const myFriendsSelector = createSelector(account, friendsList, (account, friendsList) => {
	// Sort by last messaged friend eventually
	if (!friendsList) {return []}

	friendsList = decorateFriendsList(account, friendsList)

	friendsList = friendsList.sort((a, b) => b.timestamp - a.timestamp)

	return friendsList
})

export const myRequestsSelector = createSelector(account, requestList, guildList, (account, requestList, guildList) => {
	if (!requestList) {return []}
	requestList = decorateRequestsList(account, requestList, guildList)

	requestList = requestList.sort((a, b) => b.timestamp - a.timestamp)

	return requestList
})

export const myGuildsSelector = createSelector(account, playerGuildList, (account, guildList) => {
	// Sort by last messaged friend eventually
	if (!guildList) {return []}

	guildList = decorateGuildList(account, guildList)
	
	guildList = guildList.sort((a, b) => b.timestamp - a.timestamp)
	console.log(guildList)
	return guildList
})

const decorateFriendsList = (account, friendsList) => {
	return(
		friendsList.map((friend) => {
			friend = decorateFriendsListFriend(account, friend)
			return friend	
		})
		)
}

const decorateFriendsListFriend = (account, friend) => {

	return {
		name: 'Dude',
		address: friend,
		profilePicture: '',
		xpLevel: 1,
		friendTypeClass: BLUE	
	}
}

const decorateRequestsList = (account, requestList, guildList) => {
	return(
		requestList.map((request) => {
			request = decorateRequestsListRequest(account, request, guildList)
			return request
		})
		)
}

const decorateRequestsListRequest = (account, request, guildList) => {
	let type

	const serverGuild = guildList.filter(guild => guild.name == request)[0]

	if (serverGuild) {
		type = 'guild'

		return {
			name: serverGuild.name,
			address: serverGuild.owner,
			xpLevel: 1,
			friendTypeClass: BLUE,
			type	
		}
	}
	else if (request.length >= 19) {
		type = 'friend'

		return {
			name: 'Dude',
			address: request,
			profilePicture: '',
			xpLevel: 1,
			friendTypeClass: BLUE,
			type	
		}
	}
}

const decorateGuildList = (account, guildList) => {
	return(
		guildList.map((guild) => {
			guild = decorateGuildListGuild(account, guild)
			return guild
		})
	)	
}
	
const decorateGuildListGuild = (account, guild) => {
	let owner

	if (guild.owner == account) {
		owner = '(You)'	
	}

	else {
		owner = guild.owner
	}

	return {
		name: guild.name,
		owner: owner,
		playerCount: guild.playerCount,
		players: guild.players,
		guildTypeClass: GREEN,
		xp: guild.playerCount * 10
	}
}

