import { Link } from 'react-router-dom'
import { EyeOff, Database, Trash2, ArrowLeft } from 'lucide-react'

export default function Privacy() {
  return (
    <div className="min-h-screen pt-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        
        <Link to="/" className="btn-ghost text-[13px] mb-8 inline-flex">
          <ArrowLeft size={14} /> Back
        </Link>

        <p className="label mb-4">Privacy Policy</p>
        <h1 className="font-serif font-medium text-[36px] sm:text-[48px] leading-[1.1] tracking-tight mb-6">
          We don't want your data. <br/>
          <em className="text-accent-coral italic">We just want your curiosity.</em>
        </h1>

        <p className="text-[16px] text-ink-muted leading-relaxed mb-12">
          Because Pandorax is a non-profit that doesn't run advertisements, our relationship with your data is incredibly simple: we only collect exactly what is needed to make the app function for you. Nothing more.
        </p>

        <div className="flex flex-col gap-10">
          
          {/* Section 1 */}
          <section className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start">
            <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center flex-shrink-0 text-ink">
              <Database size={18} />
            </div>
            <div>
              <h3 className="font-serif font-medium text-[20px] text-ink mb-2">What we collect</h3>
              <ul className="text-[14px] text-ink-muted leading-relaxed space-y-2 list-disc list-inside">
                <li><strong>Your email address:</strong> Only used to create your account and securely log you in.</li>
                <li><strong>Your activity:</strong> Things you explicitly "like," "bookmark," or post in the forums, so we can display them back to you on your profile.</li>
                <li><strong>Anonymous analytics:</strong> Basic, aggregated counts of how many people view a Wonder or Simulation so we know what topics are resonating. This cannot be tied back to you.</li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start">
            <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center flex-shrink-0 text-ink">
              <EyeOff size={18} />
            </div>
            <div>
              <h3 className="font-serif font-medium text-[20px] text-ink mb-2">What we DON'T do</h3>
              <ul className="text-[14px] text-ink-muted leading-relaxed space-y-2 list-disc list-inside">
                <li>We do <strong>not</strong> sell, rent, or share your data with data brokers.</li>
                <li>We do <strong>not</strong> use third-party tracking pixels (like Meta Pixel or Google Ads).</li>
                <li>We do <strong>not</strong> track your browsing behavior outside of Pandorax.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start">
            <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center flex-shrink-0 text-ink">
              <Trash2 size={18} />
            </div>
            <div>
              <h3 className="font-serif font-medium text-[20px] text-ink mb-2">Your absolute right to disappear</h3>
              <p className="text-[14px] text-ink-muted leading-relaxed">
                Your data belongs to you. If you ever want to leave Pandorax, you can delete your account from your profile settings. When you press delete, your account, likes, bookmarks, and identifying data are wiped from our databases immediately and permanently.
              </p>
            </div>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-ink/10 text-[13px] text-ink-faint">
          <p>Last updated: April 2024</p>
          <p className="mt-2">If you have any questions about this policy or how we handle data, please reach out to us in the forums.</p>
        </div>

      </div>
    </div>
  )
}