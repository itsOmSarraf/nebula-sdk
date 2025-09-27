// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AgentERC721Token
 * @dev Optimized ERC721 NFT collection for AI agents
 */
contract AgentERC721Token is ERC721, ERC721Burnable, ERC721Pausable, ERC721URIStorage, Ownable {
    string private _baseTokenURI;
    string private _description;
    address public immutable creator;
    uint256 private _nextTokenId = 1;
    uint256 public maxSupply = type(uint256).max;
    
    address public royaltyReceiver;
    uint96 public royaltyFeeNumerator = 500; // 5%
    
    event CollectionDescriptionUpdated(string newDescription);
    event BaseURIUpdated(string newBaseURI);
    event NFTMinted(address indexed to, uint256 indexed tokenId, string uri);
    event MaxSupplyUpdated(uint256 newMaxSupply);
    event RoyaltyUpdated(address receiver, uint96 feeNumerator);
    
    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI,
        address nftOwner,
        address nftCreator
    ) ERC721(name, symbol) Ownable(nftOwner) {
        require(nftOwner != address(0) && nftCreator != address(0), "Invalid address");
        
        _baseTokenURI = baseURI;
        creator = nftCreator;
        royaltyReceiver = nftOwner;
    }
    
    function setCollectionDescription(string calldata newDescription) external onlyOwner {
        _description = newDescription;
        emit CollectionDescriptionUpdated(newDescription);
    }
    
    function getCollectionDescription() external view returns (string memory) {
        return _description;
    }
    
    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
        emit BaseURIUpdated(baseURI);
    }
    
    function setMaxSupply(uint256 _maxSupply) external onlyOwner {
        require(_maxSupply >= _nextTokenId - 1, "Max supply too low");
        maxSupply = _maxSupply;
        emit MaxSupplyUpdated(_maxSupply);
    }
    
    function setRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        require(receiver != address(0) && feeNumerator <= 1000, "Invalid royalty");
        royaltyReceiver = receiver;
        royaltyFeeNumerator = feeNumerator;
        emit RoyaltyUpdated(receiver, feeNumerator);
    }
    
    function mint(address to, string calldata uri) external onlyOwner returns (uint256) {
        require(to != address(0) && _nextTokenId <= maxSupply, "Invalid mint");
        
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        
        if (bytes(uri).length > 0) {
            _setTokenURI(tokenId, uri);
        }
        
        emit NFTMinted(to, tokenId, uri);
        return tokenId;
    }
    
    function batchMint(
        address[] calldata recipients,
        string[] calldata uris
    ) external onlyOwner returns (uint256[] memory tokenIds) {
        require(
            recipients.length > 0 && 
            recipients.length == uris.length && 
            _nextTokenId + recipients.length - 1 <= maxSupply,
            "Invalid batch mint"
        );
        
        tokenIds = new uint256[](recipients.length);
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            
            uint256 tokenId = _nextTokenId++;
            _mint(recipients[i], tokenId);
            
            if (bytes(uris[i]).length > 0) {
                _setTokenURI(tokenId, uris[i]);
            }
            
            tokenIds[i] = tokenId;
            emit NFTMinted(recipients[i], tokenId, uris[i]);
        }
    }
    
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    
    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }
    
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }
    
    function royaltyInfo(uint256 tokenId, uint256 salePrice) 
        external view returns (address receiver, uint256 royaltyAmount) {
        require(_ownerOf(tokenId) != address(0), "Token not exist");
        receiver = royaltyReceiver;
        royaltyAmount = (salePrice * royaltyFeeNumerator) / 10000;
    }
    
    function supportsInterface(bytes4 interfaceId) 
        public view virtual override(ERC721, ERC721URIStorage) returns (bool) {
        return interfaceId == 0x2a55205a || super.supportsInterface(interfaceId);
    }
    
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }
    
    function _update(address to, uint256 tokenId, address auth) 
        internal virtual override(ERC721, ERC721Pausable) returns (address) {
        return super._update(to, tokenId, auth);
    }
    
    function tokenURI(uint256 tokenId) 
        public view virtual override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}

/**
 * @title AgentERC721Factory
 * @dev Optimized factory for creating ERC721 NFT collections
 */
contract AgentERC721Factory is ReentrancyGuard {
    event NFTCollectionCreated(
        address indexed nft,
        address indexed creator,
        address indexed owner,
        string name,
        string symbol
    );
    
    address[] public createdNFTs;
    mapping(address => bool) public isCreatedNFT;
    mapping(address => address[]) public nftsByCreator;
    
    function createNFT(
        string calldata name,
        string calldata symbol,
        string calldata baseURI,
        address owner
    ) external nonReentrant returns (address nftAddress) {
        require(
            bytes(name).length > 0 && 
            bytes(symbol).length > 0 && 
            owner != address(0),
            "Invalid params"
        );
        
        AgentERC721Token newNFT = new AgentERC721Token(
            name, symbol, baseURI, owner, msg.sender
        );
        
        nftAddress = address(newNFT);
        createdNFTs.push(nftAddress);
        isCreatedNFT[nftAddress] = true;
        nftsByCreator[msg.sender].push(nftAddress);
        
        emit NFTCollectionCreated(nftAddress, msg.sender, owner, name, symbol);
    }
    
    function getTotalNFTsCreated() external view returns (uint256) {
        return createdNFTs.length;
    }
    
    function getAllCreatedNFTs() external view returns (address[] memory) {
        return createdNFTs;
    }
    
    function getNFTsByCreator(address creator) external view returns (address[] memory) {
        return nftsByCreator[creator];
    }
    
    function isNFTCreatedByFactory(address nftAddress) external view returns (bool) {
        return isCreatedNFT[nftAddress];
    }
}