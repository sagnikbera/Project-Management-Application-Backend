import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Project-Management",
      link: "https://github.com/sagnikbera/Project-Management-Application-Backend",
    },
  });

  const emailTexual = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHTML = mailGenerator.generate(options.mailgenContent);

  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: process.env.MAILTRAP_SMTP_PORT,
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    },
  });

  const mail = {
    from: "mail.projectmanager@example.com",
    to: options.email,
    subject: options.subject,
    text: emailTexual,
    html: emailHTML,
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.error("may be happen for MAILTRAP credentials");
    console.error("Error : ", error);
  }
};

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

export { emailVerificationMail, forgotPasswordMail, sendEmail };
