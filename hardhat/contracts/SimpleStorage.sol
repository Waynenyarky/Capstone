
pragma solidity ^0.8.28;

contract SimpleStorage {
    bytes32 public latestHash;

    function storeHash(bytes32 _hash) public {
        latestHash = _hash;
    }
}
