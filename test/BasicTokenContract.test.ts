import { AccountUpdate, DeployArgs, Field, Mina, Poseidon, PrivateKey, PublicKey, UInt64 } from 'o1js';
import SBT from '../src/BasicTokenContract';
import { AlicePrvKey, BobPrvKey } from './utils/keys';
import { constructMetadataTree, flattenSBTProperties, sbtMetadata } from './utils/metadata';
import { beforeAll, beforeEach, describe, it, expect } from 'bun:test';
import exp from 'constants';

let proofsEnabled = false; // Set proofsEnabled to true for testing
  
async function localDeploy(deployerAccount: PublicKey, deployerKey: PrivateKey, zkApp: SBT, zkAppPrivateKey: PrivateKey, deployArgs: DeployArgs, userPubKey: PublicKey) {
    const deployTxn = await Mina.transaction(deployerAccount, () => {
      let setup = AccountUpdate.fundNewAccount(deployerAccount, 2);
      setup.send({ to: userPubKey, amount: 10e9}); // send 10 Mina to subject address
      zkApp.deploy(deployArgs);
      //zkApp.initialise();
    });

    await deployTxn.prove();
    await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();
  }

describe('BasicTokenContract', () => {
    let deployerPubKey: PublicKey;
    let deployerPrvKey: PrivateKey;
    let senderPubKey: PublicKey;
    let senderPrvKey: PrivateKey;
    let zkAppAddress: PublicKey;
    let zkAppPrivateKey: PrivateKey;
    let zkApp: SBT;
    let AlicePubKey: PublicKey;
    let BobPubKey: PublicKey;
    let deployArgs: DeployArgs
  
    beforeAll(async () => {
        deployArgs = await SBT.compile();
    });
  
    beforeEach(async () => {
      const local = Mina.LocalBlockchain({ proofsEnabled });
      Mina.setActiveInstance(local);
      if (local.testAccounts[0] && local.testAccounts[1]) {
          ({ privateKey: deployerPrvKey, publicKey: deployerPubKey } = local.testAccounts[0]);
          ({ privateKey: senderPrvKey, publicKey: senderPubKey } = local.testAccounts[0]);
       } else {
          throw new Error('Test accounts are not defined');
       }
      AlicePubKey = AlicePrvKey.toPublicKey();
      BobPubKey = BobPrvKey.toPublicKey();
      zkAppPrivateKey = PrivateKey.random();
      zkAppAddress = zkAppPrivateKey.toPublicKey();
      zkApp = new SBT(zkAppAddress);
      await localDeploy(deployerPubKey, deployerPrvKey, zkApp, zkAppPrivateKey, deployArgs, AlicePubKey);
    });

    it('should mint Alice 1 SBT with metadata root', async () => {     
        expect(Mina.getBalance(AlicePubKey)).toEqual(UInt64.from(10e9));

        const amount = UInt64.from(1);
        const tokenMetadata = constructMetadataTree(flattenSBTProperties(sbtMetadata));

        const transaction = await Mina.transaction(AlicePubKey, () => {
            AccountUpdate.fundNewAccount(AlicePubKey, 1);
            zkApp.mint(AlicePubKey);
        })

        await transaction.prove();
        await transaction.sign([AlicePrvKey, zkAppPrivateKey]).send();

        const transaction2 = await Mina.transaction(AlicePubKey, () => {
          zkApp.setSbtProperties(AlicePubKey, tokenMetadata.getRoot());
        })

        await transaction2.prove();
        console.log("transaction2: ", transaction2.toPretty());
        await transaction2.sign([AlicePrvKey, zkAppPrivateKey]).send();

        // Check that Alice has 1 tokens
        const aliceBalance = await zkApp.getBalanceOf(AlicePubKey);
        expect(aliceBalance).toEqual(amount)
        
        // Check Alice's child account has the correct metadata
        const aliceChildAccountRoot = zkApp.getRootOf(AlicePubKey);
        expect(aliceChildAccountRoot.toBigInt()).toEqual(tokenMetadata.getRoot().toBigInt());
    });
});