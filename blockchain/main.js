const Blockchain = require("./blockchain");
const Block = require("./block");

let myBlockchain = new Blockchain();

// Add blocks
myBlockchain.addBlock(new Block(1, "02/01/2025", { amount: 100 }));
myBlockchain.addBlock(new Block(2, "03/01/2025", { amount: 50 }));

console.log("Blockchain valid?", myBlockchain.isChainValid());

// Tampering test
myBlockchain.chain[1].data = { amount: 999 };

console.log("After tampering...");
console.log("Blockchain valid?", myBlockchain.isChainValid());

myBlockchain.exportAudit();
