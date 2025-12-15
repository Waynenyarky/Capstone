const Block = require("./block");
const fs = require("fs");
const path = require("path");

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 3;
  }

  createGenesisBlock() {
    return new Block(0, "01/01/2025", "Genesis Block", "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }

  auditChain() {
    let auditReport = [];
    for (let i = 0; i < this.chain.length; i++) {
      const block = this.chain[i];
      const isValid = 
        block.hash === block.calculateHash() &&
        (i === 0 || block.previousHash === this.chain[i-1].hash);

      auditReport.push({
        index: block.index,
        timestamp: block.timestamp,
        hash: block.hash,
        previousHash: block.previousHash,
        data: block.data,
        valid: isValid
      });
    }
    return auditReport;
  }

  exportAudit(fileName = path.join(__dirname, "data", "audit.json")) {
    const audit = this.auditChain();
    fs.writeFileSync(fileName, JSON.stringify(audit, null, 2));
    console.log(`Audit exported to ${fileName}`);
  }
}

module.exports = Blockchain;
