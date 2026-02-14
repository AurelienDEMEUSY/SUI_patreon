import { PageContainer } from '@/components/layout';

export default function SettingsPage() {
    return (
        <PageContainer maxWidth="max-w-4xl">
            <div className="space-y-8">
                <h1 className="text-3xl font-black text-white">Settings</h1>

                <div className="glass-panel rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Account</h2>
                    <div className="flex items-center justify-between py-4 border-b border-white/5">
                        <div>
                            <p className="font-semibold">Profile</p>
                            <p className="text-sm text-gray-400">Manage your avatar and bio</p>
                        </div>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-bold transition-colors">Edit</button>
                    </div>
                    <div className="flex items-center justify-between py-4 border-b border-white/5">
                        <div>
                            <p className="font-semibold">Wallet Connection</p>
                            <p className="text-sm text-gray-400">Connected via Sui Wallet</p>
                        </div>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-bold transition-colors">Manage</button>
                    </div>
                    <div className="flex items-center justify-between py-4">
                        <div>
                            <p className="font-semibold">Notifications</p>
                            <p className="text-sm text-gray-400">Email and push preferences</p>
                        </div>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-bold transition-colors">Configure</button>
                    </div>
                </div>

                <div className="glass-panel rounded-2xl p-6 opacity-75">
                    <h2 className="text-xl font-bold text-white mb-4">Privacy & Security</h2>
                    <div className="flex items-center justify-between py-4 border-b border-white/5">
                        <div>
                            <p className="font-semibold">End-to-End Encryption</p>
                            <p className="text-sm text-gray-400">Seal keys management</p>
                        </div>
                        <span className="text-emerald-400 text-sm font-bold">Active</span>
                    </div>
                </div>

                <div className="text-center pt-4">
                    <button className="text-red-400 hover:text-red-300 text-sm font-bold transition-colors">
                        Log Out
                    </button>
                    <p className="mt-4 text-xs text-gray-600">Version 0.1.0-alpha</p>
                </div>
            </div>
        </PageContainer>
    );
}
