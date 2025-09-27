// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./AgentImplementation.sol";
import "./AgentERC20Factory.sol";
import "./AgentERC721Factory.sol";
import "./libraries/AgentUtils.sol";

/**
 * @title AgentFactory
 * @dev Optimized factory using minimal proxy pattern
 */
contract AgentFactory is Ownable, ReentrancyGuard, Pausable {
    using Clones for address;
    
    uint256 public totalAgentsDeployed;
    uint256 public deploymentFee;
    
    address public immutable agentImplementation;
    address public immutable erc20Factory;
    address public immutable erc721Factory;
    
    mapping(address => bool) public isValidAgent;
    mapping(address => address[]) public agentsByOwner;
    mapping(string => address) public agentByName;
    mapping(address => AgentInfo) public agentInfo;
    
    struct AgentInfo {
        address owner;
        string name;
        uint256 deployedAt;
        bool isActive;
    }
    
    event AgentDeployed(address indexed agent, address indexed owner, string name);
    event AgentStatusChanged(address indexed agent, bool isActive);
    event FeeUpdated(uint256 newFee);
    
    error NameTaken();
    error InvalidFee();
    error Unauthorized();
    
    constructor(uint256 _deploymentFee) Ownable(msg.sender) {
        deploymentFee = _deploymentFee;
        
        // Deploy implementation and factories once
        agentImplementation = address(new AgentImplementation());
        erc20Factory = address(new AgentERC20Factory());
        erc721Factory = address(new AgentERC721Factory());
    }
    
    function deployAgent(
        string calldata name,
        string calldata description
    ) public payable nonReentrant whenNotPaused returns (address agentAddress) {
        if (msg.value < deploymentFee) revert InvalidFee();
        AgentUtils.validateAgentInput(name, description);
        if (agentByName[name] != address(0)) revert NameTaken();
        
        // Create minimal proxy
        agentAddress = agentImplementation.clone();
        
        // Initialize the proxy
        AgentImplementation(payable(agentAddress)).initialize(
            name,
            description,
            msg.sender,
            erc20Factory,
            erc721Factory
        );
        
        _updateRegistry(agentAddress, msg.sender, name);
        emit AgentDeployed(agentAddress, msg.sender, name);
        
        if (msg.value > deploymentFee) {
            AgentUtils.safeTransferETH(msg.sender, msg.value - deploymentFee);
        }
    }
    
    function deployAgentWithFunding(
        string calldata name,
        string calldata description,
        uint256 initialFunding
    ) external payable nonReentrant whenNotPaused returns (address agentAddress) {
        if (msg.value < deploymentFee + initialFunding) revert InvalidFee();
        
        agentAddress = _deployInternal(name, description);
        
        if (initialFunding > 0) {
            AgentUtils.safeTransferETH(agentAddress, initialFunding);
        }
        
        uint256 totalUsed = deploymentFee + initialFunding;
        if (msg.value > totalUsed) {
            AgentUtils.safeTransferETH(msg.sender, msg.value - totalUsed);
        }
    }
    
    function _deployInternal(
        string calldata name,
        string calldata description
    ) internal returns (address agentAddress) {
        AgentUtils.validateAgentInput(name, description);
        if (agentByName[name] != address(0)) revert NameTaken();
        
        // Create minimal proxy
        agentAddress = agentImplementation.clone();
        
        // Initialize the proxy
        AgentImplementation(payable(agentAddress)).initialize(
            name,
            description,
            msg.sender,
            erc20Factory,
            erc721Factory
        );
        
        _updateRegistry(agentAddress, msg.sender, name);
        emit AgentDeployed(agentAddress, msg.sender, name);
    }
    
    function _updateRegistry(address agent, address owner, string calldata name) internal {
        totalAgentsDeployed++;
        isValidAgent[agent] = true;
        agentsByOwner[owner].push(agent);
        agentByName[name] = agent;
        
        agentInfo[agent] = AgentInfo({
            owner: owner,
            name: name,
            deployedAt: block.timestamp,
            isActive: true
        });
    }
    
    function setAgentStatus(address agent, bool status) external {
        if (agentInfo[agent].owner != msg.sender) revert Unauthorized();
        agentInfo[agent].isActive = status;
        emit AgentStatusChanged(agent, status);
    }
    
    function setDeploymentFee(uint256 newFee) external onlyOwner {
        deploymentFee = newFee;
        emit FeeUpdated(newFee);
    }
    
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees");
        AgentUtils.safeTransferETH(owner(), balance);
    }
    
    function pauseDeployments() external onlyOwner { _pause(); }
    function unpauseDeployments() external onlyOwner { _unpause(); }
    
    // View functions
    function getAgentsByOwner(address owner) external view returns (address[] memory) {
        return agentsByOwner[owner];
    }
    
    function getAgentByName(string calldata name) external view returns (address) {
        return agentByName[name];
    }
    
    function isNameAvailable(string calldata name) external view returns (bool) {
        return agentByName[name] == address(0);
    }
    
    function getDeploymentFee() external view returns (uint256) {
        return deploymentFee;
    }
    
    function isAgent(address agent) external view returns (bool) {
        return isValidAgent[agent];
    }
    
    function getImplementationAddresses() external view returns (
        address implementation,
        address tokenFactory,
        address nftFactory
    ) {
        return (agentImplementation, erc20Factory, erc721Factory);
    }
}