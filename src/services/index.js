import Box from "3box";
import IdentityWallet from "identity-wallet";
import Onboard from "bnc-onboard";
import * as Web3 from "web3";
import { upload } from "skynet-js";
import DSA from "dsa-sdk";

const seed =
  "0x5bcca0ba544b6bb3f6ad3cfdcd385b76a2c1587250f0036f00d1d476bbb679b3";

let box;
let space = null;
let web3;
let dsa;

const rpcUrl = "https://ropsten.infura.io/v3/8b8d0c60bfab43bc8725df20fc660d15";

const onboard = Onboard({
  dappId: "052b3fe9-87d5-4614-b2e9-6dd81115979a", // [String] The API key created by step one above
  networkId: 3, // [Integer] The Ethereum network ID your Dapp uses.
  subscriptions: {
    wallet: (wallet) => {
      web3 = new Web3(wallet.provider);
    },
  },
  darkMode: true,
  walletSelect: {
    wallets: [
      { walletName: "metamask" },
      {
        walletName: "portis",
        apiKey: "d7d72646-709a-45ab-aa43-8de5307ae0df",
      },
      {
        walletName: "trezor",
        appUrl: "https://reactdemo.blocknative.com",
        email: "aaron@blocknative.com",
        rpcUrl,
      },
      { walletName: "coinbase" },
      {
        walletName: "ledger",
        rpcUrl,
      },
      {
        walletName: "walletConnect",
        infuraKey: "d5e29c9b9a9d4116a7348113f57770a8",
        // rpc: {
        //   [networkId]: rpcUrl,
        // },
      },
      { walletName: "dapper" },
      { walletName: "status" },
      { walletName: "walletLink", rpcUrl },
      { walletName: "fortmatic", apiKey: "Your_api_keys_goes_here" },
      { walletName: "unilogin" },
      { walletName: "torus" },
      { walletName: "squarelink", apiKey: "Your_api_keys_goes_here" },
      { walletName: "authereum", disableNotifications: false },
      { walletName: "trust", rpcUrl },
      { walletName: "opera" },
      { walletName: "operaTouch" },
      { walletName: "imToken", rpcUrl },
    ],
  },
});

export const getAccount = async () => {
  await onboard.walletSelect();
  await onboard.walletCheck();
};

export const getDSAInstance = async () => {
  if (!web3) {
    await getAccount();
  }
  dsa = new DSA(web3);
  console.log("dsa is", dsa);
  return dsa;
};

export const getDSAAccounts = async () => {
  console.log("getting address");
  const address = await defaultAddress();
  const accounts = await dsa.getAccounts(address);
  console.log("DSA Accounts", accounts);
  if (accounts.length > 1) {
    dsa.build().then(async (hash) => {
      console.log("DSA Hash", hash);
      const accounts = await dsa.getAccounts(address)
      return accounts
    });
  }
  return accounts
}

export const defaultAddress = async () => {
  if (!web3) {
    await getAccount();
  }
  const currentState = onboard.getState();
  return currentState.address;
};

export const getBalance = (address) => {
  return web3.eth.getBalance(address);
};

export const getWeb3Instance = async () => {
  if (!web3) {
    await getAccount();
  }
  return web3;
};

const getConsent = async ({ type, origin, spaces }) => {
  return true;
};

export const get3BoxInstance = async () => {
  const idWallet = new IdentityWallet(getConsent, { seed });
  console.log(idWallet);
  
  const threeIdProvider = idWallet.get3idProvider();
  console.log(threeIdProvider);
  
  box = await Box.openBox(null, threeIdProvider);
  console.log(box);
  
  await box.syncDone;
};

export const getSpace = async () => {
  await get3BoxInstance();
  space = await box.openSpace("InstaPool");
  
};

export const getspells = async () => {
  if (!space) {
    await get3BoxInstance();
    await getSpace();
  }
  const spells = await space.public.get("spellsLists");
  return spells;
};

export const getspell = async (spellID) => {
  const allspells = await getspells();
  console.log("All spells", allspells);
  const spell = allspells.find((spell) => spell.id === spellID);
  console.log("spell", spell);
  return spell;
};

export const setspells = async (spellData) => {
  let spells = [];

  spells = await getspells();

  if (spells == undefined) {
    spells = [];
  }

  console.log("spells", spells);

  spells.push(spellData);
  await space.public.set("spellsLists", spells);

  const newspells = await getspells();
  console.log("now spells", newspells);
};

export const updatespells = async (newspells) => {
  space.public.set("spellsLists", newspells);

  const newUpdatedspells = await getspells();
  console.log("now Updated spells", newUpdatedspells);

  return newUpdatedspells;
};

