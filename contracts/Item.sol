pragma solidity ^0.8.0;

contract Item is ERC1155, Ownable {
	uint256 public contstant SWORD = 0
	uint256 public contstant ARMOR = 1
	uint256 public contstant SHIELD = 2
	uint256 public contstant BOW = 3
	
	constructor(address initialOwner) ERC1155("") Ownable(initialOwner) {
		_mint(msg.sender, SWORD, 10**5, "");
        _mint(msg.sender, ARMOR, 10**5, "");
        _mint(msg.sender, SHIELD, 10**2, "");
        _mint(msg.sender, BOW, 10**2, "");
	}

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data)
        public
        onlyOwner
    {
        _mint(account, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        public
        onlyOwner
    {
        _mintBatch(to, ids, amounts, data);
    }
}