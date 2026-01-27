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
    getRipRecordPDA,
    PROGRAM_ID
} from "@/lib/program";

export const GET = async (req: Request) => {
    const url = new URL(req.url);
    const targetAddress = url.searchParams.get("target");
    // 从请求 URL 动态获取 origin
    const baseUrl = `${url.protocol}//${url.host}`;

    const payload: ActionGetResponse = {
        type: "action",
        icon: `${baseUrl}/blink-rip.svg`,
        title: "🕯️ Sol了没 - 发送 RIP",
        description: targetAddress
            ? `为 ${targetAddress.slice(0, 4)}...${targetAddress.slice(-4)} 点燃一根蜡烛，祈祷 TA 别断签。如果 TA 死了，你可能会分到遗产！`
            : "输入地址，为某人祈祷续命。",
        label: "发送 RIP",
        links: {
            actions: [
                {
                    type: "transaction",
                    label: "🕯️ 发送 RIP",
                    href: "/api/actions/rip?target={target}",
                    parameters: [
                        {
                            name: "target",
                            label: "目标用户钱包地址",
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

        let sender: PublicKey;
        let target: PublicKey;

        try {
            sender = new PublicKey(body.account);
        } catch {
            return Response.json(
                { error: "Invalid sender account" },
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

        // Cannot RIP yourself
        if (sender.equals(target)) {
            return Response.json(
                { error: "不能给自己发 RIP 哦，臭不要脸的！" },
                { status: 400, headers: ACTIONS_CORS_HEADERS }
            );
        }

        const program = getProgram();
        const [targetProfilePDA] = getUserProfilePDA(target);
        const [ripRecordPDA] = getRipRecordPDA(sender, target);

        // Check if target is registered
        const targetProfileInfo = await connection.getAccountInfo(targetProfilePDA);

        if (!targetProfileInfo) {
            return Response.json(
                { error: "目标用户未注册 Sol了没" },
                { status: 400, headers: ACTIONS_CORS_HEADERS }
            );
        }

        const [targetVaultPDA] = getVaultPDA(target);
        const [graveyardPDA] = getGraveyardPDA();

        // Build send_rip instruction (V3: 需要 rip_amount 参数)
        const ix = await program.methods
            .sendRip(1) // 默认发送 1 个 RIP
            .accounts({
                sender: sender,
                targetProfile: targetProfilePDA,
                targetOwner: target,
                targetVault: targetVaultPDA,
                graveyard: graveyardPDA,
                ripRecord: ripRecordPDA,
                systemProgram: SystemProgram.programId,
            })
            .instruction();

        // Create transaction
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        const tx = new Transaction({
            feePayer: sender,
            blockhash,
            lastValidBlockHeight,
        }).add(ix);

        const payload: ActionPostResponse = await createPostResponse({
            fields: {
                type: "transaction",
                transaction: tx,
                message: `🕯️ RIP 已发送给 ${target.toString().slice(0, 8)}...`,
            },
        });

        return Response.json(payload, {
            headers: ACTIONS_CORS_HEADERS,
        });

    } catch (error) {
        console.error("RIP action error:", error);
        return Response.json(
            { error: "Failed to create RIP transaction" },
            { status: 500, headers: ACTIONS_CORS_HEADERS }
        );
    }
};
