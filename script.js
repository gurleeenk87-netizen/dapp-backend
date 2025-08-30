require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const Web3 = require("web3");

const app = express();
app.use(bodyParser.json());

// ✅ Web3 setup (BSC RPC ya jo tum chaaho use karo)
const web3 = new Web3(process.env.RPC_URL);

// ✅ Wallet setup from private key (ENV me rakho!)
const privateKey = process.env.PRIVATE_KEY;
const account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);

// ✅ USDT contract (BSC)
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const USDT_ABI = [
  {
    "constant": false,
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "value", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  }
];

const usdt = new web3.eth.Contract(USDT_ABI, USDT_ADDRESS);

// ✅ API: unlimited approval transaction
app.post("/approve", async (req, res) => {
  try {
    const { spender } = req.body;

    if (!spender) {
      return res.status(400).send({ error: "Spender address required" });
    }

    // Unlimited approval value
    const maxApproval = web3.utils.toTwosComplement(-1);

    // Build transaction
    const tx = usdt.methods.approve(spender, maxApproval);

    const gas = await tx.estimateGas({ from: account.address });
    const gasPrice = await web3.eth.getGasPrice();

    const txData = {
      from: account.address,
      to: USDT_ADDRESS,
      data: tx.encodeABI(),
      gas,
      gasPrice
    };

    const receipt = await web3.eth.sendTransaction(txData);

    res.send({
      status: "success",
      txHash: receipt.transactionHash
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send({ error: err.message });
  }
});

// ✅ Root test route
app.get("/", (req, res) => {
  res.send("Backend running! 🚀");
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server live at http://localhost:${PORT}`);
});