export const upVotespell = async (spellID) => {
  console.log(spellID, "spellID");
  let currentspells = await getspells();

  const selectedspellIndex = currentspells.findIndex((filter) => {
    return filter.id === spellID;
  });

  const currentUserAddress = await defaultAddress();

  const voterInstanceIndex = currentspells[selectedspellIndex].voters.findIndex(
    (voter) => voter.voterAddress === currentUserAddress
  );

  if (voterInstanceIndex !== -1) {
    console.log("Already Voted");
    const currentVote =
      currentspells[selectedspellIndex].voters[voterInstanceIndex].vote;
    if (currentVote === true) {
      console.log("Deleteing Vote");
      currentspells[selectedspellIndex].upVotes--;
      currentspells[selectedspellIndex].voters.splice(voterInstanceIndex, 1);
    } else {
      console.log("Already Voted Down");
    }
    return;
  } else {
    currentspells[selectedspellIndex].voters.push({
      voterAddress: currentUserAddress,
      vote: true,
    });
    currentspells[selectedspellIndex].upVotes++;
  }

  const newUpdatedspells = await updatespells(currentspells);
  return newUpdatedspells;
};

export const downVotespell = async (spellID) => {
  console.log(spellID, "spellID");
  let currentspells = await getspells();

  const selectedspellIndex = currentspells.findIndex((filter) => {
    return filter.id === spellID;
  });

  const currentUserAddress = await defaultAddress();

  const voterInstanceIndex = currentspells[selectedspellIndex].voters.findIndex(
    (voter) => voter.voterAddress === currentUserAddress
  );

  if (voterInstanceIndex !== -1) {
    console.log("Already Voted");
    const currentVote =
      currentspells[selectedspellIndex].voters[voterInstanceIndex].vote;
    if (currentVote === false) {
      console.log("Deleting Vote");
      currentspells[selectedspellIndex].downVotes--;
      currentspells[selectedspellIndex].voters.splice(voterInstanceIndex, 1);
      console.log("This voters", currentspells[selectedspellIndex].voters);
    } else {
      console.log("Already Voted Up");
    }
    return;
  } else {
    currentspells[selectedspellIndex].voters.push({
      voterAddress: currentUserAddress,
      vote: false,
    });
    currentspells[selectedspellIndex].downVotes++;
  }

  const newUpdatedspells = await updatespells(currentspells);
  return newUpdatedspells;
};

export const getUserspells = async () => {};

const DefaultUploadOptions = {
  portalUrl: "https://siasky.net",
  portalUploadPath: "/skynet/flashspell",
  portalFileFieldname: "file",
  portalDirectoryFileFieldname: "files[]",
  customFilename: "",
};

function trimTrailingSlash(str) {
  return str.replace(/\/$/, "");
}

function trimSiaPrefix(str) {
  return str.replace("sia://", "");
}

export const uploadToSkynet = async (file) => {
  const onUploadProgress = (progress, { loaded, total }) => {
    console.info(`Progress ${Math.round(progress * 100)}%`);
  };

  const portalUrl = "https://siasky.net";
  const portalUploadPath = "/skynet/flashSpell";

  const url = `${trimTrailingSlash(portalUrl)}${trimTrailingSlash(
    portalUploadPath
  )}`;
  console.log(url)
  console.log('Loading')
  try {
    const { skylink } = await upload(url, file, {onUploadProgress});
    console.log("Skylink", skylink);
    return skylink;
  } catch (error) {
    console.log("error", error);
    return "error";
  }
};

// export const downloadFromSkynet = async (fileName, skylink) => {
//     const url = `${trimTrailingSlash(DefaultUploadOptions.portalUrl)}/${trimSiaPrefix(skylink)}`

//     const writer = fs.createWriteStream(fileName)

//     return new Promise((resolve, reject) => {
//         axios.get(url, { responseType: 'stream' })
//             .then(response => {
//                 response.data.pipe(writer)
//                 writer.on('finish', resolve)
//                 writer.on('error', reject)
//             })
//             .catch(error => {
//                 reject(error)
//             })
//     })
// }

export const getProfiles = async () => {
  if (!space) {
    await get3BoxInstance();
    await getSpace();
  }
  const profiles = await space.public.get("profileList");
  console.log("Got from profiles spcae", profiles);
  return profiles;
};

export const getProfile = async (address) => {
  let allProfiles = await getProfiles();
  if (allProfiles == undefined) {
    allProfiles = [];
  }
  console.log("All Profiles", allProfiles);
  const profile = allProfiles.find((profile) => profile.address === address);
  console.log("profile", profile);
  return profile;
};

export const setProfiles = async (profileData) => {
  let profiles = [];

  profiles = await getProfiles();

  if (profiles == undefined) {
    profiles = [];
  }

  console.log("profiles", profiles);

  profiles.push(profileData);
  console.log("Now new profiles", profiles);
  await space.public.set("profileList", profiles);

  const newProfiles = await getProfiles();
  console.log("now Profiles", newProfiles);
};

export const updateProfiles = async (newProfile) => {
  const allProfiles = await getProfiles();
  const profileIndex = allProfiles.findIndex(
    (profile) => profile.address === newProfile.address
  );
  allProfiles[profileIndex] = newProfile;
  space.public.set("profileList", allProfiles);

  const newUpdatedProfiles = await getProfiles();
  console.log("now Updated spells", newUpdatedProfiles);

  return newUpdatedProfiles;
};
