// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAgentContract
 * @dev Interface for AI Agent contracts
 */
interface IAgentContract {
    // Events
    event FundsReceived(address indexed sender, uint256 amount, string message);
    event FundsWithdrawn(address indexed recipient, uint256 amount, string reason);
    event AgentSpending(address indexed recipient, uint256 amount, string purpose);
    event TokenDeployed(address indexed tokenAddress, string name, string symbol, uint256 initialSupply);
    event NFTDeployed(address indexed nftAddress, string name, string symbol, string baseURI);
    event SpendingLimitReset(uint256 timestamp);
    event AgentInfoUpdated(string name, string description);
    event EmergencyWithdrawal(address indexed admin, uint256 amount);

    // Core functions
    function deposit(string calldata message) external payable;
    function adminWithdraw(address payable recipient, uint256 amount, string calldata reason) external;
    function agentSpend(address payable recipient, uint256 amount, string calldata purpose) external;
    
    // Token deployment functions
    function deployERC20Token(
        string calldata name,
        string calldata symbol,
        uint256 initialSupply,
        uint8 decimals
    ) external returns (address tokenAddress);
    
    function deployERC721NFT(
        string calldata name,
        string calldata symbol,
        string calldata baseURI
    ) external returns (address nftAddress);
    
    // Admin functions
    function adminFund() external payable;
    function emergencyWithdraw() external;
    function updateAgentInfo(string calldata _name, string calldata _description) external;
    function grantAgentRole(address account) external;
    function revokeAgentRole(address account) external;
    function pause() external;
    function unpause() external;
    
    // View functions
    function getRemainingSpendingLimit() external view returns (uint256);
    function getBalance() external view returns (uint256);
    function getAgentInfo() external view returns (
        string memory name,
        string memory description,
        address admin,
        uint256 balance,
        uint256 remainingSpendingLimit
    );
    function getDeployedTokens() external view returns (address[] memory);
    function getDeployedNFTs() external view returns (address[] memory);
    function getTotalDeposits(address depositor) external view returns (uint256);
    function isAgent(address account) external view returns (bool);
}

/**
 * @title IAgentFactory
 * @dev Interface for Agent Factory contract
 */
interface IAgentFactory {
    struct AgentInfo {
        address agentContract;
        address owner;
        string name;
        string description;
        uint256 deployedAt;
        bool isActive;
    }

    // Events
    event AgentDeployed(
        address indexed agentContract,
        address indexed owner,
        string name,
        string description,
        uint256 deploymentFee
    );
    event AgentDeactivated(address indexed agentContract, address indexed owner);
    event AgentReactivated(address indexed agentContract, address indexed owner);
    event DeploymentFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeesWithdrawn(address indexed owner, uint256 amount);

    // Core functions
    function deployAgent(
        string calldata name,
        string calldata description
    ) external payable returns (address agentAddress);
    
    function deployAgentWithFunding(
        string calldata name,
        string calldata description,
        uint256 initialFunding
    ) external payable returns (address agentAddress);
    
    function deactivateAgent(address agentAddress) external;
    function reactivateAgent(address agentAddress) external;
    
    // Admin functions
    function setDeploymentFee(uint256 newFee) external;
    function withdrawFees() external;
    function pauseDeployments() external;
    function unpauseDeployments() external;
    
    // View functions
    function getAllAgents() external view returns (address[] memory);
    function getAgentsByOwner(address owner) external view returns (address[] memory);
    function getActiveAgentsByOwner(address owner) external view returns (address[] memory);
    function getAgentInfo(address agentAddress) external view returns (AgentInfo memory);
    function getAgentByName(string calldata name) external view returns (address);
    function isNameAvailable(string calldata name) external view returns (bool);
    function getFactoryStats() external view returns (
        uint256 totalDeployed,
        uint256 totalActive,
        uint256 currentDeploymentFee,
        uint256 collectedFees
    );
    function getDeploymentFee() external view returns (uint256);
    function isAgent(address agentAddress) external view returns (bool);
    function getAgentCountByOwner(address owner) external view returns (uint256);
    function getRecentAgents(uint256 count) external view returns (address[] memory);
}

/**
 * @title IAgentERC20Factory
 * @dev Interface for ERC20 token factory
 */
interface IAgentERC20Factory {
    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        address indexed owner,
        string name,
        string symbol,
        uint256 initialSupply,
        uint8 decimals
    );

    function createToken(
        string calldata name,
        string calldata symbol,
        uint256 initialSupply,
        uint8 decimals,
        address owner
    ) external returns (address tokenAddress);
    
    function getTotalTokensCreated() external view returns (uint256);
    function getAllCreatedTokens() external view returns (address[] memory);
    function getTokensByCreator(address creator) external view returns (address[] memory);
    function getTokensByOwner(address owner) external view returns (address[] memory);
    function isTokenCreatedByFactory(address tokenAddress) external view returns (bool);
}

/**
 * @title IAgentERC721Factory
 * @dev Interface for ERC721 NFT factory
 */
interface IAgentERC721Factory {
    event NFTCollectionCreated(
        address indexed nftAddress,
        address indexed creator,
        address indexed owner,
        string name,
        string symbol,
        string baseURI
    );

    function createNFT(
        string calldata name,
        string calldata symbol,
        string calldata baseURI,
        address owner
    ) external returns (address nftAddress);
    
    function getTotalNFTsCreated() external view returns (uint256);
    function getAllCreatedNFTs() external view returns (address[] memory);
    function getNFTsByCreator(address creator) external view returns (address[] memory);
    function getNFTsByOwner(address owner) external view returns (address[] memory);
    function isNFTCreatedByFactory(address nftAddress) external view returns (bool);
}
