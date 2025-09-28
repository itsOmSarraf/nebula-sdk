// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AgentERC20Token
 * @dev Optimized ERC20 token for AI agents
 */
contract AgentERC20Token is ERC20, ERC20Burnable, ERC20Pausable, Ownable {
    uint8 private _decimals;
    string private _description;
    address public immutable creator;
    
    event TokenDescriptionUpdated(string newDescription);
    event TokenMinted(address indexed to, uint256 amount);
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint8 tokenDecimals,
        address tokenOwner,
        address tokenCreator
    ) ERC20(name, symbol) Ownable(tokenOwner) {
        require(tokenOwner != address(0) && tokenCreator != address(0), "Invalid address");
        require(initialSupply > 0 && tokenDecimals <= 18, "Invalid params");
        
        _decimals = tokenDecimals;
        creator = tokenCreator;
        
        _mint(tokenOwner, initialSupply * 10**tokenDecimals);
        emit TokenMinted(tokenOwner, initialSupply * 10**tokenDecimals);
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    function setTokenDescription(string calldata newDescription) external onlyOwner {
        _description = newDescription;
        emit TokenDescriptionUpdated(newDescription);
    }
    
    function getTokenDescription() external view returns (string memory) {
        return _description;
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0) && amount > 0, "Invalid params");
        _mint(to, amount);
        emit TokenMinted(to, amount);
    }
    
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    
    function _update(address from, address to, uint256 value) 
        internal virtual override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }
}

/**
 * @title AgentERC20Factory
 * @dev Optimized factory for creating ERC20 tokens
 */
contract AgentERC20Factory is ReentrancyGuard {
    event TokenCreated(
        address indexed token, 
        address indexed creator, 
        address indexed owner,
        string name, 
        string symbol
    );
    
    address[] public createdTokens;
    mapping(address => bool) public isCreatedToken;
    mapping(address => address[]) public tokensByCreator;
    
    function createToken(
        string calldata name,
        string calldata symbol,
        uint256 initialSupply,
        uint8 decimals,
        address owner
    ) external nonReentrant returns (address tokenAddress) {
        require(
            bytes(name).length > 0 && 
            bytes(symbol).length > 0 && 
            initialSupply > 0 && 
            decimals <= 18 && 
            owner != address(0), 
            "Invalid params"
        );
        
        AgentERC20Token newToken = new AgentERC20Token(
            name, symbol, initialSupply, decimals, owner, msg.sender
        );
        
        tokenAddress = address(newToken);
        createdTokens.push(tokenAddress);
        isCreatedToken[tokenAddress] = true;
        tokensByCreator[msg.sender].push(tokenAddress);
        
        emit TokenCreated(tokenAddress, msg.sender, owner, name, symbol);
    }
    
    function getTotalTokensCreated() external view returns (uint256) {
        return createdTokens.length;
    }
    
    function getAllCreatedTokens() external view returns (address[] memory) {
        return createdTokens;
    }
    
    function getTokensByCreator(address creator) external view returns (address[] memory) {
        return tokensByCreator[creator];
    }
    
    function isTokenCreatedByFactory(address tokenAddress) external view returns (bool) {
        return isCreatedToken[tokenAddress];
    }
}