import React from "react";
import Layout from "./../components/Layout";

const Policy = () => {
  return (
    <Layout title={"Privacy Policy"}>
      <div className="row policy ">
        <div className="col-md-6 ">
          <img
            src="/images/contactus.jpeg"
            alt="privacy policy"
            style={{ width: "100%" }}
          />
        </div>
        <div className="col-md-4">
          <p>
            We value your privacy and are committed to protecting your personal
            information.
          </p>
          <p>
            We collect only necessary information to process your orders and
            improve your shopping experience.
          </p>
          <p>
            Your data is securely stored and never shared with third parties
            without your consent.
          </p>
          <p>
            We use industry-standard encryption to protect your payment
            information.
          </p>
          <p>
            You have the right to access, modify, or delete your personal data
            at any time.
          </p>
          <p>
            We may use cookies to enhance your browsing experience and analyze
            site traffic.
          </p>
          <p>
            For questions about our privacy practices, please contact our
            support team.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Policy;
