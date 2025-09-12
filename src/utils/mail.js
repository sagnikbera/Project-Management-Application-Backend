import Mailgen from "mailgen";

const emailVerificationMail = (username, verificationUrl) => {
  return {
    body: {
      name: username,
      intro: "Welcome to our App! We'are excited to have you on board.",
      action: {
        instructions:
          "To verify your email please click on the following button.",
        button: {
          color: "#22BC66",
          text: "Verify your email",
          link: verificationUrl,
        },
      },
      outro:
        "Need help, or have question? Connect to linkedIn (https://www.linkedin.com/in/sagnik-bera/)",
    },
  };
};

const forgotPasswordMail = (username, passwordResetUrl) => {
  return {
    body: {
      name: username,
      intro: "We got a requestt reset the password of your account.",
      action: {
        instructions:
          "To reset your password click on the following button or link.",
        button: {
          color: "#22BC66",
          text: "Reset Password",
          link: passwordResetUrl,
        },
      },
      outro:
        "Need help, or have question? Connect to linkedIn (https://www.linkedin.com/in/sagnik-bera/)",
    },
  };
};

export { emailVerificationMail, forgotPasswordMail };
