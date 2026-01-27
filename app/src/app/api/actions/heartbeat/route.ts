import {
    ActionGetResponse,
    ActionPostRequest,
    ActionPostResponse,
    createPostResponse,
    ACTIONS_CORS_HEADERS,
} from "@solana/actions";
import {
    PublicKey,
    Transaction,
    SystemProgram,
    TransactionInstruction
} from "@solana/web3.js";
import {
    connection,
    getProgram,
    getUserProfilePDA,
    PROGRAM_ID
} from "@/lib/program";

export const GET = async (req: Request) => {
    // 从请求 URL 动态获取 origin，确保在任何环境都正确
    const requestUrl = new URL(req.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

    const payload: ActionGetResponse = {
        type: "action",
        icon: `${baseUrl}/blink-heartbeat.svg`,
        title: "💓 Sol了没 - 签到续命",
        description: "点击证明你还活着！每日签到，续命成功。断签即死，遗产被瓜分。",
        label: "签到 Check In",
        links: {
            actions: [
                {
                    type: "transaction",
                    label: "💓 签到续命",
                    href: "/api/actions/heartbeat",
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
        const body: ActionPostRequest = await req.json();

        let account: PublicKey;
        try {
            account = new PublicKey(body.account);
        } catch {
            return Response.json(
                { error: "Invalid account" },
                { status: 400, headers: ACTIONS_CORS_HEADERS }
            );
        }

        const program = getProgram();
        const [userProfilePDA] = getUserProfilePDA(account);

        // Check if user is registered
        const userProfileInfo = await connection.getAccountInfo(userProfilePDA);

        if (!userProfileInfo) {
            return Response.json(
                { error: "用户未注册，请先在网站注册后再签到" },
                { status: 400, headers: ACTIONS_CORS_HEADERS }
            );
        }

        // Build heartbeat instruction
        const ix = await program.methods
            .heartbeat()
            .accounts({
                user: account,
                userProfile: userProfilePDA,
            })
            .instruction();

        // Create transaction
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        const tx = new Transaction({
            feePayer: account,
            blockhash,
            lastValidBlockHeight,
        }).add(ix);

        const payload: ActionPostResponse = await createPostResponse({
            fields: {
                type: "transaction",
                transaction: tx,
                message: "签到成功！你又活过了一天 🎉",
            },
        });

        return Response.json(payload, {
            headers: ACTIONS_CORS_HEADERS,
        });

    } catch (error) {
        console.error("Heartbeat action error:", error);
        return Response.json(
            { error: "Failed to create heartbeat transaction" },
            { status: 500, headers: ACTIONS_CORS_HEADERS }
        );
    }
};
