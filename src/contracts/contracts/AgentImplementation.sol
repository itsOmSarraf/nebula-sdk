// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./AgentERC20Factory.sol";
import "./AgentERC721Factory.sol";
import "./libraries/AgentUtils.sol";

/**
 * @title AgentImplementation
 * @dev Implementation contract for minimal proxy pattern
 */
contract AgentImplementation is 
    Initializable, 
    OwnableUpgradeable, 
    AccessControlUpgradeable, 
    ReentrancyGuardUpgradeable, 
    PausableUpgradeable 
{
    uint256 public constant SPENDING_LIMIT_PERCENTAGE = 33;
    uint256 public constant SPENDING_RESET_PERIOD = 24 hours;
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    
    string public agentName;
    string public agentDescription;
    uint256 public totalSpentInPeriod;
    uint256 public lastSpendingReset;
    
    AgentERC20Factory public erc20Factory;
    AgentERC721Factory public erc721Factory;
    
    mapping(address => uint256) public totalDeposits;
    mapping(address => bool) public deployedTokens;
    mapping(address => bool) public deployedNFTs;
    
    address[] public deployedTokensList;
    address[] public deployedNFTsList;
    
    event FundsReceived(address indexed sender, uint256 amount, string message);
    event FundsWithdrawn(address indexed recipient, uint256 amount, string reason);
    event AgentSpending(address indexed recipient, uint256 amount, string purpose);
    event TokenDeployed(address indexed token, string name, string symbol, uint256 supply);
    event NFTDeployed(address indexed nft, string name, string symbol, string baseURI);
    event SpendingLimitReset(uint256 timestamp);
    event AgentInfoUpdated(string name, string description);
    event EmergencyWithdrawal(address indexed admin, uint256 amount);
    
    error ExceedsSpendingLimit(uint256 requested, uint256 allowed);
    error InsufficientBalance(uint256 requested, uint256 available);
    error TokenDeploymentFailed();
    
    function initialize(
        string memory _agentName,
        string memory _agentDescription,
        address _admin,
        address _erc20Factory,
        address _erc721Factory
    ) public initializer {
        require(bytes(_agentName).length > 0, "Empty name");
        AgentUtils.validateAddress(_admin);
        
        __Ownable_init(_admin);
        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        
        agentName = _agentName;
        agentDescription = _agentDescription;
        lastSpendingReset = block.timestamp;
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(AGENT_ROLE, address(this));
        
        erc20Factory = AgentERC20Factory(_erc20Factory);
        erc721Factory = AgentERC721Factory(_erc721Factory);
        
        emit AgentInfoUpdated(_agentName, _agentDescription);
    }
    
    receive() external payable {
        _handleDeposit(msg.sender, msg.value, "Direct deposit");
    }
    
    fallback() external payable {
        _handleDeposit(msg.sender, msg.value, "Fallback deposit");
    }
    
    function deposit(string calldata message) external payable {
        require(msg.value > 0, "No value");
        _handleDeposit(msg.sender, msg.value, message);
    }
    
    function _handleDeposit(address sender, uint256 amount, string memory message) internal {
        totalDeposits[sender] += amount;
        emit FundsReceived(sender, amount, message);
    }
    
    function adminWithdraw(
        address payable recipient,
        uint256 amount,
        string calldata reason
    ) external onlyOwner nonReentrant {
        AgentUtils.validateAddress(recipient);
        require(amount > 0, "Invalid amount");
        
        uint256 balance = address(this).balance;
        if (amount > balance) revert InsufficientBalance(amount, balance);
        
        AgentUtils.safeTransferETH(recipient, amount);
        emit FundsWithdrawn(recipient, amount, reason);
    }
    
    function agentSpend(
        address payable recipient,
        uint256 amount,
        string calldata purpose
    ) external onlyRole(AGENT_ROLE) nonReentrant whenNotPaused {
        AgentUtils.validateAddress(recipient);
        require(amount > 0, "Invalid amount");
        
        _resetSpendingIfNeeded();
        
        uint256 balance = address(this).balance;
        uint256 maxLimit = AgentUtils.calculateSpendingLimit(balance, SPENDING_LIMIT_PERCENTAGE);
        uint256 remainingLimit = maxLimit > totalSpentInPeriod ? maxLimit - totalSpentInPeriod : 0;
        
        if (amount > remainingLimit) revert ExceedsSpendingLimit(amount, remainingLimit);
        if (amount > balance) revert InsufficientBalance(amount, balance);
        
        totalSpentInPeriod += amount;
        AgentUtils.safeTransferETH(recipient, amount);
        emit AgentSpending(recipient, amount, purpose);
    }
    
    function deployERC20Token(
        string calldata name,
        string calldata symbol,
        uint256 initialSupply,
        uint8 decimals
    ) external onlyRole(AGENT_ROLE) returns (address tokenAddress) {
        require(bytes(name).length > 0 && bytes(symbol).length > 0, "Empty name/symbol");
        require(initialSupply > 0, "Invalid supply");
        
        try erc20Factory.createToken(name, symbol, initialSupply, decimals, owner()) 
        returns (address token) {
            tokenAddress = token;
            deployedTokens[tokenAddress] = true;
            deployedTokensList.push(tokenAddress);
            emit TokenDeployed(tokenAddress, name, symbol, initialSupply);
        } catch {
            revert TokenDeploymentFailed();
        }
    }
    
    function deployERC721NFT(
        string calldata name,
        string calldata symbol,
        string calldata baseURI
    ) external onlyRole(AGENT_ROLE) returns (address nftAddress) {
        require(bytes(name).length > 0 && bytes(symbol).length > 0, "Empty name/symbol");
        
        try erc721Factory.createNFT(name, symbol, baseURI, owner()) 
        returns (address nft) {
            nftAddress = nft;
            deployedNFTs[nftAddress] = true;
            deployedNFTsList.push(nftAddress);
            emit NFTDeployed(nftAddress, name, symbol, baseURI);
        } catch {
            revert TokenDeploymentFailed();
        }
    }
    
    function adminFund() external payable onlyOwner {
        require(msg.value > 0, "No value");
        _handleDeposit(msg.sender, msg.value, "Admin funding");
    }
    
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds");
        AgentUtils.safeTransferETH(payable(owner()), balance);
        emit EmergencyWithdrawal(owner(), balance);
    }
    
    function updateAgentInfo(string calldata _name, string calldata _description) external onlyOwner {
        require(bytes(_name).length > 0, "Empty name");
        agentName = _name;
        agentDescription = _description;
        emit AgentInfoUpdated(_name, _description);
    }
    
    function grantAgentRole(address account) external onlyOwner {
        _grantRole(AGENT_ROLE, account);
    }
    
    function revokeAgentRole(address account) external onlyOwner {
        _revokeRole(AGENT_ROLE, account);
    }
    
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    
    function _resetSpendingIfNeeded() internal {
        if (AgentUtils.isSpendingPeriodElapsed(lastSpendingReset, SPENDING_RESET_PERIOD)) {
            totalSpentInPeriod = 0;
            lastSpendingReset = block.timestamp;
            emit SpendingLimitReset(block.timestamp);
        }
    }
    
    // View functions
    function getRemainingSpendingLimit() external view returns (uint256) {
        uint256 balance = address(this).balance;
        uint256 maxLimit = AgentUtils.calculateSpendingLimit(balance, SPENDING_LIMIT_PERCENTAGE);
        
        if (AgentUtils.isSpendingPeriodElapsed(lastSpendingReset, SPENDING_RESET_PERIOD)) {
            return maxLimit;
        }
        
        return maxLimit > totalSpentInPeriod ? maxLimit - totalSpentInPeriod : 0;
    }
    
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    function getAgentInfo() external view returns (
        string memory name,
        string memory description,
        address admin,
        uint256 balance,
        uint256 remainingSpendingLimit
    ) {
        name = agentName;
        description = agentDescription;
        admin = owner();
        balance = address(this).balance;
        
        uint256 maxLimit = AgentUtils.calculateSpendingLimit(balance, SPENDING_LIMIT_PERCENTAGE);
        if (AgentUtils.isSpendingPeriodElapsed(lastSpendingReset, SPENDING_RESET_PERIOD)) {
            remainingSpendingLimit = maxLimit;
        } else {
            remainingSpendingLimit = maxLimit > totalSpentInPeriod ? maxLimit - totalSpentInPeriod : 0;
        }
    }
    
    function getDeployedTokens() external view returns (address[] memory) {
        return deployedTokensList;
    }
    
    function getDeployedNFTs() external view returns (address[] memory) {
        return deployedNFTsList;
    }
    
    function getTotalDeposits(address depositor) external view returns (uint256) {
        return totalDeposits[depositor];
    }
    
    function isAgent(address account) external view returns (bool) {
        return hasRole(AGENT_ROLE, account);
    }
}
