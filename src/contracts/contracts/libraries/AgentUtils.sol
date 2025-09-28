// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgentUtils
 * @dev Library for common agent validation and utility functions
 */
library AgentUtils {
    // Custom errors
    error NameTooLong();
    error DescriptionTooLong();
    error NameEmpty();
    error InvalidAddress();
    
    /**
     * @dev Validate agent name and description
     */
    function validateAgentInput(string calldata name, string calldata description) internal pure {
        if (bytes(name).length == 0) revert NameEmpty();
        if (bytes(name).length > 50) revert NameTooLong();
        if (bytes(description).length > 500) revert DescriptionTooLong();
    }
    
    /**
     * @dev Validate address is not zero
     */
    function validateAddress(address addr) internal pure {
        if (addr == address(0)) revert InvalidAddress();
    }
    
    /**
     * @dev Calculate spending limit
     */
    function calculateSpendingLimit(uint256 balance, uint256 percentage) internal pure returns (uint256) {
        return (balance * percentage) / 100;
    }
    
    /**
     * @dev Check if spending period has elapsed
     */
    function isSpendingPeriodElapsed(uint256 lastReset, uint256 period) internal view returns (bool) {
        return block.timestamp >= lastReset + period;
    }
    
    /**
     * @dev Safe transfer ETH
     */
    function safeTransferETH(address to, uint256 amount) internal {
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "Transfer failed");
    }
}
