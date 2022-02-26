const anchor = require('@project-serum/anchor');
const { BN } = require('bn.js');
const { SystemProgram } = anchor.web3;
const solanaWeb3 = require('@solana/web3.js');

describe('payment_channel', async () => {

  // Configure the client to use the local cluster.
  const provider = anchor.Provider.local();
  anchor.setProvider(provider);
  
  const multiSigWallet= anchor.web3.Keypair.generate();
  const treasuryWallet = anchor.web3.Keypair.generate();
  const program = anchor.workspace.PaymentChannel;
  const alice = anchor.web3.Keypair.generate();
  const bob = anchor.web3.Keypair.generate();
  const alicePaymentUser = anchor.web3.Keypair.generate();
  const bobPaymentUser = anchor.web3.Keypair.generate();

  it('Creates alice user', async () => {
    const signature = await program.provider.connection.requestAirdrop(alice.publicKey, 2000000000);
    await program.provider.connection.confirmTransaction(signature);
    await program.rpc.createPaymentUser("Alice",{
      accounts: {
        paymentUser: alicePaymentUser.publicKey,
        user: alice.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [alice,alicePaymentUser]
    });
  });

  it('Creates bob user', async () => {
    const signature = await program.provider.connection.requestAirdrop(bob.publicKey, 2000000000);
    await program.provider.connection.confirmTransaction(signature);
    await program.rpc.createPaymentUser("Bob",{
      accounts: {
        paymentUser: bobPaymentUser.publicKey,
        user: bob.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [bob,bobPaymentUser]
    });
  });

  it('Creates multi-sig wallet', async () => {
    const signature = await program.provider.connection.requestAirdrop(treasuryWallet.publicKey, 1000000000);
    await program.provider.connection.confirmTransaction(signature);

    let user_1_contribution = new BN(1000000)
    let user_2_contribution = new BN(2000000)
    
    await program.rpc.createMultisigWallet(user_1_contribution,user_2_contribution,{
      accounts: {
        multisigWallet: multiSigWallet.publicKey,
        owner: treasuryWallet.publicKey,
        user1: alice.publicKey,
        user2: bob.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [alice,bob,treasuryWallet,multiSigWallet]
    });

  });

  it('Updates wallet contributions', async () => {
    let user_1_contribution = new BN(1500000)
    let user_2_contribution = new BN(1500000)
    await program.rpc.updateBalance(user_1_contribution,user_2_contribution,{
      accounts: {
        multisigWallet: multiSigWallet.publicKey,
        user1: alice.publicKey,
        user2: bob.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [alice,bob]
    });
    const multiSigWalletObj = await program.account.multiSigWallet.fetch(multiSigWallet.publicKey);
    console.log(multiSigWalletObj)
  });

  it('withdraws wallet money', async () => {
    await program.rpc.closeChannel({
      accounts: {
        multisigWallet: multiSigWallet.publicKey,
        owner: treasuryWallet.publicKey,
        signer: alice.publicKey,
        user1: alice.publicKey,
        user2: bob.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [treasuryWallet,alice]
    });
    const multiSigWalletObj = await program.account.multiSigWallet.fetch(multiSigWallet.publicKey);
    console.log(multiSigWalletObj)
  });
        
});
