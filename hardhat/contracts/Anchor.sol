
pragma solidity ^0.8.28;

contract Anchor {
    string public latestHash;

    event HashAnchored(address indexed sender, string hash);

    function anchorHash(string memory _hash) public {
        latestHash = _hash;
        emit HashAnchored(msg.sender, _hash);
    }

    function getLatestHash() public view returns (string memory) {
        return latestHash;
    }
}
