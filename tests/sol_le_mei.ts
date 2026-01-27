import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolLeMei } from "../target/types/sol_le_mei";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";

describe("sol_le_mei V3", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolLeMei as Program<SolLeMei>;
  const user = provider.wallet;

  // 生成受益人钱包
  const beneficiary = Keypair.generate();

  // 生成另一个用户用于 RIP 测试
  const otherUser = Keypair.generate();

  // PDA 推导
  const [userProfilePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("user_profile"), user.publicKey.toBuffer()],
    program.programId
  );

  const [vaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), user.publicKey.toBuffer()],
    program.programId
  );

  const [graveyardPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("graveyard")],
    program.programId
  );

  const [deathRecordPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("death"), user.publicKey.toBuffer()],
    program.programId
  );

  // ============ 测试 1: 初始化 Graveyard ============
  it("Initialize Graveyard", async () => {
    try {
      const tx = await program.methods
        .initializeGraveyard()
        .accounts({
          authority: user.publicKey,
          graveyard: graveyardPDA,
        })
        .rpc();

      console.log("✅ Graveyard initialized:", tx);

      const graveyard = await program.account.graveyard.fetch(graveyardPDA);
      expect(graveyard.authority.toString()).to.equal(user.publicKey.toString());
      expect(graveyard.rewardPool.toNumber()).to.equal(0);
    } catch (e: any) {
      if (e.message.includes("already in use")) {
        console.log("⏭️ Graveyard already initialized, skipping...");
      } else {
        throw e;
      }
    }
  });

  // ============ 测试 2: 用户注册 (V3 新增字段验证) ============
  it("Register user (Feast Mode, 60s timeout) - V3 fields", async () => {
    try {
      const tx = await program.methods
        .register(new anchor.BN(60), 1) // 60秒超时, Feast模式
        .accounts({
          user: user.publicKey,
          userProfile: userProfilePDA,
          vault: vaultPDA,
          beneficiary: beneficiary.publicKey,
        })
        .rpc();

      console.log("✅ User registered:", tx);

      const userProfile = await program.account.userProfile.fetch(userProfilePDA);
      expect(userProfile.owner.toString()).to.equal(user.publicKey.toString());
      expect(userProfile.timeoutSeconds.toNumber()).to.equal(60);
      expect(userProfile.mode).to.equal(1);
      expect(userProfile.isDead).to.equal(false);
      expect(userProfile.ripCount).to.equal(0);

      // V3 新增字段验证
      expect(userProfile.deathTime.toNumber()).to.equal(0);
      expect(userProfile.gameRound.toNumber()).to.equal(1);
      console.log("   ✅ V3 fields: deathTime=0, gameRound=1");
    } catch (e: any) {
      if (e.message.includes("already in use")) {
        console.log("⏭️ User already registered, skipping...");
        // 验证现有用户的 V3 字段
        const userProfile = await program.account.userProfile.fetch(userProfilePDA);
        console.log("   Current gameRound:", userProfile.gameRound.toNumber());
      } else {
        throw e;
      }
    }
  });

  // ============ 测试 3: 签到 ============
  it("Heartbeat (sign in)", async () => {
    const tx = await program.methods
      .heartbeat()
      .accounts({
        user: user.publicKey,
        userProfile: userProfilePDA,
      })
      .rpc();

    console.log("✅ Heartbeat sent:", tx);

    const userProfile = await program.account.userProfile.fetch(userProfilePDA);
    console.log("   Last pulse:", new Date(userProfile.lastPulse.toNumber() * 1000).toISOString());
  });

  // ============ 测试 4: 存款 ============
  it("Deposit 0.05 SOL to vault", async () => {
    const depositAmount = new anchor.BN(0.05 * LAMPORTS_PER_SOL);

    const vaultBalanceBefore = await provider.connection.getBalance(vaultPDA);

    const tx = await program.methods
      .deposit(depositAmount)
      .accounts({
        user: user.publicKey,
        userProfile: userProfilePDA,
        vault: vaultPDA,
      })
      .rpc();

    console.log("✅ Deposit complete:", tx);

    const vaultBalanceAfter = await provider.connection.getBalance(vaultPDA);
    console.log("   Vault balance:", vaultBalanceAfter / LAMPORTS_PER_SOL, "SOL");

    expect(vaultBalanceAfter).to.be.greaterThan(vaultBalanceBefore);
  });

  // ============ 测试 5: 模式锁定验证 ============
  it("Update profile - mode change should NOT be possible", async () => {
    // V3: update_profile 不再接受 mode 参数
    const tx = await program.methods
      .updateProfile(new anchor.BN(120)) // 只能改 timeout
      .accounts({
        user: user.publicKey,
        userProfile: userProfilePDA,
        newBeneficiary: null,
      })
      .rpc();

    console.log("✅ Updated timeout to 120s:", tx);

    const userProfile = await program.account.userProfile.fetch(userProfilePDA);
    expect(userProfile.timeoutSeconds.toNumber()).to.equal(120);
    expect(userProfile.mode).to.equal(1); // 模式依然是 Feast
    console.log("   ✅ Mode remains locked at:", userProfile.mode === 0 ? "Safeguard" : "Feast");
  });

  // ============ 测试 6: 读取用户状态 (V3 完整字段) ============
  it("Read user profile - V3 fields", async () => {
    const userProfile = await program.account.userProfile.fetch(userProfilePDA);
    const vaultBalance = await provider.connection.getBalance(vaultPDA);

    console.log("📊 User Profile (V3):");
    console.log("   Owner:", userProfile.owner.toString());
    console.log("   Mode:", userProfile.mode === 0 ? "Safeguard" : "Feast", "(LOCKED)");
    console.log("   Is Dead:", userProfile.isDead);
    console.log("   RIP Count:", userProfile.ripCount);
    console.log("   RIP Earnings:", userProfile.ripEarnings.toNumber() / LAMPORTS_PER_SOL, "SOL");
    console.log("   Timeout:", userProfile.timeoutSeconds.toNumber(), "seconds");
    console.log("   Last Pulse:", new Date(userProfile.lastPulse.toNumber() * 1000).toISOString());
    console.log("   Death Time:", userProfile.deathTime.toNumber());
    console.log("   Game Round:", userProfile.gameRound.toNumber());
    console.log("   Vault Balance:", vaultBalance / LAMPORTS_PER_SOL, "SOL");

    // 计算剩余时间
    const now = Math.floor(Date.now() / 1000);
    const deadline = userProfile.lastPulse.toNumber() + userProfile.timeoutSeconds.toNumber();
    const remaining = deadline - now;
    console.log("   Time Until Death:", remaining, "seconds");
  });

  // ============ 测试 7: Flatline 应该失败 (用户还活着) ============
  it("Flatline should fail (user still alive)", async () => {
    try {
      await program.methods
        .flatline()
        .accounts({
          caller: user.publicKey,
          userProfile: userProfilePDA,
          vault: vaultPDA,
          beneficiary: beneficiary.publicKey,
          deathRecord: deathRecordPDA,
        })
        .rpc();

      throw new Error("Should have failed!");
    } catch (e: any) {
      console.log("✅ Flatline correctly rejected (user still alive)");
      expect(e.message).to.include("StillAlive");
    }
  });

  // ============ 测试 8: 复活应该失败 (用户还活着) ============
  it("Resurrect should fail (user not dead)", async () => {
    try {
      await program.methods
        .resurrect()
        .accounts({
          user: user.publicKey,
          userProfile: userProfilePDA,
          vault: vaultPDA,
        })
        .rpc();

      throw new Error("Should have failed!");
    } catch (e: any) {
      console.log("✅ Resurrect correctly rejected (user still alive)");
      expect(e.message).to.include("StillAlive");
    }
  });

  // ============ 测试 9: 总结 ============
  it("V3 Feature Summary", async () => {
    console.log("\n" + "=".repeat(50));
    console.log("📋 V3 测试总结");
    console.log("=".repeat(50));
    console.log("✅ 新字段 deathTime, gameRound 正确初始化");
    console.log("✅ 模式永久锁定 - update_profile 无法修改 mode");
    console.log("✅ 复活限制 - 活着时无法复活");
    console.log("✅ Flatline 限制 - 未超时无法判定死亡");
    console.log("=".repeat(50));
    console.log("注意: 完整的死亡/复活/轮次流程需要等待超时");
    console.log("建议使用更短的 timeout 进行完整测试");
    console.log("=".repeat(50) + "\n");
  });
});
