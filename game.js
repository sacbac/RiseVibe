const CONTRACT_ADDRESS = "0x4a70ddB59Bb91cdeB889B9c16bb20e406bFd440f";
const ABI = [
    "function checkMood(uint256 _choice) external",
    "event MoodChecked(address indexed user, uint256 choice, uint256 moodId, uint256 timestamp)"
];

// Rise Testnet Params
const RISE_PARAMS = {
    chainId: "0xaa39db", // 11155931 in hex
    chainName: "Rise Testnet",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://testnet.riselabs.xyz"],
    blockExplorerUrls: ["https://explorer.testnet.riselabs.xyz"]
};

const MOODS = [
    { name: "Radiant", emoji: "☀️" },
    { name: "Cyberpunk", emoji: "🤖" },
    { name: "Supercharged", emoji: "⚡" },
    { name: "Ethereal", emoji: "☁️" },
    { name: "Infinite", emoji: "♾️" },
    { name: "Grounded", emoji: "🌱" }
];

let signer, contract;

async function switchNetwork() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: RISE_PARAMS.chainId }],
        });
    } catch (err) {
        if (err.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [RISE_PARAMS],
            });
        }
    }
}

async function connect() {
    if (!window.ethereum) return alert("Please install MetaMask");
    try {
        await switchNetwork();
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

        document.getElementById('walletDisplay').innerText = `Rise: ${accounts[0].slice(0,6)}...`;
        document.getElementById('walletDisplay').classList.remove('hidden');
        document.getElementById('connectBtn').classList.add('hidden');
        document.getElementById('statusBox').innerText = "Vibe linked to Rise. Reveal your status!";
    } catch (err) {
        console.error("Connection failed", err);
    }
}

async function playGame(choice) {
    if (!contract) return connect();
    const statusBox = document.getElementById('statusBox');
    
    try {
        statusBox.innerText = "Requesting Rise Block Confirmation...";
        const tx = await contract.checkMood(choice);
        
        statusBox.innerText = "Indexing your vibe on-chain...";
        const receipt = await tx.wait();

        const event = receipt.events.find(e => e.event === 'MoodChecked');
        const moodId = event.args.moodId.toNumber();
        const mood = MOODS[moodId % MOODS.length];

        statusBox.innerHTML = `
            <div style="font-size: 2.5rem; margin-bottom: 10px;">${mood.emoji}</div>
            Your Rise vibe is <strong>${mood.name}</strong>!<br>
            <a href="${RISE_PARAMS.blockExplorerUrls[0]}/tx/${receipt.transactionHash}" target="_blank" style="color:var(--rise-blue); text-decoration:none; font-size:0.7rem;">[ View Transaction ]</a>
        `;
    } catch (err) {
        statusBox.innerText = "Vibe check interrupted.";
        console.error(err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('connectBtn').addEventListener('click', connect);
});
