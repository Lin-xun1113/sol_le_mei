"use client";

import Link from "next/link";

export default function IntroPage() {
    return (
        <div className="min-h-screen pb-20">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-[var(--bg-secondary)] py-20 sm:py-32">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 text-center">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
                        Alive to <span className="text-[var(--color-alive)] pulse-glow">Earn</span>,
                        <br />
                        Dead to <span className="text-[var(--color-dead)]">Feed</span>.
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-[var(--text-secondary)] max-w-2xl mx-auto">
                        Sol了没 (NotDeadYet) 是首个基于 Solana 的 <span className="text-[var(--color-warning)]">死亡开关</span> x <span className="text-[var(--color-loot)]">链上捡漏</span> 协议。
                        <br />
                        每天签到证明你还活着，否则你的资产将成为全网秃鹫的盛宴。
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link
                            href="/register"
                            className="bg-[var(--color-alive)] text-black px-8 py-3 rounded-full font-bold text-lg hover:shadow-[0_0_30px_var(--color-alive)] transition-all duration-300"
                        >
                            开始游戏
                        </Link>
                        <a href="https://github.com/linxun/dieOrNot" target="_blank" className="text-sm font-semibold leading-6 text-white hover:text-[var(--color-alive)]">
                            查看源码 <span aria-hidden="true">→</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Roles Section */}
            <div className="mx-auto max-w-7xl px-6 lg:px-8 py-20">
                <h2 className="text-3xl font-bold text-center mb-12">
                    <span className="bg-gradient-to-r from-[var(--color-alive)] to-[var(--color-rip)] bg-clip-text text-transparent">
                        三大阵营
                    </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Survivor */}
                    <div className="card hover:border-[var(--color-alive)] transition-all duration-300">
                        <div className="text-4xl mb-4">👤</div>
                        <h3 className="text-xl font-bold text-[var(--color-alive)] mb-2">幸存者</h3>
                        <p className="text-[var(--text-secondary)] mb-4">
                            目标只有一个：活下去。
                        </p>
                        <ul className="text-sm space-y-2 text-[var(--text-muted)]">
                            <li>✅ 每日 <b>Heartbeat</b> 签到</li>
                            <li>✅ 存入 SOL 积累财富</li>
                            <li>❌ 超时未签到即视为死亡</li>
                        </ul>
                    </div>

                    {/* Vulture */}
                    <div className="card hover:border-[var(--color-loot)] transition-all duration-300">
                        <div className="text-4xl mb-4">🦅</div>
                        <h3 className="text-xl font-bold text-[var(--color-loot)] mb-2">秃鹫</h3>
                        <p className="text-[var(--text-secondary)] mb-4">
                            嗅觉灵敏的链上猎手。
                        </p>
                        <ul className="text-sm space-y-2 text-[var(--text-muted)]">
                            <li>👁️ 监控全网超时用户</li>
                            <li>⚖️ 发起 <b>Flatline</b> 死亡判决</li>
                            <li>💰 <b>Loot</b> 抢夺 50% 遗产</li>
                        </ul>
                    </div>

                    {/* Mourner */}
                    <div className="card hover:border-[var(--color-rip)] transition-all duration-300">
                        <div className="text-4xl mb-4">🕯️</div>
                        <h3 className="text-xl font-bold text-[var(--color-rip)] mb-2">吊唁者</h3>
                        <p className="text-[var(--text-secondary)] mb-4">
                            传递最后的敬意。
                        </p>
                        <ul className="text-sm space-y-2 text-[var(--text-muted)]">
                            <li>🙏 发送 <b>RIP</b> 悼念死者</li>
                            <li>📝 记录永久上链</li>
                            <li>🎁 瓜分未来 RIP 奖励池</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Game Modes */}
            <div className="bg-[var(--bg-card)] py-20 border-y border-[var(--border-default)]">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center mb-12">双重模式</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Safeguard */}
                        <div className="relative p-8 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-primary)]">
                            <div className="absolute top-0 right-0 bg-[var(--color-alive)] text-black text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                                安全模式
                            </div>
                            <h3 className="text-2xl font-bold mb-4">🛡️ Safeguard Mode</h3>
                            <p className="text-[var(--text-secondary)] mb-6">
                                适合独居人群和资产保全。这是最纯粹的"死亡开关"。
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex-1 bg-[var(--bg-secondary)] p-4 rounded-lg text-center">
                                    <div className="text-gray-500 mb-1">生前</div>
                                    <div>自行管理</div>
                                </div>
                                <div className="text-2xl">➡️</div>
                                <div className="flex-1 bg-[var(--color-alive)]/10 border border-[var(--color-alive)] p-4 rounded-lg text-center">
                                    <div className="text-[var(--color-alive)] mb-1">死后</div>
                                    <div className="font-bold">100% 自动转给受益人</div>
                                </div>
                            </div>
                        </div>

                        {/* Feast */}
                        <div className="relative p-8 rounded-2xl border border-[var(--color-dead)] bg-[var(--bg-primary)] shadow-[var(--glow-dead)]">
                            <div className="absolute top-0 right-0 bg-[var(--color-dead)] text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg animate-pulse">
                                狂欢模式
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-[var(--color-dead)]">🦅 Feast Mode</h3>
                            <p className="text-[var(--text-secondary)] mb-6">
                                适合 Degen 玩家。你的死亡通过喂养生态系统而更有意义。
                            </p>
                            <div className="flex flex-col gap-4 text-sm">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 bg-[var(--bg-secondary)] p-3 rounded-lg text-center">
                                        死者 Vault
                                    </div>
                                    <div className="text-xl">⤵️</div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1 bg-[var(--color-loot)]/10 border border-[var(--color-loot)] p-3 rounded-lg text-center">
                                        <div className="font-bold text-[var(--color-loot)]">50%</div>
                                        <div>秃鹫捡漏</div>
                                    </div>
                                    <div className="flex-1 bg-[var(--color-rip)]/10 border border-[var(--color-rip)] p-3 rounded-lg text-center">
                                        <div className="font-bold text-[var(--color-rip)]">50%</div>
                                        <div>公共墓地</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tokenomics & Revenue Model */}
            <div className="mx-auto max-w-4xl px-6 lg:px-8 py-20">
                <h2 className="text-3xl font-bold text-center mb-12">经济与收入模型</h2>

                {/* 资金流向图 */}
                <div className="relative p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] mb-12">
                    <h3 className="text-xl font-bold mb-8 text-center">💸 Feast Mode 资金流向</h3>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm">
                        {/* Source */}
                        <div className="w-32 py-4 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg text-center">
                            <div className="font-bold">死者 Vault</div>
                            <div className="text-xs text-[var(--text-muted)]">(总资产)</div>
                        </div>

                        <div className="hidden md:block text-2xl">➡️</div>
                        <div className="md:hidden text-2xl">⬇️</div>

                        {/* Split */}
                        <div className="flex flex-col gap-4 w-full md:w-auto">
                            {/* Looter Share */}
                            <div className="flex items-center gap-4 bg-[var(--color-loot)]/5 border border-[var(--color-loot)] p-4 rounded-lg">
                                <span className="text-2xl">🦅</span>
                                <div className="flex-1 text-left">
                                    <div className="font-bold text-[var(--color-loot)]">50%</div>
                                    <div className="text-[var(--text-secondary)]">归秃鹫 (Looter)</div>
                                </div>
                            </div>

                            {/* Graveyard Share */}
                            <div className="flex items-center gap-4 bg-[var(--color-rip)]/5 border border-[var(--color-rip)] p-4 rounded-lg relative">
                                <span className="text-2xl">🪦</span>
                                <div className="flex-1 text-left">
                                    <div className="font-bold text-[var(--color-rip)]">50%</div>
                                    <div className="text-[var(--text-secondary)]">进入公共墓地</div>

                                    {/* Graveyard Internal Split */}
                                    <div className="mt-2 pt-2 border-t border-[var(--border-default)] flex gap-4 text-xs">
                                        <div>
                                            <span className="text-white font-bold">90%</span> 奖励池
                                        </div>
                                        <div>
                                            <span className="text-white font-bold">10%</span> 协议收入
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Revenue Breakdown: All Roles */}
                <h3 className="text-xl font-bold text-center mb-8">💰 全生态收益分配</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">

                    {/* Survivor (KOL) Revenue */}
                    <div className="p-6 rounded-xl border border-[var(--color-alive)] bg-[var(--color-alive)]/5 text-center relative overflow-hidden group hover:shadow-[0_0_20px_var(--color-alive)] transition-all">
                        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-alive)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <h4 className="text-lg font-bold mb-4 text-[var(--color-alive)]">👤 幸存者</h4>
                        <div className="text-[var(--color-alive)] font-bold text-4xl mb-2">50%</div>
                        <div className="font-semibold text-white mb-2">RIP 互动收益</div>
                        <p className="text-[var(--text-secondary)] text-sm mb-4">
                            活着就是为了赚钱。<br />
                            <span className="text-[var(--text-muted)] text-xs">来源: 粉丝 RIP 费用</span>
                        </p>
                    </div>

                    {/* Vulture (Looter) Revenue */}
                    <div className="p-6 rounded-xl border border-[var(--color-loot)] bg-[var(--color-loot)]/5 text-center relative overflow-hidden group hover:shadow-[0_0_20px_var(--color-loot)] transition-all">
                        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-loot)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <h4 className="text-lg font-bold mb-4 text-[var(--color-loot)]">🦅 秃鹫</h4>
                        <div className="text-[var(--color-loot)] font-bold text-4xl mb-2">50%</div>
                        <div className="font-semibold text-white mb-2">抢夺死者遗产</div>
                        <p className="text-[var(--text-secondary)] text-sm mb-4">
                            拼手速，拼策略。<br />
                            <span className="text-[var(--text-muted)] text-xs">来源: 死者 Vault 总资产</span>
                        </p>
                    </div>

                    {/* Mourner (Fan) Revenue */}
                    <div className="p-6 rounded-xl border border-[var(--color-rip)] bg-[var(--color-rip)]/5 text-center relative overflow-hidden group hover:shadow-[0_0_20px_var(--color-rip)] transition-all">
                        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-rip)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <h4 className="text-lg font-bold mb-4 text-[var(--color-rip)]">🕯️ 吊唁者</h4>
                        <div className="text-[var(--color-rip)] font-bold text-4xl mb-2">45%</div>
                        <div className="font-semibold text-white mb-2">瓜分奖励池</div>
                        <p className="text-[var(--text-secondary)] text-sm mb-4">
                            小投入，博大回报。<br />
                            <span className="text-[var(--text-muted)] text-xs">来源: 死者 Vault 总资产</span>
                        </p>
                    </div>

                    {/* Protocol Revenue */}
                    <div className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] text-center hover:border-white transition-all">
                        <h4 className="text-lg font-bold mb-4 text-white">🏛️ 项目方</h4>
                        <div className="flex flex-col gap-4">
                            <div>
                                <div className="text-white font-bold text-2xl mb-1">50%</div>
                                <div className="text-xs text-[var(--text-muted)]">RIP 费用</div>
                            </div>
                            <div className="w-1/2 mx-auto h-px bg-[var(--border-default)]"></div>
                            <div>
                                <div className="text-white font-bold text-2xl mb-1">5%</div>
                                <div className="text-xs text-[var(--text-muted)]">死者总资产</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="mx-auto max-w-7xl px-6 lg:px-8 py-20 text-center">
                <h2 className="text-3xl font-bold mb-6">准备好加入了吗？</h2>
                <p className="text-[var(--text-secondary)] mb-8">
                    这是一场关于生存的博弈，也是对生命的终极确权。
                </p>
                <Link
                    href="/dashboard"
                    className="inline-block bg-white text-black px-12 py-4 rounded-full font-bold text-xl hover:scale-105 transition-transform"
                >
                    进入续命台
                </Link>
            </div>
        </div>
    );
}
