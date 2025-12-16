// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract SimpleStorage {
    uint256 private _value;

    event ValueChanged(uint256 value);

    function set(uint256 value) external {
        _value = value;
        emit ValueChanged(value);
    }

    function get() external view returns (uint256) {
        return _value;
    }
}
