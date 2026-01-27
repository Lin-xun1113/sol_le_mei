import {
    ActionGetResponse,
    ActionPostRequest,
    ActionPostResponse,
    createPostResponse,
    ACTIONS_CORS_HEADERS,
} from "@solana/actions";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import {
    connection,
    getProgram,
    getUserProfilePDA,
    getVaultPDA,
    getGraveyardPDA,
    getDeathRecordPDA,
    PROGRAM_ID
} from "@/lib/program";

// GET handler for displaying the Loot action
export const GET = async (req: Request) => {
    const url = new URL(req.url);
    const targetAddress = url.searchParams.get("target");
    // 从请求 URL 动态获取 origin
    const baseUrl = `${url.protocol}//${url.host}`;

    const payload: ActionGetResponse = {
        type: "action",
        icon: `${baseUrl}/blink-loot.svg`,
        title: "🦅 Sol了没 - 秃鹫捡漏",
        description: targetAddress
            ? `用户 ${targetAddress.slice(0, 4)}...${targetAddress.slice(-4)} 已死亡！点击捡走 TA 的遗产（50% 归你，50% 进奖池）。`
            : "输入已死亡用户的地址，瓜分遗产！",
        label: "捡漏 Loot",
        links: {
            actions: [
                {
                    type: "transaction",
                    label: "🦅 捡漏",
                    href: "/api/actions/loot?target={target}",
                    parameters: [
                        {
                            name: "target",
                            label: "已死亡用户的钱包地址",
                            required: true,
                            type: "text",
                        },
                    ],
                },
            ],
        },
    };

    return Response.json(payload, {
        headers: ACTIONS_CORS_HEADERS,
    });
};

export const OPTIONS = GET;

export const POST = async (req: Request) => {
    try {
        const url = new URL(req.url);
        const targetParam = url.searchParams.get("target");

        const body: ActionPostRequest = await req.json();

        let looter: PublicKey;
        let target: PublicKey;

        try {
            looter = new PublicKey(body.account);
        } catch {
            return Response.json(
                { error: "Invalid looter account" },
                { status: 400, headers: ACTIONS_CORS_HEADERS }
            );
        }

        try {
            if (!targetParam) {
                return Response.json(
                    { error: "Target address is required" },
                    { status: 400, headers: ACTIONS_CORS_HEADERS }
                );
            }
            target = new PublicKey(targetParam);
        } catch {
            return Response.json(
                { error: "Invalid target address" },
                { status: 400, headers: ACTIONS_CORS_HEADERS }
            );
        }

        const program = getProgram();
        const [userProfilePDA] = getUserProfilePDA(target);
        const [vaultPDA] = getVaultPDA(target);
        const [graveyardPDA] = getGraveyardPDA();
        const [deathRecordPDA] = getDeathRecordPDA(target);

        // Check if target profile exists and is dead
        const targetProfileInfo = await connection.getAccountInfo(userProfilePDA);

        if (!targetProfileInfo) {
            return Response.json(
                { error: "目标用户不存在" },
                { status: 400, headers: ACTIONS_CORS_HEADERS }
            );
        }

        // Check vault balance
        const vaultBalance = await connection.getBalance(vaultPDA);
        if (vaultBalance === 0) {
            return Response.json(
                { error: "遗产已被瓜分完毕，你来晚了！" },
                { status: 400, headers: ACTIONS_CORS_HEADERS }
            );
        }

        // Build loot instruction
        const ix = await program.methods
            .loot()
            .accounts({
                looter: looter,
                userProfile: userProfilePDA,
                vault: vaultPDA,
                graveyard: graveyardPDA,
                deathRecord: deathRecordPDA,
                systemProgram: SystemProgram.programId,
            })
            .instruction();

        // Create transaction
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        const tx = new Transaction({
            feePayer: looter,
            blockhash,
            lastValidBlockHeight,
        }).add(ix);

        const looterShare = Math.floor(vaultBalance / 2);
        const payload: ActionPostResponse = await createPostResponse({
            fields: {
                type: "transaction",
                transaction: tx,
                message: `🦅 恭喜！你捡到了 ${(looterShare / 1e9).toFixed(4)} SOL 遗产！`,
            },
        });

        return Response.json(payload, {
            headers: ACTIONS_CORS_HEADERS,
        });

    } catch (error) {
        console.error("Loot action error:", error);
        return Response.json(
            { error: "Failed to create loot transaction" },
            { status: 500, headers: ACTIONS_CORS_HEADERS }
        );
    }
};
