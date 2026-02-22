import React from "react";
import Layout from "./../components/Layout";

const About = () => {
  return (
    <Layout title={"About us - Ecommerce app"}>
      <div className="row aboutus">
        <div className="col-md-6 ">
          <img
            src="/images/about.jpeg"
            alt="aboutus"
            style={{ width: "100%" }}
          />
        </div>
        <div className="col-md-4">
          <p className="text-justify mt-2">
            Welcome to Virtual Vault, your trusted online marketplace for
            quality products. We are committed to providing excellent service
            and a seamless shopping experience.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default About;
