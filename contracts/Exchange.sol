pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
	address public feeAccount;
	address public escrow;
	uint256 public feePercent;
	uint256 public orderCount;
	uint256 public itemOrderCount;
	uint256 public duelCount;

	mapping(address => mapping(address => uint256)) public tokens;
	mapping(address => mapping(address => mapping(uint256 => uint256))) public items;
	mapping(uint256 => _Order) public orders;
	mapping(uint256 => _Duel) public duels;
	mapping(uint256 => bool) public orderFilled;
	mapping(uint256 => bool) public itemOrderFilled;
	mapping(uint256 => bool) public orderCanceled;

	event Deposit(address token, address user, uint256 amount, uint256 balance);
	event Withdraw(address tokens, address user, uint256 amount, uint256 balance);
	event NewOrder(
		uint256 id, 
		address user, 
		address tokenGet, 
		uint256 amountGet,
		address tokenGive,
		uint256 amountGive,
		uint256 timestamp
	);
	event CancelOrder(
		uint256 id, 
		address user, 
		address tokenGet, 
		uint256 amountGet,
		address tokenGive,
		uint256 amountGive,
		uint256 timestamp
	);
	event Trade(
		uint256 id,
		address creator,
		address user,
		address tokenGet, 
		uint256 amountGet,
		address tokenGive,
		uint256 amountGive,
		uint256 timestamp
	);
	event DuelStart(uint256 id, address p1, address p2, address p1Token, address p2Token, uint256 p1TokenAmount, uint256 p2TokenAmount, uint256 timestamp);
	event DuelEnd(uint256 id, address winner, address loser, address winnerToken, address loserToken, uint256 winnerTokenAmount, uint256 loserTokenAmount, uint256 timestamp);
	event MakeDuel(uint id, address sender, address p2, address senderToken, address p2Token, uint256 senderTokenAmount, uint256 p2TokenAmount, uint256 timestamp);
	
	struct _Order {
		uint256 id;
		address user;
		address tokenGet;
		uint256 amountGet;
		address tokenGive;
		uint256 amountGive;
		uint256 timestamp;
	}

	struct _ItemOrder {
		uint256 id;
		address user;
		address tokenGet;
		uint256 amountGet;
		address tokenGive;
		uint256 amountGive;
		uint256 timestamp;
	}

	struct _Duel {
		uint256 id;
		address p1;
		address p2;
		address p1Token;
		uint256 p1TokenAmount;
		address p2Token;
		uint256 p2TokenAmount;
		bool isRequest;
		uint256 timestamp;
	}

	constructor(address _feeAccount, uint256 _feePercent, address _escrow) {
		feeAccount = _feeAccount;
		feePercent = _feePercent;
		escrow = _escrow;
	}

	function depositToken(address _token, uint256 _amount) public {
		require(Token(_token).transferFrom(msg.sender, address(this), _amount), 'Error With transferFrom');
		require(_amount > 0, 'Amount Must Be Greater Than 0');

		tokens[_token][msg.sender] = tokens[_token][msg.sender] + _amount;

		emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
	}

	function localDeposit(address _token, address _user, uint256 _amount) public {
		require(_amount > 0, 'Amount Must Be Greater Than 0');
		require(_user != address(0));

		tokens[_token][_user] = tokens[_token][_user] + _amount;

		emit Deposit(_token, _user, _amount, tokens[_token][_user]);
	}

	function withdrawToken(address _token, uint256 _amount) public {
		require(tokens[_token][msg.sender] >= _amount, 'Insufficient Funds In Exchange');

		Token(_token).transfer(msg.sender, _amount);
		tokens[_token][msg.sender] = tokens[_token][msg.sender] - _amount;

		emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
	}

	
	// ORDERS
	// ------

	function makeOrder(
		address _tokenGet,
		address _tokenGive,  
		uint256 _amountGet,
		uint256 _amountGive
    ) public {
		require(balanceOf(_tokenGive, msg.sender) >= _amountGive);

		orderCount ++;
		orders[orderCount] = _Order(
			orderCount,
			msg.sender,
			_tokenGet,
			_amountGet,
			_tokenGive,
			_amountGive,
			block.timestamp
		);

		emit NewOrder(
			orderCount,
			msg.sender,
			_tokenGet,
			_amountGet,
			_tokenGive,
			_amountGive,
			block.timestamp
		);
    }

    function cancelOrder(uint256 _id) public {
    	_Order storage _order = orders[_id];

    	require(address(_order.user) == msg.sender, "Function not called by Owner of Order");
    	require(_order.id == _id, 'Invalid order ID');

    	orderCanceled[_id] = true;

    	emit CancelOrder(
			_order.id,
			msg.sender,
			_order.tokenGet,
			_order.amountGet,
			_order.tokenGive,
			_order.amountGive,
			block.timestamp
		);
    }

    function fillOrder(uint256 _id) public {
    	require(_id > 0 && _id <= orderCount, 'Invalid order ID');
    	require(!orderFilled[_id], 'Order is already filled');
    	require(!orderCanceled[_id], 'Order is already canceled');

    	_Order storage _order = orders[_id];

    	_trade(
    		_order.id,
    		_order.user,
    		_order.tokenGet,
    		_order.tokenGive,
    		_order.amountGet,
    		_order.amountGive
    	);

    	orderFilled[_id] = true;
    }

    function duelStart(address _p2, address _p1Token, address _p2Token, uint256 _p1TokenAmount, uint256 _p2TokenAmount) public {
    	require(tokens[_p1Token][msg.sender] >= _p1TokenAmount, 'Not Enough Tokens');
    	require(tokens[_p2Token][_p2] >= _p2TokenAmount, 'Not Enough Tokens');

    	require(Token(_p1Token).transfer(escrow, _p1TokenAmount));
    	require(Token(_p2Token).transfer(escrow, _p2TokenAmount));

    	if (duels[duelCount].isRequest == false) {
    		duelCount ++;

    		duels[duelCount] = _Duel(
			duelCount,
			msg.sender,
			_p2,
			_p1Token,
			_p1TokenAmount,
			_p2Token,
			_p2TokenAmount,
			false,
			block.timestamp
		);
    	}

    	emit DuelStart(duelCount, msg.sender, _p2, _p1Token, _p2Token, _p1TokenAmount, _p2TokenAmount, block.timestamp);
    }

    function duelEnd(address _winner, address _loser, address _winnerToken, address _loserToken, uint256 _winnerTokenAmount, uint256 _loserTokenAmount) public {
    	require(Token(_winnerToken).balanceOf(escrow) > 0, 'No tokens in escrow');
    	require(Token(_loserToken).balanceOf(escrow) > 0, 'No tokens in escrow');
    	require(Token(_winnerToken).transferFrom(escrow, address(this), _winnerTokenAmount), 'transferFrom Failed');
    	require(Token(_loserToken).transferFrom(escrow, address(this), _loserTokenAmount), 'transferFrom Failed');

    	tokens[_loserToken][_winner] = tokens[_loserToken][_winner]  + _loserTokenAmount;
    	tokens[_loserToken][_loser] = tokens[_loserToken][_loser] - _loserTokenAmount;

    	tokens[_winnerToken][_winner] = tokens[_winnerToken][_winner] + _winnerTokenAmount;

    	emit DuelEnd(duelCount, _winner, _loser, _winnerToken, _loserToken, _winnerTokenAmount, _loserTokenAmount, block.timestamp);
    }

    function makeDuel(address _p2, address _senderToken, address _p2Token, uint256 _senderTokenAmount, uint256 _p2TokenAmount) public {
    	require(tokens[_senderToken][msg.sender] >= _senderTokenAmount, 'Not Enough Tokens');

    	duelCount ++;

    	duels[duelCount] = _Duel(
			duelCount,
			msg.sender,
			_p2,
			_senderToken,
			_senderTokenAmount,
			_p2Token,
			_p2TokenAmount,
			true,
			block.timestamp
		);

		emit MakeDuel(duelCount, msg.sender, _p2, _senderToken, _p2Token, _senderTokenAmount, _p2TokenAmount, block.timestamp);
    }

    function makeItemOrder(
    	address _tokenGet,
    	uint256 _amountGet,
    	address _itemGive
    ) public {
		require(balanceOf(_tokenGive, msg.sender) >= _amountGive);

		itemOrderCount ++;
		itemOrders[itemOrderCount] = _ItemOrder(
			orderCount,
			msg.sender,
			_tokenGet,
			_amountGet,
			_itemGive,
			block.timestamp
		);

		emit NewOrder(
			orderCount,
			msg.sender,
			_tokenGet,
			_amountGet,
			_itemGive,
			block.timestamp
		);
    }

    function fillItemOrder(uint256 _id) public {
    	require(_id > 0 && _id <= orderCount, 'Invalid order ID');
    	require(!orderFilled[_id], 'Order is already filled');
    	require(!orderCanceled[_id], 'Order is already canceled');

    	_ItemOrder storage _itemOrder = itemOrders[_id];

    	_trade(
    		_itemOrder.id,
    		_itemOrder.user,
    		_itemOrder.tokenGet,
    		_itemOrder.amountGet,
    		_itemOrder.itemGive
    	);

    	itemOrderFilled[_id] = true;
    }


	// UTILITY
	// -------

	function _trade(
		uint256 _id,
		address _user,
		address _tokenGet,
		address _tokenGive,  
		uint256 _amountGet,
		uint256 _amountGive
	) public {
		uint256 _feeAmount = (_amountGet * feePercent) / 100;

		tokens[_tokenGet][_user] += _amountGet;		
		unchecked {
			tokens[_tokenGet][msg.sender] -= (_amountGet + _feeAmount);
		}
		tokens[_tokenGive][_user] -= _amountGive;
		tokens[_tokenGive][msg.sender] += _amountGive;
		tokens[_tokenGet][feeAccount] += _feeAmount;	
		emit Trade(
			_id,
			_user,
			msg.sender,
			_tokenGet,
			_amountGet,
			_tokenGive,
			_amountGive,
			block.timestamp
		);
	}

	function _tradeItem(
		uint256 _id,
		address _user,
		address _tokenGet,
		uint256 _amountGet,
		address _itemGive
	) public {
		uint256 _feeAmount = (_amountGet * feePercent) / 100;

		tokens[_tokenGet][_user] += _amountGet;		
		unchecked {
			tokens[_tokenGet][msg.sender] -= (_amountGet + _feeAmount);
		}
		items[_itemGive][_user] -= _itemGive;
		items[_itemGive][msg.sender] += _itemGive;
		tokens[_tokenGet][feeAccount] += _feeAmount;	
		emit Trade(
			_id,
			_user,
			msg.sender,
			_tokenGet,
			_amountGet,
			_itemGive,
			block.timestamp
		);
	}

	function balanceOf(address _token, address _user) public view returns(uint256) {
		return tokens[_token][_user];
	}


}