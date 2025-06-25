import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Enterprise Crypto Trading Platform',
  description: 'Professional cryptocurrency trading platform with advanced analytics and social features',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            🚀 Enterprise Crypto Trading Platform
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Professional-grade cryptocurrency trading with advanced analytics, 
            social features, and enterprise security.
          </p>
        </header>

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <h3 className="text-lg font-semibold text-white">Infrastructure</h3>
            </div>
            <p className="text-gray-300">
              ✅ AWS ECS Cluster Active<br/>
              ✅ PostgreSQL Database Online<br/>
              ✅ Redis Cache Available<br/>
              ✅ Load Balancer Configured
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
              <h3 className="text-lg font-semibold text-white">Services</h3>
            </div>
            <p className="text-gray-300">
              🔄 Telegram Bot Deploying<br/>
              🔄 Web App Deploying<br/>
              🔄 Trading Engine Deploying<br/>
              ⏳ ML Analytics Pending
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <h3 className="text-lg font-semibold text-white">Features</h3>
            </div>
            <p className="text-gray-300">
              📱 Telegram Bot Interface<br/>
              💹 Multi-Chain Trading<br/>
              🤖 AI-Powered Analytics<br/>
              👥 Social Trading Features
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h4 className="text-lg font-semibold text-white mb-2">Ultra-Fast Trading</h4>
            <p className="text-gray-400 text-sm">Sub-50ms execution across multiple exchanges</p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl mb-4">🛡️</div>
            <h4 className="text-lg font-semibold text-white mb-2">Enterprise Security</h4>
            <p className="text-gray-400 text-sm">Bank-grade security with zero-trust architecture</p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl mb-4">🌐</div>
            <h4 className="text-lg font-semibold text-white mb-2">Multi-Chain Support</h4>
            <p className="text-gray-400 text-sm">Trade across Ethereum, Solana, BSC, and more</p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <h4 className="text-lg font-semibold text-white mb-2">Advanced Analytics</h4>
            <p className="text-gray-400 text-sm">AI-powered insights and predictive analytics</p>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Coming Soon</h2>
          <div className="bg-white/5 backdrop-blur-lg rounded-lg p-8 border border-white/10">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">🤖 Telegram Bot</h3>
                <ul className="text-gray-300 text-left space-y-2">
                  <li>• Instant trading commands</li>
                  <li>• Portfolio management</li>
                  <li>• Price alerts and notifications</li>
                  <li>• Copy trading features</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">💹 Trading Dashboard</h3>
                <ul className="text-gray-300 text-left space-y-2">
                  <li>• TradingView charts integration</li>
                  <li>• Real-time portfolio tracking</li>
                  <li>• Advanced order types</li>
                  <li>• Social trading feed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 pt-8 border-t border-white/10">
          <p className="text-gray-400">
            Enterprise Crypto Trading Platform • Built with Next.js, AWS, and ❤️
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Status: Infrastructure Deployed • Services Deploying • Ready for Development
          </p>
        </footer>
      </div>
    </div>
  );
}
