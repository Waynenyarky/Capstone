
pragma solidity ^0.8.20;

contract SimpleStorage {
    string public latestHash;

    function storeHash(string memory _hash) public {
        latestHash = _hash;
    }
}
