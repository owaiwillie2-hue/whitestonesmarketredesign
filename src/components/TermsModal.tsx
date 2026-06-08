import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useCompanyEmail } from '@/hooks/useCompanyEmail';

interface TermsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TermsModal = ({ open, onOpenChange }: TermsModalProps) => {
  const { email: supportEmail } = useCompanyEmail();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
          <DialogDescription>
            Please read these terms carefully before using our platform.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground">
                By accessing and using Whitestones Markets ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. Use License</h3>
              <p className="text-muted-foreground">
                Permission is granted to temporarily access the materials (information or software) on Whitestones Markets for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not: modify or copy the materials; use the materials for any commercial purpose, or for any public display (commercial or non-commercial); attempt to decompile or reverse engineer any software contained on Whitestones Markets; remove any copyright or other proprietary notations from the materials; or transfer the materials to another person or "mirror" the materials on any other server.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. Investment Risks</h3>
              <p className="text-muted-foreground">
                All investments carry inherent risks. The value of investments can go down as well as up, and you may receive back less than your original investment. Past performance is not indicative of future results. You should carefully consider whether investing is suitable for you in light of your circumstances, knowledge, and financial resources. You should consult with a licensed financial advisor before making any investment decisions.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Account Registration</h3>
              <p className="text-muted-foreground">
                To use certain features of the Platform, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your password and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. KYC and Identity Verification</h3>
              <p className="text-muted-foreground">
                As part of our regulatory compliance, we require all users to complete a Know Your Customer (KYC) verification process. You agree to provide accurate identification documents and information. We reserve the right to suspend or terminate accounts that fail to complete KYC verification or provide false information.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Deposits and Withdrawals</h3>
              <p className="text-muted-foreground">
                All deposits are subject to verification and approval. Withdrawal requests are processed according to our standard procedures and may take up to 5-7 business days. We reserve the right to decline withdrawal requests that do not comply with our terms or applicable regulations. Minimum deposit and withdrawal amounts may apply.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Investment Plans</h3>
              <p className="text-muted-foreground">
                Investment plans are subject to the terms specified at the time of investment. Returns are calculated based on the plan's specified ROI percentage and duration. Early withdrawal of active investments may incur penalties or forfeit expected returns. We reserve the right to modify, suspend, or terminate investment plans with appropriate notice.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">8. Referral Program</h3>
              <p className="text-muted-foreground">
                Our referral program allows users to earn bonuses for referring new investors. Referral bonuses are subject to terms and conditions, including minimum deposit requirements by referred users. We reserve the right to withhold or revoke bonuses obtained through fraudulent means or violation of our terms.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">9. Prohibited Activities</h3>
              <p className="text-muted-foreground">
                You agree not to engage in any of the following prohibited activities: (a) copying, distributing, or disclosing any part of the Platform in any medium; (b) using any automated system to access the Platform; (c) transmitting spam, chain letters, or other unsolicited email; (d) attempting to interfere with, compromise the system integrity or security or decipher any transmissions to or from the servers running the Platform; (e) taking any action that imposes an unreasonable load on our infrastructure; (f) uploading invalid data, viruses, worms, or other software agents through the Platform; (g) impersonating another person or otherwise misrepresenting your affiliation with a person or entity; (h) using the Platform for any illegal or unauthorized purpose.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">10. Fees and Charges</h3>
              <p className="text-muted-foreground">
                We may charge fees for certain services and transactions. All applicable fees will be clearly disclosed before you complete a transaction. We reserve the right to modify our fee structure with reasonable notice to users. Transaction fees, withdrawal fees, and other charges may apply.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">11. Disclaimer</h3>
              <p className="text-muted-foreground">
                The materials on Whitestones Markets are provided on an 'as is' basis. Whitestones Markets makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">12. Limitations</h3>
              <p className="text-muted-foreground">
                In no event shall Whitestones Markets or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Whitestones Markets, even if Whitestones Markets or a Whitestones Markets authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">13. Data Protection and Privacy</h3>
              <p className="text-muted-foreground">
                We are committed to protecting your personal data and privacy. Our collection, use, and disclosure of personal information is governed by our Privacy Policy. By using the Platform, you consent to our collection and use of personal data as outlined in the Privacy Policy.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">14. Security</h3>
              <p className="text-muted-foreground">
                While we implement reasonable security measures to protect your information, no method of transmission over the Internet or method of electronic storage is 100% secure. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">15. Two-Factor Authentication</h3>
              <p className="text-muted-foreground">
                We strongly recommend enabling two-factor authentication (2FA) for enhanced account security. You are responsible for maintaining the security of your 2FA device and backup codes. Loss of 2FA access may result in account recovery delays.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">16. Accuracy of Materials</h3>
              <p className="text-muted-foreground">
                The materials appearing on Whitestones Markets could include technical, typographical, or photographic errors. Whitestones Markets does not warrant that any of the materials on its website are accurate, complete or current. Whitestones Markets may make changes to the materials contained on its website at any time without notice.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">17. Links</h3>
              <p className="text-muted-foreground">
                Whitestones Markets has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Whitestones Markets of the site. Use of any such linked website is at the user's own risk.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">18. Account Termination</h3>
              <p className="text-muted-foreground">
                We reserve the right to suspend or terminate your account at any time for violation of these terms, suspicious activity, or for any other reason at our sole discretion. Upon termination, your right to use the Platform will immediately cease. We will make reasonable efforts to return any remaining balance in your account, subject to applicable fees and regulations.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">19. Dispute Resolution</h3>
              <p className="text-muted-foreground">
                Any disputes arising from these terms or your use of the Platform shall be resolved through binding arbitration in accordance with the rules of the applicable arbitration association. You waive any right to participate in a class action lawsuit or class-wide arbitration.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">20. Modifications</h3>
              <p className="text-muted-foreground">
                Whitestones Markets may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">21. Tax Obligations</h3>
              <p className="text-muted-foreground">
                You are solely responsible for determining what, if any, taxes apply to your investments and transactions through the Platform. Whitestones Markets is not responsible for determining the taxes that apply to your investments or for withholding, collecting, reporting, or remitting any taxes arising from your use of the Platform.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">22. Force Majeure</h3>
              <p className="text-muted-foreground">
                Whitestones Markets shall not be liable for any failure to perform its obligations where such failure results from any cause beyond our reasonable control, including but not limited to mechanical, electronic or communications failure or degradation, natural disasters, war, terrorism, riots, civil unrest, or government actions.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">23. Governing Law</h3>
              <p className="text-muted-foreground">
                These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">24. Severability</h3>
              <p className="text-muted-foreground">
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect and enforceable.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">25. Contact Information</h3>
              <p className="text-muted-foreground">
                If you have any questions about these Terms, please contact us at <a href={`mailto:${supportEmail}`} className="text-primary hover:underline font-bold">{supportEmail}</a>. We will make reasonable efforts to respond to your inquiries within 48 hours.
              </p>
            </section>
          </div>
        </ScrollArea>
        <div className="flex justify-end mt-4">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
