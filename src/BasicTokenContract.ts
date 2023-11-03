import {
    SmartContract,
    state,
    State,
    method,
    DeployArgs,
    Permissions,
    UInt64,
    PublicKey,
    Account,
    AccountUpdate,
    Field,
    Experimental,
  } from 'o1js';
  
const tokenSymbol = 'MYTKN';

// check against: https://github.com/Jon-Becker/renoun/blob/main/src/contracts/renoun.sol
class SBT extends SmartContract {

    @state(Field) root = State<Field>();

    deploy(args: DeployArgs) {
      super.deploy(args);
      this.account.permissions.set({
        ...Permissions.default(),
        editState: Permissions.proofOrSignature(),
      });
    }

    @method public setRoot(rootHash: Field) {
      const currentRoot = this.root.getAndAssertEquals();
      this.root.assertEquals(currentRoot)
      this.root.set(rootHash);
    }

    @method public setSbtProperties(address: PublicKey, rootHash: Field) {
      const childAccount = new SBT(address, this.token.id)
      // this doesn't work...
      childAccount.setRoot(rootHash);
    }

    @method public mint(to: PublicKey) {
      // TODO: Add hooks for admin
      const amount = UInt64.from(1);
      this.token.mint({ address: to, amount });
    }

    public getAccountOf(address: PublicKey): ReturnType<typeof Account> {
      const account = Account(address, this.token.id);
      return account
    }
  
    public getBalanceOf(
      address: PublicKey,
    ): UInt64 {
      const account = this.getAccountOf(address);
      const balance = account.balance.get();
  
      account.balance.assertEquals(balance);
  
      return balance;
    }

    public getRootOf(address: PublicKey): Field {
      const childAccount = new SBT(address, this.token.id);
      const rootHash = childAccount.root.get();  
      return rootHash;
    }
  }

  export default SBT;